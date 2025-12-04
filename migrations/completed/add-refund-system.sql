-- Refund System Implementation for Loop Rideshare
-- Adds comprehensive refund tracking and penalty system

BEGIN;


-- STEP 1: Add refund-related columns to bookings table


-- Add payment tracking and refund fields to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20) DEFAULT NULL CHECK (refund_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS cancellation_fee NUMERIC(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_refund_status ON bookings(refund_status);
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at);


-- STEP 2: Create booking_refunds tracking table


CREATE TABLE IF NOT EXISTS booking_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    payment_intent_id VARCHAR(255) NOT NULL,
    -- Amount details
    original_amount NUMERIC(8,2) NOT NULL,
    refund_amount NUMERIC(8,2) NOT NULL,
    penalty_amount NUMERIC(8,2) NOT NULL,
    penalty_percentage NUMERIC(5,2) NOT NULL,
    -- Timing details
    cancelled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    departure_time TIMESTAMPTZ NOT NULL,
    hours_before_departure NUMERIC(8,2) NOT NULL,
    -- Stripe details
    stripe_refund_id VARCHAR(255),
    stripe_refund_status VARCHAR(50),
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    reason TEXT,
    error_message TEXT,
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Indexes for booking_refunds
CREATE INDEX IF NOT EXISTS idx_refunds_booking ON booking_refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_intent ON booking_refunds(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe ON booking_refunds(stripe_refund_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON booking_refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created ON booking_refunds(created_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_refund_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.processed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refund_updated_at
    BEFORE UPDATE ON booking_refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_refund_updated_at();


-- STEP 3: Create refund calculation function


CREATE OR REPLACE FUNCTION calculate_refund_amount(
    p_original_amount NUMERIC(8,2),
    p_departure_time TIMESTAMPTZ,
    p_cancelled_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    refund_amount NUMERIC(8,2),
    penalty_amount NUMERIC(8,2),
    penalty_percentage NUMERIC(5,2),
    hours_before_departure NUMERIC(8,2),
    reason TEXT,
    message TEXT
) AS $$
DECLARE
    v_hours_before NUMERIC(8,2);
    v_penalty_pct NUMERIC(5,2);
    v_penalty_amt NUMERIC(8,2);
    v_refund_amt NUMERIC(8,2);
    v_reason TEXT;
    v_message TEXT;
BEGIN
    -- Calculate hours before departure
    v_hours_before := EXTRACT(EPOCH FROM (p_departure_time - p_cancelled_at)) / 3600.0;
    
    -- Determine penalty based on timing
    IF v_hours_before >= 24 THEN
        v_penalty_pct := 0;
        v_reason := 'Free cancellation (24+ hours notice)';
    ELSIF v_hours_before >= 2 THEN
        v_penalty_pct := 20;
        v_reason := 'Standard cancellation (2-24 hours notice)';
    ELSIF v_hours_before >= 0.5 THEN
        v_penalty_pct := 50;
        v_reason := 'Late cancellation (30min-2 hours notice)';
    ELSE
        v_penalty_pct := 100;
        v_reason := 'No refund (less than 30 minutes notice)';
    END IF;
    
    -- Calculate amounts
    v_penalty_amt := (p_original_amount * v_penalty_pct) / 100;
    v_refund_amt := GREATEST(0, p_original_amount - v_penalty_amt);
    
    -- Create user message
    IF v_penalty_pct = 0 THEN
        v_message := 'Full refund of $' || v_refund_amt::TEXT || ' will be processed within 3-5 business days.';
    ELSIF v_penalty_pct = 100 THEN
        v_message := 'No refund available for last-minute cancellations.';
    ELSE
        v_message := 'Refund of $' || v_refund_amt::TEXT || ' will be processed within 3-5 business days (' || v_penalty_pct::TEXT || '% cancellation fee applied).';
    END IF;
    
    RETURN QUERY SELECT 
        v_refund_amt,
        v_penalty_amt,
        v_penalty_pct,
        v_hours_before,
        v_reason,
        v_message;
END;
$$ LANGUAGE plpgsql;


-- STEP 4: Create function to handle booking cancellation with refunds


CREATE OR REPLACE FUNCTION cancel_booking_with_refund(
    p_booking_id UUID,
    p_stripe_refund_id VARCHAR(255) DEFAULT NULL,
    p_cancellation_reason TEXT DEFAULT 'User requested cancellation'
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    refund_amount NUMERIC(8,2),
    penalty_amount NUMERIC(8,2),
    refund_id UUID
) AS $$
DECLARE
    v_booking RECORD;
    v_refund_calc RECORD;
    v_refund_id UUID;
    v_needs_refund BOOLEAN;
BEGIN
    -- Get booking with payment details
    SELECT 
        b.*,
        r.departure_time,
        pi.payment_intent_id,
        pi.amount_dollars as paid_amount
    INTO v_booking
    FROM bookings b
    JOIN rides r ON b.ride_id = r.id
    LEFT JOIN payment_intents pi ON pi.payment_intent_id = b.payment_intent_id
    WHERE b.id = p_booking_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Booking not found'::TEXT, 0::NUMERIC(8,2), 0::NUMERIC(8,2), NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if already cancelled
    IF v_booking.status = 'cancelled' THEN
        RETURN QUERY SELECT FALSE, 'Booking is already cancelled'::TEXT, 0::NUMERIC(8,2), 0::NUMERIC(8,2), NULL::UUID;
        RETURN;
    END IF;
    
    -- Calculate refund amount
    SELECT * INTO v_refund_calc FROM calculate_refund_amount(
        COALESCE(v_booking.paid_amount, v_booking.total_price),
        v_booking.departure_time
    );
    
    v_needs_refund := v_booking.status = 'paid' AND v_refund_calc.refund_amount > 0;
    
    -- Create refund record if needed
    IF v_needs_refund THEN
        INSERT INTO booking_refunds (
            booking_id,
            payment_intent_id,
            original_amount,
            refund_amount,
            penalty_amount,
            penalty_percentage,
            departure_time,
            hours_before_departure,
            stripe_refund_id,
            status,
            reason
        ) VALUES (
            p_booking_id,
            v_booking.payment_intent_id,
            COALESCE(v_booking.paid_amount, v_booking.total_price),
            v_refund_calc.refund_amount,
            v_refund_calc.penalty_amount,
            v_refund_calc.penalty_percentage,
            v_booking.departure_time,
            v_refund_calc.hours_before_departure,
            p_stripe_refund_id,
            CASE WHEN p_stripe_refund_id IS NOT NULL THEN 'completed' ELSE 'pending' END,
            v_refund_calc.reason
        ) RETURNING id INTO v_refund_id;
    END IF;
    
    -- Update booking status
    UPDATE bookings 
    SET 
        status = 'cancelled',
        cancelled_at = NOW(),
        refund_amount = v_refund_calc.refund_amount,
        cancellation_fee = v_refund_calc.penalty_amount,
        refund_status = CASE WHEN v_needs_refund THEN 'pending' ELSE NULL END,
        cancellation_reason = p_cancellation_reason
    WHERE id = p_booking_id;
    
    RETURN QUERY SELECT 
        TRUE,
        v_refund_calc.message,
        v_refund_calc.refund_amount,
        v_refund_calc.penalty_amount,
        v_refund_id;
END;
$$ LANGUAGE plpgsql;


-- STEP 5: Add helpful views for refund analytics


CREATE OR REPLACE VIEW refund_summary AS
SELECT 
    DATE_TRUNC('day', cancelled_at) as cancellation_date,
    COUNT(*) as total_cancellations,
    COUNT(CASE WHEN refund_amount > 0 THEN 1 END) as refunds_processed,
    SUM(original_amount) as total_original_amount,
    SUM(refund_amount) as total_refunded,
    SUM(penalty_amount) as total_penalties,
    AVG(penalty_percentage) as avg_penalty_percentage,
    AVG(hours_before_departure) as avg_hours_notice
FROM booking_refunds
GROUP BY DATE_TRUNC('day', cancelled_at)
ORDER BY cancellation_date DESC;

-- Test the refund calculation function
SELECT 'TESTING REFUND CALCULATIONS:' as test_status;

-- Test different timing scenarios
SELECT 
    '24+ hours before' as scenario,
    * 
FROM calculate_refund_amount(
    50.00,
    NOW() + INTERVAL '25 hours'
);

SELECT 
    '12 hours before' as scenario,
    * 
FROM calculate_refund_amount(
    50.00,
    NOW() + INTERVAL '12 hours'
);

SELECT 
    '1 hour before' as scenario,
    * 
FROM calculate_refund_amount(
    50.00,
    NOW() + INTERVAL '1 hour'
);

SELECT 
    '10 minutes before' as scenario,
    * 
FROM calculate_refund_amount(
    50.00,
    NOW() + INTERVAL '10 minutes'
);

SELECT 'DATABASE SCHEMA UPDATES COMPLETED!' as status;

COMMIT;