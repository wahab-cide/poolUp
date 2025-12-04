-- Fix for stack depth limit exceeded error (Version 3)
-- Alternative approach: Remove trigger entirely and call function explicitly

BEGIN;

-- Drop the problematic trigger completely
DROP TRIGGER IF EXISTS trg_booking_split_pricing_update ON bookings;
DROP FUNCTION IF EXISTS trigger_update_split_pricing CASCADE;
DROP FUNCTION IF EXISTS trigger_update_split_pricing_smart CASCADE;

-- Keep the update function but make it safe
CREATE OR REPLACE FUNCTION update_ride_split_pricing(p_ride_id UUID)
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
    v_needs_update BOOLEAN;
BEGIN
    -- Get ride info
    SELECT original_price_per_seat, fare_splitting_enabled 
    INTO v_original_price, v_fare_splitting_enabled
    FROM rides 
    WHERE id = p_ride_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ride % not found', p_ride_id;
    END IF;
    
    -- If fare splitting not enabled, return original pricing
    IF NOT v_fare_splitting_enabled THEN
        RETURN QUERY SELECT v_original_price, 0::NUMERIC(5,2), 1;
        RETURN;
    END IF;
    
    -- Count ALL approved passengers
    SELECT COALESCE(SUM(seats_booked), 0)::INTEGER
    INTO v_confirmed_passengers
    FROM bookings 
    WHERE ride_id = p_ride_id 
    AND approval_status = 'approved'
    AND status NOT IN ('cancelled', 'expired');
    
    v_confirmed_passengers := GREATEST(v_confirmed_passengers, 1);
    
    -- Calculate split pricing
    SELECT * INTO v_pricing_result
    FROM calculate_split_pricing(v_original_price, v_confirmed_passengers);
    
    -- Check if any bookings need updating
    SELECT EXISTS (
        SELECT 1 FROM bookings 
        WHERE ride_id = p_ride_id 
        AND approval_status = 'approved'
        AND status NOT IN ('cancelled', 'expired')
        AND (price_per_seat != v_pricing_result.discounted_price 
             OR split_discount_applied != v_pricing_result.discount_percentage
             OR passenger_count_at_booking != v_confirmed_passengers)
    ) INTO v_needs_update;
    
    -- Update ride price
    UPDATE rides 
    SET price = v_pricing_result.discounted_price
    WHERE id = p_ride_id
    AND price != v_pricing_result.discounted_price;
    
    -- Only update bookings if needed
    IF v_needs_update THEN
        UPDATE bookings 
        SET 
            price_per_seat = v_pricing_result.discounted_price,
            split_discount_applied = v_pricing_result.discount_percentage,
            passenger_count_at_booking = v_confirmed_passengers
        WHERE ride_id = p_ride_id 
        AND approval_status = 'approved'
        AND status NOT IN ('cancelled', 'expired');
    END IF;
    
    -- Update fare split log
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

-- Create a function to handle booking status changes without triggers
CREATE OR REPLACE FUNCTION handle_booking_change(p_booking_id UUID)
RETURNS VOID AS $$
DECLARE
    v_ride_id UUID;
    v_fare_splitting_enabled BOOLEAN;
BEGIN
    -- Get the ride_id and check if fare splitting is enabled
    SELECT b.ride_id, r.fare_splitting_enabled
    INTO v_ride_id, v_fare_splitting_enabled
    FROM bookings b
    JOIN rides r ON b.ride_id = r.id
    WHERE b.id = p_booking_id;
    
    -- Only update if fare splitting is enabled
    IF v_fare_splitting_enabled THEN
        PERFORM update_ride_split_pricing(v_ride_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Verify no triggers exist on bookings table for fare splitting
SELECT 'Current triggers on bookings table:' as status;
SELECT tgname, tgtype 
FROM pg_trigger 
WHERE tgrelid = 'bookings'::regclass 
AND tgname LIKE '%split%';

COMMIT;

-- IMPORTANT: Now update the approve endpoint to call the function explicitly
-- In your API code, after approving a booking, add:
-- await sql`SELECT handle_booking_change(${bookingId}::UUID)`;