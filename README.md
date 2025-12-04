Loop Platform
=============

Loop is a college rideshare platform that connects university students for safe,
verified carpooling. Built with React Native, it provides real-time ride matching,
fare splitting, and community-focused features for campus transportation.

Quick Start
-----------

* Report issues: https://github.com/wahab-cide/poolUp/issues
* Get the code: git clone https://github.com/wahab-cide/poolUp.git
* Install deps: npm install
* Run mobile: npx expo start
* View docs: See CLAUDE.md

Essential Documentation
-----------------------

All contributors should be familiar with:

* Project Overview: PROJECT_OVERVIEW.md
* Development Guide: CLAUDE.md
* Social Features: SOCIAL_FEATURES_ROADMAP.md
* License: MIT

Documentation for components and APIs can be found in the CLAUDE.md file.


Who Are You?
============

Find your role below:

* New Developer - Getting started with the codebase
* Mobile Developer - React Native and Expo development
* Backend Developer - API integration and data flow
* Designer/Product - Understanding features and UX
* DevOps Engineer - Deployment and infrastructure
* Contributor - Contributing fixes and features


For Specific Users
==================

New Developer
-------------

Welcome! Start your Loop development journey here:

* Getting Started: CLAUDE.md - Complete setup guide
* Project Structure: PROJECT_OVERVIEW.md - App architecture
* Environment Setup: Create .env with required API keys
* Run Development: npx expo start
* Development Tools: Expo DevTools at localhost:8081
* Git Workflow: Feature branches, pull requests
* Testing: npm run lint for ESLint checks

Mobile Developer
----------------

Work with React Native and Expo features:

* App Architecture: CLAUDE.md - File-based routing with Expo Router
* Component Library: components/ - Reusable UI components
* Navigation: Expo Router v6 - app/ directory routing
* Styling: NativeWind (TailwindCSS) - global.css and tailwind.config.js
* State Management: Zustand - store/index.ts
* Maps Integration: react-native-maps with Google Places
* Push Notifications: hooks/useNotifications.ts
* Theme System: contexts/ThemeContext.tsx

Backend Developer
-----------------

Integrate with the Loop API and manage data flow:

* API Communication: lib/fetch.ts - fetchAPI wrapper
* Authentication: Clerk SDK - lib/auth.ts
* Database Schema: database/schema.sql
* Payment Processing: Stripe - components/Payment.tsx
* Real-time Features: Chat polling, location updates
* Data Types: types/type.d.ts - TypeScript interfaces
* Environment Config: lib/environment.ts

Designer/Product
----------------

Understand features and user experience:

* Feature Overview: PROJECT_OVERVIEW.md
* Social Features: SOCIAL_FEATURES_ROADMAP.md - Crews, events, communities
* User Flows: Booking, posting rides, fare splitting
* Dark Mode: Theme toggle with system preference
* Component Library: components/ - UI patterns
* Onboarding: app/(root)/onboarding.tsx
* Verification System: College email and driver documents

DevOps Engineer
---------------

Deploy and maintain Loop infrastructure:

* Web Deployment: Vercel - vercel.json configuration
* CI/CD: GitHub Actions - .github/workflows/ci.yml
* Mobile Builds: EAS Build - eas.json configuration
* Environment Variables: Clerk, Stripe, Google Maps API keys
* Monitoring: Vercel Analytics and logs
* Native Builds: Android and iOS configuration in android/ and ios/

Contributor
-----------

Contribute fixes and features to Loop:

* Code Style: Follow ESLint config - eslint.config.js
* TypeScript: Strict mode enabled - tsconfig.json
* Branch Strategy: Feature branches from main
* Pull Requests: Clear description, link issues
* Testing: Run npm run lint before commits
* Documentation: Update CLAUDE.md for significant changes
* Commit Messages: Conventional commits (feat:, fix:, chore:)


Tech Stack
==========

Mobile Application
------------------

* Framework: React Native 0.81 with Expo 54
* Language: TypeScript 5.9 (strict mode)
* Navigation: Expo Router 6 (file-based routing)
* Styling: NativeWind 4 (TailwindCSS for React Native)
* State: Zustand 5 for global state
* Maps: react-native-maps with Google Places
* Auth: Clerk Expo SDK

Backend Integration
-------------------

* API: Loop API (separate repository - loop-api)
* Database: PostgreSQL (Neon serverless)
* Payments: Stripe with Stripe Connect
* Notifications: Expo Push Notifications
* Real-time: Polling-based updates

Development Tools
-----------------

* Build: Metro bundler (Expo default)
* Linting: ESLint 9 with Prettier
* Type Checking: TypeScript compiler
* Version Control: Git with GitHub
* CI/CD: GitHub Actions
* Deployment: Vercel (web), EAS (mobile)


Communication and Support
=========================

* Issues: https://github.com/wahab-cide/poolUp/issues
* Documentation: CLAUDE.md in repository
* Project Board: GitHub Projects
* Code Review: Pull request discussions
* Development: Expo community forums and documentation
