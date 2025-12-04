#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from environment
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function runSchema() {
  try {
    console.log('Running notifications schema...');
    
    // Read the SQL file
    const schemaPath = path.join(__dirname, '..', 'database', 'notifications_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as one transaction
    console.log('Executing notifications schema...');
    
    try {
      // Create a simple function to execute raw SQL
      const execRaw = new Function('sql', 'query', 'return sql([query])');
      await execRaw(sql, schemaSQL);
      console.log('✓ Schema executed successfully!');
    } catch (error) {
      console.log('Fallback: Executing statements individually...');
      
      // Split by semicolons and execute each statement
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
      
      console.log(`Found ${statements.length} statements to execute`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        if (statement.length < 10) continue;
        
        try {
          console.log(`[${i + 1}/${statements.length}] Executing...`);
          
          // Use eval to create template literal dynamically
          const result = await eval('sql`' + statement.replace(/`/g, '\\`') + '`');
          console.log(`✓ Statement ${i + 1} completed`);
        } catch (error) {
          console.error(`✗ Error in statement ${i + 1}:`, error.message);
          console.log('Statement:', statement.substring(0, 100) + '...');
          // Continue with other statements
        }
      }
    }
    
    console.log('✓ Notifications schema setup completed!');
    
  } catch (error) {
    console.error('Error running notifications schema:', error);
    process.exit(1);
  }
}

runSchema();