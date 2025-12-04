BEGIN;


-- STEP 1: Backup existing data (only if table doesn't exist)


-- Check if backup table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'fare_split_pricing_log_backup') THEN
        CREATE TABLE fare_split_pricing_log_backup AS 
        SELECT * FROM fare_split_pricing_log;
        RAISE NOTICE 'Backup table created successfully';
    ELSE
        RAISE NOTICE 'Backup table already exists, skipping...';
    END IF;
END $$;

-- Show current state
SELECT 'CURRENT STATE BEFORE MIGRATION:' as status;
SELECT 
    ride_id, 
    count(*) as log_entries,
    array_agg(DISTINCT passenger_count) as passenger_counts,
    array_agg(DISTINCT discount_percentage) as discount_percentages
FROM fare_split_pricing_log 
GROUP BY ride_id 
HAVING count(*) > 1
ORDER BY ride_id;


-- STEP 2: Create or replace validate_booking_approval function


-- Drop and recreate to ensure latest version
DROP FUNCTION IF EXISTS validate_booking_approval(UUID);

CREATE FUNCTION validate_booking_approval(p_booking_id UUID)
RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_booking RECORD;
    v_ride RECORD;
    v_total_approved_seats INTEGER;
BEGIN
    -- Get booking details
    SELECT 
        b.id,
        b.ride_id,
        b.seats_booked,
        b.status,
        b.approval_status,
        r.seats_available,
        r.seats_total,
        r.status as ride_status
    INTO v_booking
    FROM bookings b
    JOIN rides r ON b.ride_id = r.id
    WHERE b.id = p_booking_id;
    
    -- Check if booking exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Booking not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if booking is in pending state
    IF v_booking.status != 'pending' THEN
        RETURN QUERY SELECT FALSE, ('Booking is not in pending state'::TEXT);
        RETURN;
    END IF;
    
    -- Check if booking is already approved
    IF v_booking.approval_status = 'approved' THEN
        RETURN QUERY SELECT FALSE, ('Booking is already approved'::TEXT);
        RETURN;
    END IF;
    
    -- Check if ride is active
    IF v_booking.ride_status IN ('cancelled', 'completed') THEN
        RETURN QUERY SELECT FALSE, ('Ride is ' || v_booking.ride_status)::TEXT;
        RETURN;
    END IF;
    
    -- Calculate total approved seats (excluding current booking)
    SELECT COALESCE(SUM(seats_booked), 0)
    INTO v_total_approved_seats
    FROM bookings
    WHERE ride_id = v_booking.ride_id
    AND id != p_booking_id
    AND approval_status = 'approved'
    AND status NOT IN ('cancelled', 'expired');
    
    -- Check if there are enough seats available
    IF (v_total_approved_seats + v_booking.seats_booked) > v_booking.seats_total THEN
        RETURN QUERY SELECT FALSE, ('Not enough seats available. Only ' || 
            (v_booking.seats_total - v_total_approved_seats) || ' seats remaining')::TEXT;
        RETURN;
    END IF;
    
    -- All validations passed
    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;


-- STEP 3: Update the fare splitting functions with fixes


-- Check if functions exist and their current state
SELECT 'CHECKING EXISTING FUNCTIONS:' as status;
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('update_ride_split_pricing', 'get_ride_split_pricing', 'calculate_split_pricing')
LIMIT 5;

-- Only proceed if calculate_split_pricing exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_split_pricing') THEN
        RAISE EXCEPTION 'Required function calculate_split_pricing does not exist. Please run fare_splitting_schema.sql first.';
    END IF;
END $$;

-- Drop and recreate update_ride_split_pricing
DROP FUNCTION IF EXISTS update_ride_split_pricing(UUID);

CREATE FUNCTION update_ride_split_pricing(p_ride_id UUID)
RETURNS TABLE (
    new_price_per_seat NUMERIC(8,2),
    discount_applied NUMERIC(5,2),
    total_passengers INTEGER
) AS $$
DECLARE
    v_original_price NUMERIC(8,2);
    v_fare_splitting_enabled BOOLEAN;
    v_confirmed_passengers INTEGER;
    v_pricing_result RECORD;
BEGIN
    -- Get ride info
    SELECT original_price_per_seat, fare_splitting_enabled 
    INTO v_original_price, v_fare_splitting_enabled
    FROM rides 
    WHERE id = p_ride_id;
    
    -- If ride not found, return error
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ride % not found', p_ride_id;
    END IF;
    
    -- If fare splitting not enabled, return original pricing
    IF NOT v_fare_splitting_enabled THEN
        RETURN QUERY SELECT v_original_price, 0::NUMERIC(5,2), 1;
        RETURN;
    END IF;
    
    -- Count ALL approved passengers (not just paid ones)
    SELECT COALESCE(SUM(seats_booked), 0)::INTEGER
    INTO v_confirmed_passengers
    FROM bookings 
    WHERE ride_id = p_ride_id 
    AND approval_status = 'approved'
    AND status NOT IN ('cancelled', 'expired');
    
    -- If no confirmed passengers, use minimum of 1
    v_confirmed_passengers := GREATEST(v_confirmed_passengers, 1);
    
    -- Calculate split pricing
    SELECT * INTO v_pricing_result
    FROM calculate_split_pricing(v_original_price, v_confirmed_passengers);
    
    -- Update ride price
    UPDATE rides 
    SET price = v_pricing_result.discounted_price
    WHERE id = p_ride_id;
    
    -- Update existing approved bookings
    UPDATE bookings 
    SET 
        price_per_seat = v_pricing_result.discounted_price,
        split_discount_applied = v_pricing_result.discount_percentage,
        passenger_count_at_booking = v_confirmed_passengers
    WHERE ride_id = p_ride_id 
    AND approval_status = 'approved'
    AND status NOT IN ('cancelled', 'expired');
    
    -- Clean up and insert new log entry
    DELETE FROM fare_split_pricing_log WHERE ride_id = p_ride_id;
    
    INSERT INTO fare_split_pricing_log (
        ride_id, passenger_count, original_price, split_price, 
        discount_percentage, total_driver_earnings
    ) VALUES (
        p_ride_id, v_confirmed_passengers, v_original_price,
        v_pricing_result.discounted_price, v_pricing_result.discount_percentage,
        v_pricing_result.driver_earnings
    );
    
    RETURN QUERY SELECT 
        v_pricing_result.discounted_price,
        v_pricing_result.discount_percentage,
        v_confirmed_passengers;
END;
$$ LANGUAGE plpgsql;


-- STEP 4: Update get_ride_split_pricing function


DROP FUNCTION IF EXISTS get_ride_split_pricing(UUID);

CREATE FUNCTION get_ride_split_pricing(p_ride_id UUID)
RETURNS TABLE (
    base_price NUMERIC(8,2),
    current_price_per_seat NUMERIC(8,2),
    discount_percentage NUMERIC(5,2),
    confirmed_passengers INTEGER,
    pending_passengers INTEGER,
    driver_earnings NUMERIC(8,2),
    fare_splitting_enabled BOOLEAN
) AS $$
DECLARE
    v_ride RECORD;
    v_confirmed INTEGER;
    v_pending INTEGER;
    v_pricing RECORD;
BEGIN
    -- Get ride details
    SELECT original_price_per_seat, price, fare_splitting_enabled
    INTO v_ride
    FROM rides WHERE id = p_ride_id;
    
    -- Count passengers by status
    SELECT 
        COALESCE(SUM(CASE WHEN approval_status = 'approved' AND status NOT IN ('cancelled', 'expired') THEN seats_booked ELSE 0 END), 0)::INTEGER,
        COALESCE(SUM(CASE WHEN status = 'pending' OR approval_status = 'pending' THEN seats_booked ELSE 0 END), 0)::INTEGER
    INTO v_confirmed, v_pending
    FROM bookings 
    WHERE ride_id = p_ride_id;
    
    -- Calculate current pricing
    SELECT * INTO v_pricing
    FROM calculate_split_pricing(v_ride.original_price_per_seat, GREATEST(v_confirmed, 1));
    
    RETURN QUERY SELECT 
        v_ride.original_price_per_seat,
        v_pricing.discounted_price,
        v_pricing.discount_percentage,
        v_confirmed,
        v_pending,
        v_pricing.driver_earnings,
        v_ride.fare_splitting_enabled;
END;
$$ LANGUAGE plpgsql;


-- STEP 5: Fix existing data


SELECT 'FIXING EXISTING RIDES WITH FARE SPLITTING:' as status;

DO $$
DECLARE
    ride_record RECORD;
    fix_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    FOR ride_record IN 
        SELECT id FROM rides WHERE fare_splitting_enabled = true
    LOOP
        BEGIN
            PERFORM update_ride_split_pricing(ride_record.id);
            fix_count := fix_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE 'Error fixing ride %: %', ride_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Fixed % rides, % errors', fix_count, error_count;
END $$;


-- STEP 6: Verify the fixes


SELECT 'VERIFICATION - AFTER MIGRATION:' as status;

-- Check fare split logs
SELECT 
    ride_id, 
    count(*) as log_entries,
    passenger_count,
    discount_percentage,
    total_driver_earnings
FROM fare_split_pricing_log 
GROUP BY ride_id, passenger_count, discount_percentage, total_driver_earnings
ORDER BY ride_id
LIMIT 10;

-- Check bookings consistency
SELECT 'BOOKING CONSISTENCY CHECK:' as status;
SELECT 
    r.id as ride_id,
    r.price as current_ride_price,
    r.original_price_per_seat,
    COUNT(b.id) as approved_bookings,
    array_agg(DISTINCT b.price_per_seat) as booking_prices,
    array_agg(DISTINCT b.split_discount_applied) as discounts_applied
FROM rides r
LEFT JOIN bookings b ON r.id = b.ride_id 
    AND b.approval_status = 'approved' 
    AND b.status NOT IN ('cancelled', 'expired')
WHERE r.fare_splitting_enabled = true
GROUP BY r.id, r.price, r.original_price_per_seat
HAVING COUNT(b.id) > 0
ORDER BY r.id
LIMIT 10;

SELECT 'MIGRATION COMPLETED!' as status;

COMMIT;