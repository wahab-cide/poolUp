/**
 * One-time script to sync OAuth provider avatars for existing users
 * This script finds users who have Clerk avatar URLs but missing database avatar_url
 * and syncs them to ensure ride cards show OAuth provider avatars
 */

const { Clerk } = require('@clerk/clerk-sdk-node');
const { neon } = require('@neondatabase/serverless');

// Initialize Clerk and database
const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
const sql = neon(process.env.DATABASE_URL);

async function syncOAuthAvatars() {
  try {
    console.log('🔄 Starting OAuth avatar sync...');

    // Get all users from database who have clerk_id but missing avatar_url
    const usersWithoutAvatars = await sql`
      SELECT id, clerk_id, first_name, last_name, email
      FROM users 
      WHERE clerk_id IS NOT NULL 
        AND (avatar_url IS NULL OR avatar_url = '')
      ORDER BY created_at DESC
    `;

    console.log(`📋 Found ${usersWithoutAvatars.length} users without avatar URLs`);

    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutAvatars) {
      try {
        // Fetch user from Clerk to get their imageUrl
        const clerkUser = await clerkClient.users.getUser(user.clerk_id);
        
        if (clerkUser.imageUrl) {
          // Update database with Clerk imageUrl
          await sql`
            UPDATE users 
            SET avatar_url = ${clerkUser.imageUrl}, updated_at = NOW()
            WHERE clerk_id = ${user.clerk_id}
          `;
          
          syncedCount++;
          console.log(`✅ Synced avatar for ${user.first_name} ${user.last_name} (${user.email})`);
        } else {
          skippedCount++;
          console.log(`⏭️  Skipped ${user.first_name} ${user.last_name} - no Clerk avatar`);
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error syncing ${user.clerk_id}:`, error.message);
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`✅ Successfully synced: ${syncedCount} users`);
    console.log(`⏭️  Skipped (no avatar): ${skippedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log('🎉 OAuth avatar sync completed!');

  } catch (error) {
    console.error('💥 Fatal error during avatar sync:', error);
    process.exit(1);
  }
}

// Check for required environment variables
if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY environment variable is required');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Run the sync
syncOAuthAvatars().then(() => {
  console.log('✨ Script completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});