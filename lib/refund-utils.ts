/**
 * Refund calculation utilities for frontend preview
 * Matches the backend calculation logic for consistent UX
 */

export interface RefundCalculation {
  originalAmount: number;
  refundAmount: number;
  penaltyAmount: number;
  penaltyPercentage: number;
  hoursBeforeDeparture: number;
  reason: string;
  message: string;
  canCancel: boolean;
}

/**
 * Calculate refund amount and penalty for a booking cancellation (frontend preview)
 */
export function calculateRefundPreview(
  originalAmount: number,
  departureTime: string | Date,
  cancelledAt: Date = new Date()
): RefundCalculation {
  const departure = new Date(departureTime);
  const cancelled = new Date(cancelledAt);
  
  // Calculate hours before departure
  const hoursBeforeDeparture = (departure.getTime() - cancelled.getTime()) / (1000 * 60 * 60);
  
  let penaltyPercentage = 0;
  let reason = '';
  let canCancel = true;
  
  // Determine penalty based on timing
  if (hoursBeforeDeparture < -0.5) {
    // More than 30 minutes after departure
    penaltyPercentage = 100;
    reason = 'Cannot cancel (ride departed more than 30 minutes ago)';
    canCancel = false;
  } else if (hoursBeforeDeparture >= 24) {
    penaltyPercentage = 0;
    reason = 'Free cancellation (24+ hours notice)';
  } else if (hoursBeforeDeparture >= 2) {
    penaltyPercentage = 20;
    reason = 'Standard cancellation (2-24 hours notice)';
  } else if (hoursBeforeDeparture >= 0.5) {
    penaltyPercentage = 50;
    reason = 'Late cancellation (30min-2 hours notice)';
  } else {
    penaltyPercentage = 100;
    reason = 'No refund (less than 30 minutes notice)';
  }
  
  // Calculate amounts
  const penaltyAmount = (originalAmount * penaltyPercentage) / 100;
  const refundAmount = Math.max(0, originalAmount - penaltyAmount);
  
  // Create user message
  let message = '';
  if (!canCancel) {
    message = 'This booking cannot be cancelled as the ride departed more than 30 minutes ago.';
  } else if (penaltyPercentage === 0) {
    message = `Full refund of $${refundAmount.toFixed(2)} will be processed within 3-5 business days.`;
  } else if (penaltyPercentage === 100) {
    message = 'No refund available for last-minute cancellations.';
  } else {
    message = `Refund of $${refundAmount.toFixed(2)} will be processed within 3-5 business days (${penaltyPercentage}% cancellation fee applies).`;
  }
  
  return {
    originalAmount,
    refundAmount,
    penaltyAmount,
    penaltyPercentage,
    hoursBeforeDeparture,
    reason,
    message,
    canCancel
  };
}

/**
 * Get cancellation time categories for UI display
 */
export function getCancellationTimeCategory(hoursBeforeDeparture: number): {
  category: 'free' | 'standard' | 'late' | 'no-refund' | 'too-late';
  color: string;
  icon: string;
} {
  if (hoursBeforeDeparture < -0.5) {
    return {
      category: 'too-late',
      color: '#EF4444', // Red
      icon: 'close-circle'
    };
  } else if (hoursBeforeDeparture >= 24) {
    return {
      category: 'free',
      color: '#F97316', // Purple
      icon: 'checkmark-circle'
    };
  } else if (hoursBeforeDeparture >= 2) {
    return {
      category: 'standard',
      color: '#F59E0B', // Amber
      icon: 'information-circle'
    };
  } else if (hoursBeforeDeparture >= 0.5) {
    return {
      category: 'late',
      color: '#EF4444', // Red
      icon: 'warning'
    };
  } else {
    return {
      category: 'no-refund',
      color: '#EF4444', // Red
      icon: 'close-circle'
    };
  }
}

/**
 * Format refund policy text for display
 */
export function getRefundPolicyText(): string {
  return `Cancellation Policy:
• More than 24 hours before departure: 100% refund
• 2-24 hours before departure: 80% refund (20% fee)
• 30 minutes - 2 hours before departure: 50% refund (50% fee)
• Less than 30 minutes before departure: No refund
• After departure (30+ minutes): Cannot cancel`;
}

/**
 * Get time remaining until departure for display
 */
export function getTimeUntilDeparture(departureTime: string | Date): {
  hours: number;
  minutes: number;
  isAfterDeparture: boolean;
  displayText: string;
} {
  const departure = new Date(departureTime);
  const now = new Date();
  const diffMs = departure.getTime() - now.getTime();
  const isAfterDeparture = diffMs < 0;
  
  const absDiffMs = Math.abs(diffMs);
  const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
  const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  let displayText = '';
  if (isAfterDeparture) {
    if (hours > 0) {
      displayText = `${hours}h ${minutes}m ago`;
    } else {
      displayText = `${minutes}m ago`;
    }
  } else {
    if (hours > 0) {
      displayText = `${hours}h ${minutes}m`;
    } else {
      displayText = `${minutes}m`;
    }
  }
  
  return {
    hours,
    minutes,
    isAfterDeparture,
    displayText
  };
}

/**
 * Validate if a booking can be cancelled based on timing
 */
export function canCancelBooking(
  departureTime: string | Date,
  bookingStatus: string
): {
  canCancel: boolean;
  reason?: string;
} {
  if (bookingStatus === 'cancelled') {
    return {
      canCancel: false,
      reason: 'Booking is already cancelled'
    };
  }
  
  if (bookingStatus === 'completed') {
    return {
      canCancel: false,
      reason: 'Cannot cancel completed booking'
    };
  }
  
  const departure = new Date(departureTime);
  const now = new Date();
  const thirtyMinutesAfterDeparture = new Date(departure.getTime() + 30 * 60 * 1000);
  
  if (now > thirtyMinutesAfterDeparture) {
    return {
      canCancel: false,
      reason: 'Cannot cancel booking as the ride departed more than 30 minutes ago'
    };
  }
  
  return {
    canCancel: true
  };
}