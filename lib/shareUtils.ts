import { Alert, Share } from 'react-native';

/**
 * Format ride details for sharing
 */
export const formatRideShareText = (ride: any): string => {
  const date = new Date(ride.departureTime || ride.departure_time);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  const formattedTime = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const from = ride.from || ride.origin?.label || 'Unknown';
  const to = ride.to || ride.destination?.label || 'Unknown';
  const price = ride.price || ride.pricePerSeat || ride.price_per_seat || 0;
  const availableSeats = ride.seats_available || ride.availableSeats || 0;

  return `Join my poolUp ride!\n\n` +
         `Route: ${from} → ${to}\n` +
         `Date: ${formattedDate} at ${formattedTime}\n` +
         `Price: $${price}/seat\n` +
         `Available: ${availableSeats} seats`;
};

/**
 * Share a ride using native share dialog
 */
export const shareRide = async (ride: any): Promise<boolean> => {
  try {
    const shareText = formatRideShareText(ride);

    const result = await Share.share({
      message: shareText,
      title: 'Share Ride',
    });

    if (result.action === Share.sharedAction) {
      return true;
    } else if (result.action === Share.dismissedAction) {
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('Error sharing ride:', error);
    Alert.alert('Error', 'Failed to share ride. Please try again.');
    return false;
  }
};