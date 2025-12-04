#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');

// Read DATABASE_URL from environment
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function setupNotifications() {
  try {
    console.log('Setting up notifications tables...');
    
    // 1. Create user_push_tokens table
    console.log('Creating user_push_tokens table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_push_tokens (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token           TEXT NOT NULL,
        device_id       TEXT,
        platform        VARCHAR(10),
        is_active       BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, device_id)
      )
    `;
    console.log('✓ user_push_tokens table created');

    // 2. Create notification_preferences table
    console.log('Creating notification_preferences table...');
    await sql`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rides_near_me           BOOLEAN DEFAULT TRUE,
        booking_requests        BOOLEAN DEFAULT TRUE,
        booking_confirmations   BOOLEAN DEFAULT TRUE,
        ride_reminders          BOOLEAN DEFAULT TRUE,
        ride_cancellations      BOOLEAN DEFAULT TRUE,
        seat_availability       BOOLEAN DEFAULT TRUE,
        chat_messages           BOOLEAN DEFAULT TRUE,
        payment_issues          BOOLEAN DEFAULT TRUE,
        nearby_radius_km        SMALLINT DEFAULT 50,
        preferred_locations     JSON,
        quiet_hours_start       TIME,
        quiet_hours_end         TIME,
        timezone                VARCHAR(50) DEFAULT 'UTC',
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `;
    console.log('✓ notification_preferences table created');

    // 3. Create notification_log table
    console.log('Creating notification_log table...');
    await sql`
      CREATE TABLE IF NOT EXISTS notification_log (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type            VARCHAR(50) NOT NULL,
        title           TEXT NOT NULL,
        body            TEXT NOT NULL,
        data            JSON,
        push_token      TEXT,
        delivery_status VARCHAR(20) DEFAULT 'pending',
        delivery_error  TEXT,
        ride_id         UUID REFERENCES rides(id) ON DELETE SET NULL,
        booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
        scheduled_at    TIMESTAMPTZ,
        sent_at         TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✓ notification_log table created');

    // 4. Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS user_push_tokens_user_idx ON user_push_tokens(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS user_push_tokens_active_idx ON user_push_tokens(is_active) WHERE is_active = TRUE`;
    await sql`CREATE INDEX IF NOT EXISTS notification_preferences_user_idx ON notification_preferences(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS notification_log_user_idx ON notification_log(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS notification_log_type_idx ON notification_log(type)`;
    await sql`CREATE INDEX IF NOT EXISTS notification_log_status_idx ON notification_log(delivery_status)`;
    console.log('✓ Indexes created');

    // 5. Insert default notification preferences for existing users
    console.log('Creating default notification preferences for existing users...');
    await sql`
      INSERT INTO notification_preferences (user_id)
      SELECT id FROM users 
      WHERE id NOT IN (SELECT user_id FROM notification_preferences)
      ON CONFLICT (user_id) DO NOTHING
    `;
    console.log('✓ Default preferences created');

    console.log('🎉 Notifications setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up notifications:', error);
    process.exit(1);
  }
}

setupNotifications();