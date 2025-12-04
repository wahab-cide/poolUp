# poolUp - Ride-Sharing Application

## Project Overview

**poolUp** is a **ride-sharing/carpooling mobile application** built with React Native and Expo. It's designed to connect drivers and riders for shared transportation, allowing users to post rides, book seats, and coordinate travel together.

### Core Functionality
- **Ride Discovery**: Users can find nearby rides based on their location
- **Ride Posting**: Drivers can post available rides with details like origin, destination, price, and seats
- **Ride Requesting**: Non-drivers can post ride requests to find drivers
- **Booking System**: Riders can book seats on posted rides with approval workflow
- **Payment Integration**: Stripe integration for handling payments with split payment support
- **Fare Splitting**: Progressive discount system for carpooling with savings calculator
- **Real-time Chat**: In-app messaging between drivers and riders with read receipts
- **Rating System**: Dual rating system (separate driver and rider ratings)
- **Driver Verification**: Multi-step Stripe Identity verification for drivers
- **Driver Payouts**: Stripe Connect for driver earnings and withdrawals
- **Push Notifications**: Real-time notifications for ride updates with timezone support
- **Live Ride Tracking**: Real-time GPS tracking for active rides
- **Recurring Rides**: Schedule and manage repeating rides
- **Calendar Integration**: Sync rides with device calendar
- **College Verification**: EDU email validation for student verification
- **Ride Sharing**: Deep linking and public ride pages for easy sharing
- **Refund System**: Automated refund processing for cancellations

## Technology Stack

### **Frontend (Mobile App)**
- **React Native** (v0.79.4) - Cross-platform mobile development
- **Expo** (v53.0.17) - Development platform and toolchain
- **Expo Router** - File-based routing for mobile app navigation
- **TypeScript** - Type safety and better development experience

### **Backend (API)**
- **Next.js** - Serverless API framework
- **Vercel** - Deployment platform for the API
- **Node.js** - Runtime environment
- **Separate Repository** - API deployed at https://loop-api-gilt.vercel.app

### **Authentication & User Management**
- **Clerk** - Complete authentication solution with user management
- **@clerk/clerk-expo** - Expo integration for Clerk

### **Database**
- **Neon Database** (PostgreSQL) - Serverless PostgreSQL database
- **@neondatabase/serverless** - Serverless database client

### **Payment Processing**
- **Stripe** - Payment processing and identity verification
- **@stripe/stripe-react-native** - React Native Stripe SDK
- **@stripe/stripe-js** - Stripe JavaScript SDK

### **UI/UX & Styling**
- **NativeWind** (v4.1.23) - Tailwind CSS for React Native
- **Tailwind CSS** - Utility-first CSS framework
- **Inter Font Family** - Custom typography
- **React Native Maps** - Google Maps integration
- **Expo Vector Icons** - Icon library

### **State Management**
- **Zustand** - Lightweight state management
- **React Context** - For unread message counts and notifications

### **Key Features & Libraries**
- **Expo Location** - GPS and location services with real-time tracking
- **Expo Notifications** - Push notification system with timezone support
- **Expo Calendar** - Calendar integration for ride events
- **React Native Gesture Handler** - Touch handling
- **React Native Reanimated** - Animations
- **Expo Image Picker** - Photo/document upload
- **Expo Secure Store** - Secure data storage
- **React Native Google Places Autocomplete** - Location search
- **React Native Maps Directions** - Route visualization
- **Expo Clipboard** - Share functionality
- **Expo Linking** - Deep linking support

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Metro** - JavaScript bundler

## Architecture

### **Project Structure**

#### **Frontend (Loop/)**
- **`app/`** - Main application code using Expo Router
  - **`(feed)/`** - Ride discovery and feed screens
  - **`(root)/`** - Main app screens and navigation
  - **`(auth)/`** - Authentication screens
  - **`(tabs)/`** - Bottom tab navigation
  - **`(profiles)/`** - User profile management screens

#### **Backend (loop-api/)**
- **`app/api/`** - Next.js API routes (route.ts style)
  - **`admin/`** - Admin management endpoints (metrics, sync accounts, fix ride status)
  - **`auth/`** - Authentication endpoints and college email validation
  - **`bookings/`** - Booking management with split payment support
  - **`chat/`** - Real-time messaging with read receipts
  - **`cron/`** - Automated tasks (recurring rides, process rides, update metrics)
  - **`debug/`** - Development and debugging tools
  - **`driver/`** - Driver verification & management (multi-step verification)
  - **`notifications/`** - Push notification system with preferences
  - **`payout/`** - Driver earnings & payouts via Stripe Connect
  - **`ratings/`** - Rating & review system with pending ratings
  - **`recurring-rides/`** - Recurring ride management
  - **`requests/`** - Ride request management for non-drivers
  - **`ride/`** - Individual ride operations and location updates
  - **`rides/`** - Ride management (create, search, cancel, complete)
  - **`stripe/`** - Payment processing with split payments
  - **`webhooks/`** - Stripe Connect and Identity webhooks

### **Database Schema**
The app uses a comprehensive PostgreSQL schema with tables for:
- **Users** - User profiles, driver verification, preferences, college verification
- **Rides** - Posted rides and requests with location, timing, pricing
- **Bookings** - Ride reservations with approval workflow and payment status
- **Chat** - Messaging system between users with threads and messages
- **Ratings** - Dual rating system (driver/rider ratings)
- **Notifications** - Push notification tokens, preferences, and logs
- **Driver Payouts** - Stripe Connect integration for earnings
- **Fare Splitting** - Progressive discount calculations
- **Recurring Rides** - Schedule templates for repeating rides
- **Ride Requests** - Non-driver ride requests and offers
- **Location Tracking** - Real-time location updates for active rides
- **Metrics** - Usage analytics and platform metrics
- **College Verification** - EDU email validation records

### **Key Features**
1. **Dual-mode system** - Drivers post rides, non-drivers request rides
2. **Location-based discovery** using Haversine formula with bounding box optimization
3. **Fare splitting** with progressive discounts (25% for 2, 40% for 3, 50% for 4+ passengers)
4. **Three pricing models** - Gas only, gas + small fee, standard rideshare
5. **Real-time chat** between drivers and riders with read receipts
6. **Multi-step driver verification** through Stripe Identity
7. **Payment processing** with Stripe including group bookings and split payments
8. **Driver payouts** via Stripe Connect with earnings tracking
9. **Push notifications** for ride updates with user preferences and timezone support
10. **Dual rating system** - Separate driver and rider ratings with prompt banners
11. **Booking approval workflow** - Drivers approve/reject booking requests
12. **Live ride tracking** - Real-time GPS tracking with map visualization
13. **Recurring rides** - Schedule repeating rides with automatic generation
14. **Calendar integration** - Sync rides with device calendar
15. **College verification** - EDU email validation for student communities
16. **Deep linking** - Share rides via custom URLs
17. **Automated refunds** - Smart refund processing for cancellations
18. **Admin dashboard** - Metrics, account management, and system monitoring
19. **Cross-platform** (iOS, Android)

### Project Structure
```
Loop/                       # Frontend React Native App
├── app/                    # Main application code
│   ├── (feed)/            # Ride discovery screens
│   ├── (root)/            # Main app screens
│   ├── (auth)/            # Authentication screens
│   └── (tabs)/            # Tab navigation
├── components/             # Reusable UI components
├── constants/              # App constants and configuration
├── contexts/               # React contexts
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and services
├── store/                  # Zustand state management
├── types/                  # TypeScript type definitions
├── assets/                 # Images, fonts, and static files
└── loop-api/              # Backend API (separate deployment)
    ├── app/api/           # Next.js API routes
    ├── database/          # Database schemas
    ├── lib/               # Backend utilities
    └── types/             # Backend type definitions
```

## Features

### User Management
- User registration and authentication via Clerk (Email, Google, Apple)
- Profile management with preferences and avatar syncing
- Multi-step driver verification system via Stripe Identity
- Dual rating system (separate driver and rider ratings)
- College verification via EDU email validation
- Communication preferences management
- Emergency contact information

### Ride Management
- Post rides with origin/destination, timing, and pricing
- Request rides (for non-drivers) with offers system
- Search and filter nearby rides with advanced filters
- Real-time ride status updates
- Automatic ride expiration
- Three pricing models (gas only, small fee, standard)
- Recurring rides scheduling
- Live GPS tracking during rides
- Navigation maps for posted rides

### Booking System
- Seat reservation with payment
- Booking approval workflow for drivers
- Group bookings with fare splitting
- Split payment processing
- Booking confirmation and cancellation
- Payment processing via Stripe
- Automated refund system
- Booking history and status tracking
- Fare splitting savings calculator

### Communication
- In-app chat between drivers and riders
- Thread-based messaging system
- Push notifications for important updates
- Message read receipts and marking as read
- Unread message counters with context provider
- Notification preferences with timezone support
- Quiet hours configuration

### Location Services
- GPS-based ride discovery with bounding box optimization
- Google Places integration for address search
- Real-time location tracking for active rides
- Distance calculation using Haversine formula
- Google Directions API for route visualization
- Driver tracking controls
- Fullscreen map view for tracking

### Payment & Financial
- Stripe payment processing with PCI compliance
- Stripe Connect for driver payouts
- Earnings tracking and withdrawal management
- Split payment support for group bookings
- Automated refund processing
- Multiple pricing models support
- Fare splitting with progressive discounts
- Payment intent tracking

### Calendar & Scheduling
- Device calendar integration via Expo Calendar
- Ride event creation and reminders
- Recurring ride templates
- Automatic ride generation from schedules
- Calendar permissions management

### Sharing & Social
- Deep linking support (loop.app domain)
- Public ride pages for sharing
- Share ride functionality via clipboard
- College community features
- Rating prompt banners

### Admin & Analytics
- Admin dashboard for platform management
- Metrics tracking and reporting
- User account synchronization
- Stripe account status monitoring
- System health checks
- Migration management tools
- Debug endpoints for development

### Developer Tools
- Environment configuration management
- Multiple API URL support (dev/prod)
- Debug utilities and test endpoints
- Database migration scripts
- Webhook testing tools
- Notification testing system

## Security & Compliance
- Secure authentication with Clerk
- Multi-step driver identity verification via Stripe Identity
- Secure payment processing with Stripe
- Data encryption and privacy protection
- Token-based API authentication
- Secure storage with Expo SecureStore
- GDPR compliance considerations
- College email verification for student communities

## UI/UX Components

### Core Components
- **RideCard** - Displays ride information with fare splitting indicators
- **CustomButton** - Reusable button component with variants
- **InputField** - Consistent form input component
- **GoogleTextInput** - Location search with autocomplete
- **Map** - Google Maps integration component
- **Payment** - Stripe payment UI component

### Enhanced UI Components
- **AnimatedSplash** - Custom animated splash screen
- **ThemeToggle** - Dark/light mode switcher
- **ErrorBoundary** - Graceful error handling
- **RatingModal** - User rating interface
- **RatingPromptBanner** - Encourages user ratings
- **VerificationModal** - Driver verification UI
- **CollegeVerificationBadge** - Student status indicator
- **VerificationStatusBadge** - Driver verification status

### Navigation & Tracking
- **DriverTrackingControl** - Driver-side tracking controls
- **DriverTrackingMap** - Driver tracking visualization
- **LiveTrackingMap** - Passenger tracking view
- **NavigationMap** - Turn-by-turn navigation

### Booking & Payment
- **BookingRequest** - Booking request interface
- **FareSplitConfirmationModal** - Group booking confirmation
- **FareSplitPricingDisplay** - Shows split pricing details
- **FareSplitSavingsCalculator** - Calculate savings

### Social & Sharing
- **RecurringRideOptions** - Recurring ride configuration
- **CollegeInfoCard** - College community information
- **DriverCard** - Driver profile display
- **ShareButton** - Ride sharing functionality

### Welcome & Onboarding
- **CampusIllustration** - Welcome screen graphics
- **SafetyBadges** - Safety feature highlights
- **SavingsVisualization** - Cost savings display

## Deployment
- **Frontend Mobile App**:
  - **iOS**: App Store deployment via Expo EAS Build
  - **Android**: Google Play Store deployment via Expo EAS Build
- **Backend API**:
  - **Platform**: Vercel (https://loop-api-gilt.vercel.app)
  - **Framework**: Next.js serverless functions
- **Database**: Neon PostgreSQL (serverless)

## API Communication
- The mobile app communicates with the backend via REST APIs
- API base URL configured via `EXPO_PUBLIC_API_URL` environment variable
- Centralized API utility (`fetchAPI`) for consistent error handling
- All API routes follow Next.js route.ts convention
- Authentication handled via Clerk tokens
- Consistent response format: `{ success: boolean, data/error }`
- Real-time features use polling (chat, notifications, tracking)
- User-friendly error messages extracted from API responses
- Support for multiple environments (dev/prod)
- Request/response logging in development mode

## Code Conventions & Patterns
- **TypeScript** with strict mode enabled
- **File naming**: kebab-case for files, PascalCase for components
- **No ORM**: Direct SQL queries with Neon for performance
- **Error handling**: Consistent try-catch patterns
- **State management**: Zustand for global, Context for UI state
- **API calls**: Always use `fetchAPI` utility
- **Database**: UUID primary keys, PostgreSQL triggers for consistency
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Theme**: Dark/light mode with system preference support
- **Comments**: Minimal, self-documenting code preferred
- **Emojis**: Not used in code unless explicitly requested