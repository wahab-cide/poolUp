const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function addApprovalStatus() {
  try {
    console.log('Adding approval_status column to bookings table...');
    
    // Add the approval_status column
    await sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'
    `;
    
    console.log('✓ approval_status column added');
    
    // Create index for performance
    await sql`
      CREATE INDEX IF NOT EXISTS bookings_approval_status_idx ON bookings(approval_status)
    `;
    
    console.log('✓ Index created for approval_status');
    
    // Update existing bookings to have proper approval status
    // Pending bookings that haven't been approved yet
    await sql`
      UPDATE bookings 
      SET approval_status = 'pending'
      WHERE status = 'pending' AND approval_status IS NULL
    `;
    
    // Paid/completed bookings were implicitly approved
    await sql`
      UPDATE bookings 
      SET approval_status = 'approved'
      WHERE status IN ('paid', 'completed') AND approval_status = 'pending'
    `;
    
    console.log('✓ Existing bookings updated with approval status');
    
    // Verify the changes
    console.log('\nVerifying approval status distribution:');
    const statusCount = await sql`
      SELECT 
        status,
        approval_status,
        COUNT(*) as count
      FROM bookings 
      GROUP BY status, approval_status
      ORDER BY status, approval_status
    `;
    
    console.table(statusCount);
    
    console.log('🎉 Approval status setup completed!');
    
  } catch (error) {
    console.error('Error adding approval status:', error);
  }
}

addApprovalStatus();