import Constants from 'expo-constants';

/**
 * Centralized environment variable access for reliable cross-platform usage
 * This ensures environment variables work in both development and built apps
 */

// Get environment variable using multiple fallback methods for reliability
const getEnvironmentVariable = (key: string, fallback?: string): string | undefined => {
  // Method 1: Try Constants.expoConfig.extra (most reliable in builds)
  const fromExpoConfig = Constants.expoConfig?.extra?.[key];
  
  // Method 2: Try environment variables (works in development)
  const fromEnv = process.env[key];
  
  // Method 3: Use fallback if provided
  const result = fromExpoConfig || fromEnv || fallback;
  
  // Debug logging for troubleshooting
  if (__DEV__) {
    console.log(`Environment Variable ${key}:`, {
      fromExpoConfig,
      fromEnv,
      fallback,
      finalValue: result ? 'SET' : 'MISSING'
    });
  }
  
  return result;
};

// Specific environment variable getters
export const getGoogleApiKey = (): string | undefined => {
  return getEnvironmentVariable('EXPO_PUBLIC_GOOGLE_API_KEY', undefined);
};

export const getDirectionsApiKey = (): string | undefined => {
  return getEnvironmentVariable('EXPO_PUBLIC_DIRECTIONS_API_KEY', undefined);
};

export const getClerkPublishableKey = (): string | undefined => {
  return getEnvironmentVariable('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY', undefined);
};

export const getStripePublishableKey = (): string | undefined => {
  return getEnvironmentVariable('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY', undefined);
};

export const getApiUrl = (): string => {
  return getEnvironmentVariable('EXPO_PUBLIC_API_URL', 'https://loop-api-gilt.vercel.app') || 'https://loop-api-gilt.vercel.app';
};

export const getApiUrlDev = (): string => {
  return getEnvironmentVariable('EXPO_PUBLIC_API_URL_DEV', 'https://loop-api-gilt.vercel.app') || 'https://loop-api-gilt.vercel.app';
};

// Generic getter for other environment variables
export const getEnvVar = getEnvironmentVariable;

// Validation helper
export const validateRequiredEnvVars = (): { valid: boolean; missing: string[] } => {
  const required = [
    'EXPO_PUBLIC_GOOGLE_API_KEY',
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];
  
  const missing = required.filter(key => !getEnvironmentVariable(key));
  
  return {
    valid: missing.length === 0,
    missing
  };
};