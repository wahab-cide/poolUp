-- Add missing database functions for booking validation

-- Function to validate if a booking can be approved
CREATE OR REPLACE FUNCTION validate_booking_approval(p_booking_id UUID)
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
        RETURN QUERY SELECT FALSE, 'Booking not found';
        RETURN;
    END IF;
    
    -- Check if booking is in pending state
    IF v_booking.status != 'pending' THEN
        RETURN QUERY SELECT FALSE, 'Booking is not in pending state';
        RETURN;
    END IF;
    
    -- Check if booking is already approved
    IF v_booking.approval_status = 'approved' THEN
        RETURN QUERY SELECT FALSE, 'Booking is already approved';
        RETURN;
    END IF;
    
    -- Check if ride is active
    IF v_booking.ride_status IN ('cancelled', 'completed') THEN
        RETURN QUERY SELECT FALSE, 'Ride is ' || v_booking.ride_status;
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
        RETURN QUERY SELECT FALSE, 'Not enough seats available. Only ' || 
            (v_booking.seats_total - v_total_approved_seats) || ' seats remaining';
        RETURN;
    END IF;
    
    -- All validations passed
    RETURN QUERY SELECT TRUE, NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION validate_booking_approval IS 'Validates if a booking can be approved based on ride capacity and status';