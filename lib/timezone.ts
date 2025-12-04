/**
 * Timezone utility functions for the poolUp app
 */

/**
 * Get the user's current timezone
 */
export const getUserTimezone = (): string => {
  try {
    // Get the user's timezone using Intl API
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || 'UTC';
  } catch (error) {
    console.warn('Failed to detect user timezone:', error);
    return 'UTC';
  }
};

/**
 * Update user's timezone in the database
 */
export const updateUserTimezone = async (userClerkId: string): Promise<void> => {
  try {
    const { fetchAPI } = await import('./fetch');
    const timezone = getUserTimezone();
    
    console.log(`Updating timezone for user ${userClerkId} to ${timezone}`);
    
    const data = await fetchAPI('/api/users/timezone', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId: userClerkId,
        timezone: timezone
      })
    });

    if (data.success) {
      console.log(`✅ Successfully updated timezone for ${userClerkId} to ${timezone}`);
    } else {
      console.warn('Failed to update timezone:', data.error);
    }
  } catch (error) {
    console.warn('Failed to update user timezone:', error);
  }
};

/**
 * Format a date string in the user's local timezone
 */
export const formatDateInTimezone = (dateString: string, timezone?: string): {
  dayStr: string;
  timeStr: string;
  fullTimeStr: string;
} => {
  const date = new Date(dateString);
  const userTimezone = timezone || getUserTimezone();
  
  const dayStr = date.toLocaleDateString('en-US', { 
    weekday: 'long',
    timeZone: userTimezone
  });
  
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    timeZone: userTimezone
  });
  
  const fullTimeStr = `${dayStr} ${timeStr}`;
  
  return { dayStr, timeStr, fullTimeStr };
};