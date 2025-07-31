// Database initialization - ensures required tables exist
// This runs automatically when the server starts

import pool from '../config/database';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if refresh_tokens table exists
    const refreshTokenTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'refresh_tokens'
      );
    `);
    
    if (!refreshTokenTableExists.rows[0].exists) {
      console.log('📄 Creating refresh_tokens table...');
      
      // Create refresh_tokens table
      await pool.query(`
        CREATE TABLE refresh_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          used_at TIMESTAMP,
          is_revoked BOOLEAN DEFAULT FALSE
        );
      `);
      
      // Add indexes
      await pool.query('CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);');
      await pool.query('CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);');
      await pool.query('CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);');
      
      console.log('✅ refresh_tokens table created successfully!');
    } else {
      console.log('✅ refresh_tokens table already exists');
      
      // Check and add missing columns
      await ensureRefreshTokenColumns();
    }
    
    // Check other critical indexes exist
    await ensureIndexes();
    
    console.log('🎉 Database schema verification complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't exit - let the app continue but log the issue
  }
}

async function ensureRefreshTokenColumns(): Promise<void> {
  try {
    // Check if is_revoked column exists
    const isRevokedExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'refresh_tokens' 
        AND column_name = 'is_revoked'
      );
    `);
    
    if (!isRevokedExists.rows[0].exists) {
      await pool.query('ALTER TABLE refresh_tokens ADD COLUMN is_revoked BOOLEAN DEFAULT FALSE;');
      console.log('✅ Added is_revoked column to refresh_tokens table');
    }
    
    // Check if used_at column exists
    const usedAtExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'refresh_tokens' 
        AND column_name = 'used_at'
      );
    `);
    
    if (!usedAtExists.rows[0].exists) {
      await pool.query('ALTER TABLE refresh_tokens ADD COLUMN used_at TIMESTAMP;');
      console.log('✅ Added used_at column to refresh_tokens table');
    }
    
  } catch (error) {
    console.warn('⚠️  Could not update refresh_tokens columns:', error instanceof Error ? error.message : error);
  }
}

async function ensureIndexes(): Promise<void> {
  const indexes = [
    {
      name: 'idx_produce_listings_user_id',
      table: 'produce_listings',
      column: 'user_id'
    },
    {
      name: 'idx_messages_receiver_id', 
      table: 'messages',
      column: 'receiver_id'
    },
    {
      name: 'idx_messages_listing_id',
      table: 'messages', 
      column: 'listing_id'
    }
  ];
  
  for (const index of indexes) {
    try {
      // Check if index exists
      const indexExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE indexname = $1
        );
      `, [index.name]);
      
      if (!indexExists.rows[0].exists) {
        await pool.query(`CREATE INDEX ${index.name} ON ${index.table}(${index.column});`);
        console.log(`✅ Created index: ${index.name}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not create index ${index.name}:`, error instanceof Error ? error.message : error);
    }
  }
}
