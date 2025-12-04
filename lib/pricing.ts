/**
 * Pricing and fare calculation utilities for Loop rideshare app
 * Used across ride posting, ride requests, and direct ride requests
 */

export interface PriceBreakdown {
  baseFee: number;
  distanceFee: number;
  timeFee: number;
  gasFee: number;
  peakMultiplier: number;
}

export interface PricingResult {
  suggestedPrice: number;
  priceBreakdown: PriceBreakdown;
}

export interface GroupPricingResult extends PricingResult {
  discountPercentage: number;
  discountedPrice: number;
  totalPrice: number;
  savings: number;
}

/**
 * Calculate suggested price for a ride based on distance and duration
 * @param distanceInMiles - Distance in miles
 * @param durationInMinutes - Duration in minutes
 * @returns Suggested price per seat and breakdown
 */
export const calculateSuggestedPrice = (
  distanceInMiles: number,
  durationInMinutes: number
): PricingResult => {
  // Gas cost calculation
  const CURRENT_GAS_PRICE = 3.50; // $/gallon
  const MPG_ESTIMATE = 25; // Miles per gallon
  const totalGasCost = (distanceInMiles / MPG_ESTIMATE) * CURRENT_GAS_PRICE;

  // UNIFIED CARPOOL PRICING MODEL
  const BASE_FEE = 4.50; // Covers basic wear-and-tear per trip
  const DISTANCE_RATE = 0.55; // Per mile for maintenance, insurance, depreciation
  const TIME_RATE = 0.15; // Per minute for driver's time
  const DRIVER_INCENTIVE_BASE = 3.00; // Minimum driver incentive
  const DRIVER_INCENTIVE_RATE = 0.20; // Additional incentive per mile for longer trips

  // Calculate components
  const baseFee = BASE_FEE;
  const gasFee = totalGasCost;
  const distanceFee = distanceInMiles * DISTANCE_RATE;
  const timeFee = durationInMinutes * TIME_RATE;
  const driverIncentive = Math.max(
    DRIVER_INCENTIVE_BASE,
    distanceInMiles * DRIVER_INCENTIVE_RATE
  );

  // Total suggested price per seat
  const suggestedPrice = baseFee + gasFee + distanceFee + timeFee + driverIncentive;

  return {
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    priceBreakdown: {
      baseFee: Math.round((baseFee + driverIncentive) * 100) / 100,
      distanceFee: Math.round(distanceFee * 100) / 100,
      timeFee: Math.round(timeFee * 100) / 100,
      gasFee: Math.round(gasFee * 100) / 100,
      peakMultiplier: 1.0,
    },
  };
};

/**
 * Calculate group discount based on number of seats requested
 * @param seats - Number of seats requested
 * @returns Discount percentage (0-40)
 */
export const calculateGroupDiscount = (seats: number): number => {
  if (seats === 1) return 0;
  if (seats === 2) return 15;
  if (seats === 3) return 25;
  return 40; // 4+ seats
};

/**
 * Calculate pricing with group discount applied
 * @param basePricePerSeat - Original price per seat
 * @param seats - Number of seats requested
 * @returns Pricing with discount applied
 */
export const calculateGroupPricing = (
  basePricePerSeat: number,
  seats: number,
  priceBreakdown: PriceBreakdown
): GroupPricingResult => {
  const discountPercentage = calculateGroupDiscount(seats);
  const discountMultiplier = 1 - discountPercentage / 100;
  const discountedPrice = Math.round(basePricePerSeat * discountMultiplier * 100) / 100;
  const totalPrice = Math.round(discountedPrice * seats * 100) / 100;
  const savings = Math.round((basePricePerSeat - discountedPrice) * 100) / 100;

  return {
    suggestedPrice: basePricePerSeat,
    discountPercentage,
    discountedPrice,
    totalPrice,
    savings,
    priceBreakdown,
  };
};

/**
 * Fetch distance and duration from Google Maps Distance Matrix API
 * @param originLat - Origin latitude
 * @param originLng - Origin longitude
 * @param destLat - Destination latitude
 * @param destLng - Destination longitude
 * @param apiKey - Google Maps API key
 * @returns Distance in miles and duration in minutes
 */
export const fetchDistanceAndDuration = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  apiKey: string
): Promise<{ distanceInMiles: number; durationInMinutes: number } | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&units=imperial&mode=driving&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];
      const distanceValue = element.distance.value; // meters
      const durationValue = element.duration.value; // seconds

      const distanceInMiles = Math.round(distanceValue * 0.000621371 * 100) / 100;
      const durationInMinutes = Math.round(durationValue / 60);

      return { distanceInMiles, durationInMinutes };
    }

    console.error('Distance Matrix API error:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Error fetching distance and duration:', error);
    return null;
  }
};

/**
 * Format price for display
 * @param price - Price to format
 * @returns Formatted price string (e.g., "$12.50")
 */
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

/**
 * Calculate total earnings for driver with multiple passengers
 * Used for fare splitting calculations
 * @param pricePerSeat - Price per seat
 * @param totalPassengers - Total number of passengers
 * @returns Total driver earnings
 */
export const calculateDriverEarnings = (
  pricePerSeat: number,
  totalPassengers: number
): number => {
  const discount = calculateGroupDiscount(totalPassengers);
  const discountedPrice = pricePerSeat * (1 - discount / 100);
  return Math.round(discountedPrice * totalPassengers * 100) / 100;
};
