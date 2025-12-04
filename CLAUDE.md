# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Loop** is a React Native rideshare mobile application for iOS and Android, connecting university students for ridesharing with features including fare splitting, college verification, real-time chat, and payments via Stripe.

This app communicates with a separate backend API (loop-api) deployed on Vercel.

## Tech Stack

- **Framework**: Expo 54 with React Native 0.81
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State Management**: Zustand (store/index.ts)
- **Authentication**: Clerk
- **Payments**: Stripe React Native SDK
- **Maps**: react-native-maps with Google Places autocomplete

## Development Commands

```bash
npm install              # Install dependencies
npx expo start          # Start development server
npm run android         # Run on Android emulator
npm run ios             # Run on iOS simulator
npm run lint            # Run ESLint
```

## App Architecture

### File-Based Routing (Expo Router)

The app uses Expo Router's file-based routing with route groups:

- **app/index.tsx** - Welcome/onboarding screen
- **app/(feed)/** - Main feed where users browse rides (requires driver verification)
  - `index.tsx` - Browse available rides
  - `search.tsx` - Search for specific rides
  - `post-ride.tsx` - Create new ride (drivers only)
  - `verify-driver.tsx` - Driver verification flow
  - `ride/[rideId].tsx` - Individual ride details
- **app/(root)/** - Authenticated user features
  - `(tabs)/` - Bottom tab navigation (home, bookings, chat, profile)
  - `(auth)/` - Sign-in/sign-up screens
  - `(profiles)/` - User profile sections (settings, payments, documents, help, etc.)
  - `book-ride.tsx` - Ride booking flow
  - `confirm-ride.tsx` - Ride confirmation screen
  - `offer-ride.tsx` - Make ride offer
  - `chat-conversation.tsx` - Individual chat threads
  - `track-ride/[rideId].tsx` - Live ride tracking with maps
  - `track-ride/fullscreen-map/[rideId].tsx` - Full-screen map view

**Route Groups (parentheses):**
- `(feed)`, `(root)`, `(tabs)` don't appear in URLs - they're for organization
- Allows multiple layouts without affecting navigation structure

**Dynamic Routes:**
- `[rideId].tsx` - Matches `/ride/123`
- `[threadId].tsx` - Matches `/chat/abc`

### State Management

**Zustand Stores (store/index.ts):**
- `useLocationStore` - User location, destination coordinates and addresses
  - Automatically clears selected ride when location changes
- `useRideStore` - Rides list, selected ride, loading states
  - `searchRides()` - API call to search for rides

**Global Contexts (contexts/):**
- `NetworkContext.tsx` - Network connectivity status
- `ThemeContext.tsx` - Dark/light theme management
- `UnreadCountContext.tsx` - Unread message count tracking

### Component Organization

**Layout Components:**
- `app/_layout.tsx` - Root layout with providers (Clerk, Theme, Network, Notifications)
  - Loads custom fonts (Inter family, Jua)
  - Handles timezone detection after auth
  - Shows AnimatedSplash during initialization

**Reusable Components (components/):**
- **UI Components:**
  - `CustomButton.tsx` - Styled button component
  - `InputField.tsx` - Form input with validation
  - `GoogleTextInput.tsx` - Address autocomplete with Google Places
  - `ThemeToggle.tsx` - Dark/light mode switcher
  - `OfflineBanner.tsx` - Network status indicator

- **Loading Components:**
  - `SkeletonRideCard.tsx` - Skeleton loader for ride cards with shimmer animation
  - `SkeletonPostCard.tsx` - Skeleton loader for posted ride cards
  - `SkeletonBookingCard.tsx` - Skeleton loader for booking cards
  - `SkeletonChatThread.tsx` - Skeleton loader for chat threads
  - All skeleton components use animated shimmer effect for modern loading UX

- **Feature Components:**
  - `Map.tsx` - Main map component for browsing rides
  - `LiveTrackingMap.tsx` - Real-time ride tracking map
  - `DriverTrackingMap.tsx` - Driver's view of active ride
  - `RideCard.tsx` - Ride listing card with details
  - `Payment.tsx` - Stripe payment sheet integration
  - `RatingModal.tsx` - Rating and review submission
  - `BookingRequest.tsx` - Booking request card

- **Specialized Components:**
  - `FareSplitPricingDisplay.tsx` - Shows fare splitting calculations
  - `FareSplitConfirmationModal.tsx` - Confirms fare split bookings
  - `CollegeVerificationBadge.tsx` - Verified student indicator
  - `DriverCard.tsx` - Driver profile display
  - `VerificationModal.tsx` - Document verification flow
  - `NotificationProvider.tsx` - Push notification handler
  - `ThemedToast.tsx` - Theme-aware toast notifications

### Libraries (lib/)

- `auth.ts` - Clerk token cache implementation
- `fetch.ts` - API communication with backend (`fetchAPI` wrapper)
- `eduValidation.ts` - College email verification logic
- `fareSplitting.ts` - Fare split calculations
- `locationService.ts` - GPS and location utilities
- `map.ts` - Map helper functions
- `utils.ts` - General utilities (formatting, validation)
- `timezone.ts` - Timezone detection and updates
- `refund-utils.ts` - Payment refund calculations
- `environment.ts` - Environment variable access
- `toast.ts` - Toast notification helpers (`showSuccessToast`, `showErrorToast`)
- `toastConfig.tsx` - Theme-aware toast configuration

### Types (types/)

- `type.d.ts` - Core TypeScript definitions (Ride, User, Booking, etc.)
- `image.d.ts` - Image asset type declarations

## API Communication

**Backend API:**
- Separate repository deployed on Vercel
- Base URL configured via `EXPO_PUBLIC_API_BASE_URL`

**Making API Calls:**
```typescript
import { fetchAPI } from '@/lib/fetch';

// All requests automatically include Clerk auth token
const data = await fetchAPI('/api/rides/feed', {
  method: 'GET',
});

// POST with body
const result = await fetchAPI('/api/rides/search', {
  method: 'POST',
  body: JSON.stringify({ destinationLat, destinationLng }),
});
```

**Authentication:**
```typescript
import { useUser } from '@clerk/clerk-expo';

const { user } = useUser();
const clerkId = user?.id; // Use for API calls requiring user ID
```

## Environment Variables

Required in `.env` file:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
EXPO_PUBLIC_API_BASE_URL=https://your-api.vercel.app
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

## Path Aliases

Use `@/*` to reference files from the root:
```typescript
import { fetchAPI } from '@/lib/fetch';
import { RideCard } from '@/components/RideCard';
import { useLocationStore } from '@/store';
```

Configured in `tsconfig.json`.

## Key Features

### Fare Splitting
- Rides can enable fare splitting (`fare_splitting_enabled`)
- Price automatically divided by number of seats booked
- Components: `FareSplitPricingDisplay.tsx`, `FareSplitConfirmationModal.tsx`, `FareSplitSavingsCalculator.tsx`
- Logic: `lib/fareSplitting.ts`

### College Verification
- Users verify with .edu email to access features
- Validation: `lib/eduValidation.ts`
- UI: `CollegeVerificationBadge.tsx`, `VerificationModal.tsx`
- Verified users get trust badges

### Real-time Features
- **Chat**: Polls for new messages periodically (no WebSocket)
- **Live Tracking**: `LiveTrackingMap.tsx` polls location updates
- **Push Notifications**: Handled by `NotificationProvider.tsx`
  - Uses `hooks/useNotifications.ts` for registration and handling
  - Expo Push Notifications service

### Payment Flow
1. User books ride → API creates Stripe payment intent
2. App shows payment sheet via `Payment.tsx` component
3. User completes payment via Stripe SDK
4. Payment held until ride completion
5. Driver completes ride → payment released

### Location Services
- Uses expo-location for GPS coordinates
- Google Places API for address autocomplete (`GoogleTextInput.tsx`)
- `lib/locationService.ts` handles permissions and location updates
- Stores location in Zustand: `useLocationStore`

### Maps
- Browse rides: `Map.tsx` shows ride pickup/dropoff locations
- Live tracking: `LiveTrackingMap.tsx` shows current vehicle position
- Driver view: `DriverTrackingMap.tsx` with route directions
- Full screen: `track-ride/fullscreen-map/[rideId].tsx`
- Uses react-native-maps with Google Maps
- Directions via react-native-maps-directions

## Theme System

- Dark/light mode via `ThemeContext`
- Toggle with `ThemeToggle.tsx` component
- NativeWind classes automatically adapt: `dark:bg-gray-800`
- Status bar adjusts to theme in `app/_layout.tsx`

**Dark Mode Color Palette:**
The app uses a black-based dark theme (configured in `tailwind.config.js`):
- `#000000` - Pure black background (main screens)
- `#0D0D0D` - Surface color (modals, headers)
- `#161616` - Card background (cards, inputs, toasts)
- `rgba(255, 255, 255, 0.05)` - Subtle borders
- `rgba(255, 255, 255, 0.1)` - Medium borders
- `#3B82F6` - Primary blue accent (buttons, links)
- `#F97316` - Orange accent (prices, highlights)

**Using Dark Mode Colors:**
```typescript
// In components using dark mode
style={{
  backgroundColor: isDark ? '#161616' : '#FFFFFF',
  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB'
}}
```

## Common Patterns

### Navigation
```typescript
import { router } from 'expo-router';

// Navigate to route
router.push('/book-ride');
router.push(`/ride/${rideId}`);

// Go back
router.back();

// Replace current route
router.replace('/feed');
```

### Accessing Stores
```typescript
import { useLocationStore, useRideStore } from '@/store';

const { userLatitude, userLongitude, setUserLocation } = useLocationStore();
const { rides, isLoading, searchRides } = useRideStore();
```

### Theme-Aware Styling
```typescript
import { useTheme } from '@/contexts/ThemeContext';

const { isDark } = useTheme();

<View className={isDark ? 'bg-gray-900' : 'bg-white'}>
  <Text className="dark:text-white text-black">Hello</Text>
</View>
```

### Loading States with Skeletons
```typescript
import SkeletonRideCard from '@/components/SkeletonRideCard';

if (loading) {
  return (
    <ScrollView>
      <SkeletonRideCard />
      <SkeletonRideCard />
      <SkeletonRideCard />
    </ScrollView>
  );
}
```

### Toast Notifications
```typescript
import { showSuccessToast, showErrorToast } from '@/lib/toast';

// Success toast
showSuccessToast('Ride booked successfully!', 'Success');

// Error toast
showErrorToast('Failed to book ride', 'Error');
```

## Development Notes

- Ensure backend API is running or deployed - set `EXPO_PUBLIC_API_BASE_URL` correctly
- Google Maps API key needs Places API and Directions API enabled
- Push notifications require Expo project credentials
- Clerk handles all authentication - users are synced with backend database
- The app expects certain API response formats - see API documentation
- Use `__DEV__` flag for development-only logs
- Network connectivity monitored via `NetworkContext` - shows offline banner when disconnected
