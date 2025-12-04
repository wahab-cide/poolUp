# Social Community Features Roadmap

## Overview

This document outlines the implementation plan for transforming Loop into a social ridesharing platform that builds community through social proof, groups, and direct driver connections.

**Primary Goals:**
- Build community and belonging among students
- Increase trust through social connections
- Enable direct relationships between drivers and riders
- Create recurring ride communities for common routes

---

## 🎯 Core Features

### Phase 1: Enhanced Driver Profiles & Direct Requests

#### 1.1 Driver Profile Page
**File:** `/app/(root)/driver-profile/[driverId].tsx`

**Features:**
- **Header Section:**
  - Large avatar with verification badges
  - Full name with college badge
  - Star rating with total rides count
  - "Member since" date
  - Bio/About section (150 characters)

- **Stats Section:**
  - Total rides completed
  - Completion rate percentage
  - Average rating
  - Response time
  - Carbon saved (lbs CO2)

- **Social Proof:**
  - Mutual friends indicator ("3 friends rode with Alex")
  - Common routes ("You've both done Boston → NYC")
  - Shared college highlight

- **Vehicle Information:**
  - Car make, model, year, color
  - License plate (last 3 digits only for privacy)
  - Vehicle photos (optional)
  - Amenities (aux cord, phone charger, etc.)

- **Activity:**
  - Common routes list (top 5 frequented routes)
  - Recent reviews (last 5-10)
  - Availability status

- **Actions:**
  - **"Request Ride" button** (primary CTA)
  - "Message" button (secondary)
  - "Share Profile" button

**Navigation:**
- Accessible by tapping driver name/avatar from any ride card
- Accessible from trending drivers section
- Accessible from search/discovery

---

#### 1.2 Direct Ride Request System

**Component:** `DirectRideRequestModal.tsx`

**Flow:**
1. User taps "Request Ride" on driver profile
2. Modal opens with form:
   - From location (autocomplete)
   - To location (autocomplete)
   - Date picker
   - Time picker
   - Number of seats needed
   - Optional message to driver
3. Submit request → notification sent to driver
4. Driver can accept/decline/counter-offer

**Database Schema:**
```sql
CREATE TABLE ride_requests (
  id UUID PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  origin_address TEXT NOT NULL,
  origin_latitude DECIMAL NOT NULL,
  origin_longitude DECIMAL NOT NULL,
  destination_address TEXT NOT NULL,
  destination_latitude DECIMAL NOT NULL,
  destination_longitude DECIMAL NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  seats_requested INTEGER NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, expired
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ride_requests_driver ON ride_requests(driver_id, status);
CREATE INDEX idx_ride_requests_requester ON ride_requests(requester_id, status);
```

**API Endpoints:**
- `POST /api/ride-requests` - Create new request
- `GET /api/ride-requests` - Get user's requests (sent & received)
- `PATCH /api/ride-requests/:id` - Accept/decline request
- `DELETE /api/ride-requests/:id` - Cancel request

**UI Additions:**
- New "Requests" tab for drivers (shows incoming requests)
- "My Requests" section in rider profile (shows sent requests)
- Push notifications for new requests & responses

---

#### 1.3 Social Proof Indicators

**Components:**
- `MutualFriendsIndicator.tsx`
- `CommonRoutesIndicator.tsx`
- `SharedCollegeBadge.tsx`

**Mutual Friends:**
- Display: "2 mutual friends" or "3 friends rode with Alex"
- Tap to see list of mutual connections
- Shows on ride cards and driver profiles

**Common Routes:**
- Display: "You've both done Boston → NYC"
- Based on ride history comparison
- Shows top 1-2 common routes

**Shared College:**
- Highlight badge when same college
- "Williams College" badge more prominent for same-school drivers

**Database Schema:**
```sql
CREATE TABLE user_connections (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  connected_user_id UUID NOT NULL REFERENCES users(id),
  connection_type VARCHAR(20) DEFAULT 'rode_together', -- rode_together, mutual_friend
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

CREATE INDEX idx_connections_user ON user_connections(user_id);
CREATE INDEX idx_connections_connected_user ON user_connections(connected_user_id);
```

**API Endpoints:**
- `GET /api/drivers/:id/mutual-friends` - Get mutual connections
- `GET /api/drivers/:id/common-routes` - Get shared routes
- `POST /api/connections` - Mark users as connected after ride

**Integration:**
- Add to `RideCard.tsx` component
- Add to driver profile page
- Show in ride confirmation screen

---

### Phase 2: Trending & Discovery

#### 2.1 Trending Drivers Section

**Component:** `TrendingDrivers.tsx`

**Display:**
- Horizontal scrollable carousel on home feed
- Shows top 5-10 drivers based on:
  - Most rides completed this week
  - Highest ratings (minimum 5 rides)
  - Most requested drivers
  - Most active on platform

**Driver Card (Compact):**
- Avatar with verification badge
- Name and rating
- "X rides this week"
- Quick "View Profile" button

**Algorithm:**
```javascript
// Trending score calculation
score = (rides_this_week * 3) +
        (rating * 10) +
        (total_rides * 0.1) +
        (requests_count * 2)
```

**API Endpoints:**
- `GET /api/trending/drivers?college_id={id}` - Get trending drivers
- Optional filters: time_range (week, month), college

**Database:**
```sql
-- Materialized view for performance
CREATE MATERIALIZED VIEW trending_drivers AS
SELECT
  u.id,
  u.first_name,
  u.last_name,
  u.avatar_url,
  u.college_id,
  COUNT(DISTINCT r.id) FILTER (WHERE r.created_at > NOW() - INTERVAL '7 days') as rides_this_week,
  AVG(rv.rating) as avg_rating,
  COUNT(DISTINCT rv.id) as total_reviews,
  COUNT(DISTINCT rr.id) FILTER (WHERE rr.created_at > NOW() - INTERVAL '7 days') as requests_this_week
FROM users u
LEFT JOIN rides r ON r.driver_id = u.id
LEFT JOIN reviews rv ON rv.driver_id = u.id
LEFT JOIN ride_requests rr ON rr.driver_id = u.id
WHERE u.is_driver = true
GROUP BY u.id
ORDER BY
  (COUNT(DISTINCT r.id) FILTER (WHERE r.created_at > NOW() - INTERVAL '7 days') * 3 +
   AVG(rv.rating) * 10 +
   COUNT(DISTINCT rv.id) * 0.1 +
   COUNT(DISTINCT rr.id) FILTER (WHERE rr.created_at > NOW() - INTERVAL '7 days') * 2) DESC;

-- Refresh periodically (every hour)
REFRESH MATERIALIZED VIEW CONCURRENTLY trending_drivers;
```

---

#### 2.2 Trending Routes

**Component:** `TrendingRoutes.tsx`

**Display:**
- Section on home feed below trending drivers
- "Hot Routes This Week 🔥"
- Shows top 5 popular routes with:
  - Origin → Destination
  - Number of rides/riders this week
  - "See available rides" button

**Example:**
```
🔥 Hot Routes This Week

Williams → Boston
20 people traveling • 12 available rides

NYC → Boston
15 people traveling • 8 available rides

Boston → Providence
10 people traveling • 5 available rides
```

**API Endpoints:**
- `GET /api/trending/routes?college_id={id}` - Get popular routes

**Database:**
```sql
CREATE MATERIALIZED VIEW trending_routes AS
SELECT
  origin_address,
  destination_address,
  ROUND(AVG(origin_latitude)::numeric, 4) as avg_origin_lat,
  ROUND(AVG(origin_longitude)::numeric, 4) as avg_origin_lng,
  ROUND(AVG(destination_latitude)::numeric, 4) as avg_dest_lat,
  ROUND(AVG(destination_longitude)::numeric, 4) as avg_dest_lng,
  COUNT(DISTINCT id) as ride_count,
  COUNT(DISTINCT user_id) as unique_riders,
  college_id
FROM rides
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY origin_address, destination_address, college_id
ORDER BY ride_count DESC
LIMIT 20;
```

---

#### 2.3 Campus Activity Stats

**Component:** `CampusStatsWidget.tsx`

**Display:**
- Card on profile tab or home feed
- "Your Campus This Week"
- Key metrics:
  - Total rides shared
  - CO2 saved (lbs)
  - Active drivers
  - Most popular destination

**Optional Leaderboards:**
- "Top Drivers This Month"
- "Most Eco-Friendly Users"
- "Road Warriors" (most miles)

---

### Phase 3: Groups & Communities

#### 3.1 Ride Crews

**Screens:**
- `/app/(root)/crews/index.tsx` - Browse/My Crews
- `/app/(root)/crews/[crewId].tsx` - Crew details
- `/app/(root)/crews/create.tsx` - Create new crew

**Concept:**
Recurring groups for common routes. Members can:
- Post rides visible to crew first (early access)
- See crew members' schedules
- Group chat
- Set up regular carpool schedules

**Example Crews:**
- "Williams → Boston Weekenders"
- "NYC Commuters"
- "Spring Breakers 2025"
- "Home for Thanksgiving"

**Crew Features:**
- Name and description
- Route (origin → destination)
- Member list with roles (admin, member)
- Crew chat (group messaging)
- Shared ride calendar
- Crew stats (total rides, CO2 saved)

**Database Schema:**
```sql
CREATE TABLE ride_crews (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  route_origin_address TEXT NOT NULL,
  route_destination_address TEXT NOT NULL,
  college_id UUID REFERENCES colleges(id),
  created_by UUID REFERENCES users(id),
  member_count INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE crew_members (
  id UUID PRIMARY KEY,
  crew_id UUID REFERENCES ride_crews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- admin, member
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(crew_id, user_id)
);

CREATE TABLE crew_rides (
  id UUID PRIMARY KEY,
  crew_id UUID REFERENCES ride_crews(id),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  posted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crews_college ON ride_crews(college_id);
CREATE INDEX idx_crew_members_user ON crew_members(user_id);
CREATE INDEX idx_crew_members_crew ON crew_members(crew_id);
```

**API Endpoints:**
- `GET /api/crews` - Browse public crews
- `GET /api/crews/my-crews` - User's joined crews
- `POST /api/crews` - Create new crew
- `GET /api/crews/:id` - Crew details
- `POST /api/crews/:id/join` - Join crew
- `DELETE /api/crews/:id/leave` - Leave crew
- `GET /api/crews/:id/rides` - Crew rides
- `POST /api/crews/:id/rides` - Post ride to crew

**UI Components:**
- `CrewCard.tsx` - Display crew in list
- `CrewMembersList.tsx` - Show crew members
- `CrewRidesFeed.tsx` - Crew-specific rides
- `CreateCrewModal.tsx` - Create crew form

---

#### 3.2 Campus Communities

**Screen:** `/app/(root)/communities/[collegeId].tsx`

**Concept:**
College-wide community feed and features. Auto-joined based on verified .edu email.

**Features:**
- Campus-wide announcements
- Events and carpools
- Campus-specific ride feed
- College stats dashboard
- Bulletin board for ride shares

**Example Use Cases:**
- "Spring break ride shares"
- "Game day carpools"
- "Airport shuttle for Thanksgiving"
- "Study abroad group rides"

**Database Schema:**
```sql
CREATE TABLE college_communities (
  id UUID PRIMARY KEY,
  college_id UUID REFERENCES colleges(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE community_posts (
  id UUID PRIMARY KEY,
  community_id UUID REFERENCES college_communities(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  post_type VARCHAR(20) DEFAULT 'announcement', -- announcement, event, discussion
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**
- `GET /api/communities/:collegeId` - Get community feed
- `POST /api/communities/:collegeId/posts` - Create post
- `GET /api/communities/:collegeId/stats` - Campus statistics

---

#### 3.3 Event Carpools

**Screen:** `/app/(root)/events/index.tsx`

**Concept:**
Organized carpools for specific events. Group multiple riders heading to same event.

**Features:**
- Event name, date, location
- Multiple rides going to same event
- Event-specific chat group
- RSVP and headcount
- Shared event details

**Example Events:**
- "Concert @ TD Garden - March 15"
- "Spring Break NYC Trip"
- "Williams vs Amherst Game"
- "Boston Marathon Spectators"

**Database Schema:**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location_address TEXT NOT NULL,
  location_latitude DECIMAL NOT NULL,
  location_longitude DECIMAL NOT NULL,
  college_id UUID REFERENCES colleges(id),
  organizer_id UUID REFERENCES users(id),
  attendee_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_rides (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  ride_id UUID REFERENCES rides(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_attendees (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'interested', -- interested, going, ride_booked
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
```

**API Endpoints:**
- `GET /api/events` - Browse upcoming events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Event details
- `GET /api/events/:id/rides` - Rides for event
- `POST /api/events/:id/attend` - RSVP to event

---

## 📋 Implementation Timeline

### Week 1-2: Foundation & Profiles
**Goal:** Users can view detailed driver profiles and request rides directly

- [ ] Create driver profile screen (`driver-profile/[driverId].tsx`)
- [ ] Design and implement profile UI (stats, bio, vehicle info)
- [ ] Add navigation: tap driver name/avatar → profile
- [ ] Backend: `/api/drivers/:id/profile` endpoint
- [ ] Database: Add `bio` field to users table

### Week 2-3: Direct Ride Requests
**Goal:** Users can request rides from specific drivers

- [ ] Create `DirectRideRequestModal.tsx` component
- [ ] Add "Request Ride" button to driver profiles
- [ ] Backend: Create `ride_requests` table
- [ ] Backend: `/api/ride-requests` CRUD endpoints
- [ ] Add "Requests" tab for drivers
- [ ] Push notifications for new requests
- [ ] "My Requests" section in rider profile

### Week 3-4: Social Proof
**Goal:** Build trust through connections and shared history

- [ ] Create `user_connections` table
- [ ] Backend: `/api/drivers/:id/mutual-friends` endpoint
- [ ] Backend: `/api/drivers/:id/common-routes` endpoint
- [ ] Create `MutualFriendsIndicator.tsx` component
- [ ] Create `CommonRoutesIndicator.tsx` component
- [ ] Add indicators to RideCard
- [ ] Add indicators to driver profile
- [ ] Auto-create connections after completed rides

### Week 4-5: Trending & Discovery
**Goal:** Help users discover popular drivers and routes

- [ ] Create `trending_drivers` materialized view
- [ ] Backend: `/api/trending/drivers` endpoint
- [ ] Create `TrendingDrivers.tsx` carousel component
- [ ] Add trending section to home feed
- [ ] Create `trending_routes` materialized view
- [ ] Backend: `/api/trending/routes` endpoint
- [ ] Create `TrendingRoutes.tsx` component
- [ ] Add hot routes section to home feed
- [ ] Set up hourly refresh for materialized views

### Week 6-7: Ride Crews (MVP)
**Goal:** Users can create and join recurring ride groups

- [ ] Create `ride_crews`, `crew_members`, `crew_rides` tables
- [ ] Backend: `/api/crews` CRUD endpoints
- [ ] Create crews browse screen (`crews/index.tsx`)
- [ ] Create crew details screen (`crews/[crewId].tsx`)
- [ ] Create crew creation flow (`crews/create.tsx`)
- [ ] Create `CrewCard.tsx` component
- [ ] Create `CrewMembersList.tsx` component
- [ ] Implement join/leave crew functionality
- [ ] Add "My Crews" to profile/navigation
- [ ] Crew-specific ride posting

### Week 8+: Advanced Features
**Goal:** Full community platform with events and campus features

- [ ] Campus communities (auto-join by college)
- [ ] Event carpools system
- [ ] Crew group chat integration
- [ ] Gamification badges
- [ ] Advanced leaderboards
- [ ] Profile tags and preferences

---

## 🚀 Quick Wins to Start

These can be built quickly and provide immediate value:

1. **Driver Profile Page** (Week 1)
   - Tap any driver name/avatar → see full profile
   - Shows stats, vehicle, reviews
   - Builds foundation for all social features

2. **"Request Ride" Button** (Week 2)
   - Simple form on driver profile
   - Direct connection between riders and favorite drivers
   - Complements existing ride posting system

3. **Mutual Friends Badge** (Week 3)
   - "2 mutual friends" on ride cards
   - Instant trust boost
   - Simple backend query

4. **Trending Drivers Carousel** (Week 4)
   - Top 5 drivers this week on home feed
   - Helps discovery of reliable drivers
   - Encourages driver engagement

---

## 💡 Design Considerations

### Privacy & Safety
- Mutual friends only shown if both users opted in
- Full names only visible after ride booking
- Report/block functionality on all profiles
- Verification badges (college, driver ID) prominent

### Performance
- Use materialized views for trending data (refresh hourly)
- Cache driver profiles for 5 minutes
- Paginate ride crews and community feeds
- Lazy load trending sections

### User Experience
- One-tap access to driver profiles from anywhere
- Clear CTAs: "Request Ride" primary, "Message" secondary
- Social proof always visible but not overwhelming
- Empty states for new users (no crews yet, etc.)

### Mobile-First
- Horizontal scrolling carousels for trending
- Bottom sheet modals for ride requests
- Swipe gestures for crew browsing
- Touch-friendly tap targets (44x44pt minimum)

---

## 📊 Success Metrics

**Engagement:**
- % of users who view driver profiles
- Number of direct ride requests per week
- Crew join rate
- Trending section interaction rate

**Trust & Safety:**
- Mutual friends impact on booking rate
- Same-college booking preference
- User-reported safety incidents

**Community:**
- Active crews count
- Average crew size
- Event carpool participation
- Repeat ride partnerships (same driver/rider pairs)

**Growth:**
- Viral coefficient from shared profiles
- Friend invites from crew members
- Campus-to-campus expansion via communities

---

## 🔄 Future Enhancements

### Phase 4+ Ideas
- **Stories/Status**: "Heading to Boston tomorrow, need riders!"
- **Profile Videos**: 15-sec driver intro videos
- **Advanced Preferences**: Music taste, conversation level, car rules
- **Achievements**: Badges for milestones (100 rides, eco warrior, etc.)
- **Shareable Content**: Ride receipts for Instagram/TikTok
- **Live Activity**: "5 people searching for rides to NYC right now"
- **Friend System**: Follow/favorite drivers for notifications
- **Environmental Dashboard**: Track CO2 saved, plant trees partnership
- **Campus Challenges**: Ride-sharing competitions between schools

---

## 📝 Notes

- All features should work with existing ride posting/requesting system
- Backend API should support real-time updates for trending data
- Push notifications critical for ride requests and crew activity
- Consider A/B testing for trending algorithm weights
- Monitor server costs for materialized view refreshes
- Plan for moderation tools (report crews, events, profiles)

---

**Last Updated:** January 2025
**Version:** 1.0
**Status:** Planning Phase
