export interface CreateBookingParams {
  clerkId: string;
  rideId: string;
  seatsRequested: number;
  paymentIntentId?: string;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  error?: string;
  message?: string;
}

export const createBooking = async (params: CreateBookingParams): Promise<BookingResponse> => {
  try {
    console.log('Creating booking with params:', params);

    const { fetchAPI } = await import('./fetch');
    const data = await fetchAPI('/api/bookings/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    return data;
  } catch (error) {
    console.error('Booking creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create booking'
    };
  }
};

// Function to call after successful Stripe payment
export const confirmBookingPayment = async (
  bookingId: string, 
  paymentIntentId: string
): Promise<BookingResponse> => {
  try {
    const { fetchAPI } = await import('./fetch');
    const data = await fetchAPI(`/api/bookings/${bookingId}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
    });

    return data;
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm payment'
    };
  }
};