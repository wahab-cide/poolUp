/**
 * Fare Splitting and Carpooling Utilities
 * Calculates dynamic pricing based on passenger count to incentivize ride sharing
 */

export interface FareSplitCalculation {
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  totalPassengers: number;
  driverEarnings: number;
  passengerSavings: number;
}

export interface RideSharePricing {
  basePrice: number;
  totalPassengers: number;
  pricePerPassenger: number;
  totalDriverEarnings: number;
  totalPassengerCost: number;
  discountApplied: number;
}

/**
 * Calculate fare splitting discount based on passenger count
 */
export function calculateFareSplit(
  basePricePerSeat: number,
  totalPassengers: number
): FareSplitCalculation {
  if (totalPassengers <= 0) {
    throw new Error('Total passengers must be greater than 0');
  }

  let discountPercentage: number;
  
  // Progressive discount based on passenger count
  switch (totalPassengers) {
    case 1:
      discountPercentage = 0; // No discount for solo riders
      break;
    case 2:
      discountPercentage = 25; // 25% off each - driver gets 150% total
      break;
    case 3:
      discountPercentage = 40; // 40% off each - driver gets 180% total
      break;
    case 4:
      discountPercentage = 50; // 50% off each - driver gets 200% total
      break;
    default: // 5+ passengers
      discountPercentage = 50; // Max 50% discount
      break;
  }

  const discountedPrice = basePricePerSeat * (1 - discountPercentage / 100);
  const driverEarnings = discountedPrice * totalPassengers;
  const passengerSavings = basePricePerSeat - discountedPrice;

  return {
    originalPrice: basePricePerSeat,
    discountedPrice,
    discountPercentage,
    totalPassengers,
    driverEarnings,
    passengerSavings
  };
}

/**
 * Calculate complete ride share pricing information
 */
export function calculateRideSharePricing(
  basePrice: number,
  confirmedPassengers: number,
  pendingPassengers: number = 0
): RideSharePricing {
  const totalPassengers = confirmedPassengers + pendingPassengers;
  const fareSplit = calculateFareSplit(basePrice, Math.max(1, confirmedPassengers));
  
  return {
    basePrice,
    totalPassengers,
    pricePerPassenger: fareSplit.discountedPrice,
    totalDriverEarnings: fareSplit.driverEarnings,
    totalPassengerCost: fareSplit.discountedPrice * confirmedPassengers,
    discountApplied: fareSplit.discountPercentage
  };
}

/**
 * Calculate potential savings preview for riders considering joining
 */
export function calculatePotentialSavings(
  basePrice: number,
  currentPassengers: number,
  maxPassengers: number = 4
): Array<{passengers: number, pricePerPassenger: number, savings: number}> {
  const scenarios = [];
  
  for (let passengers = currentPassengers; passengers <= maxPassengers; passengers++) {
    const fareSplit = calculateFareSplit(basePrice, passengers);
    scenarios.push({
      passengers,
      pricePerPassenger: fareSplit.discountedPrice,
      savings: fareSplit.passengerSavings
    });
  }
  
  return scenarios;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Calculate refund amount when a passenger cancels from a shared ride
 */
export function calculateCancellationRefund(
  originalPayment: number,
  remainingPassengers: number,
  basePrice: number
): {
  refundAmount: number;
  newPricePerPassenger: number;
  priceIncrease: number;
} {
  if (remainingPassengers <= 0) {
    return {
      refundAmount: originalPayment,
      newPricePerPassenger: basePrice,
      priceIncrease: 0
    };
  }

  const newFareSplit = calculateFareSplit(basePrice, remainingPassengers);
  const priceIncrease = newFareSplit.discountedPrice - originalPayment;
  
  return {
    refundAmount: originalPayment,
    newPricePerPassenger: newFareSplit.discountedPrice,
    priceIncrease: Math.max(0, priceIncrease)
  };
}

/**
 * Check if fare splitting is enabled for a ride
 */
export function isFareSplittingEligible(
  rideType: 'post' | 'request',
  seatsTotal: number,
  driverOptIn: boolean = true
): boolean {
  // Only driver posts with multiple seats and driver opt-in
  return rideType === 'post' && seatsTotal > 1 && driverOptIn;
}

/**
 * Calculate driver earnings summary with fare splitting
 */
export function calculateDriverEarningsSummary(
  basePrice: number,
  bookings: Array<{passengers: number, status: 'paid' | 'pending' | 'cancelled'}>
): {
  confirmedEarnings: number;
  pendingEarnings: number;
  totalPotentialEarnings: number;
  averageDiscount: number;
} {
  let confirmedEarnings = 0;
  let pendingEarnings = 0;
  let totalDiscounts = 0;
  let validBookings = 0;

  bookings.forEach(booking => {
    if (booking.status === 'cancelled') return;
    
    const fareSplit = calculateFareSplit(basePrice, booking.passengers);
    const earnings = fareSplit.driverEarnings;
    
    if (booking.status === 'paid') {
      confirmedEarnings += earnings;
    } else {
      pendingEarnings += earnings;
    }
    
    totalDiscounts += fareSplit.discountPercentage;
    validBookings++;
  });

  return {
    confirmedEarnings,
    pendingEarnings,
    totalPotentialEarnings: confirmedEarnings + pendingEarnings,
    averageDiscount: validBookings > 0 ? totalDiscounts / validBookings : 0
  };
}