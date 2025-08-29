import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.join(process.cwd(), 'affiliate_system.db');
const db = new Database(dbPath);

export const initSQLiteDatabase = async () => {
  try {
    console.log('🚀 Initializing SQLite database...');
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Run migrations
    await runSQLiteMigrations();
    console.log('✅ SQLite database initialized successfully');
    
    return db;
  } catch (error) {
    console.error('❌ SQLite database initialization failed:', error);
    throw error;
  }
};

const runSQLiteMigrations = async () => {
  try {
    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'affiliate' CHECK (role IN ('admin', 'affiliate', 'client')),
        referrer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        referral_code TEXT UNIQUE NOT NULL,
        tier TEXT DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
        is_active BOOLEAN DEFAULT 1,
        email_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Affiliate links table
    db.exec(`
      CREATE TABLE IF NOT EXISTS affiliate_links (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        affiliate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        link_code TEXT UNIQUE NOT NULL,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Transactions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        customer_email TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        affiliate_link_id TEXT REFERENCES affiliate_links(id) ON DELETE SET NULL,
        referrer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
        transaction_type TEXT DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'subscription', 'upgrade')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Commissions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS commissions (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        affiliate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
        amount DECIMAL(10,2) NOT NULL,
        rate DECIMAL(5,2) NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
        paid_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Email invites table
    db.exec(`
      CREATE TABLE IF NOT EXISTS email_invites (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        affiliate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'clicked', 'converted')),
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        clicked_at DATETIME,
        converted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Bonuses table
    db.exec(`
      CREATE TABLE IF NOT EXISTS bonuses (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        affiliate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('signup', 'milestone', 'tier_upgrade', 'special')),
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id);
      CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
      CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_id ON affiliate_links(affiliate_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_referrer_id ON transactions(referrer_id);
      CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON commissions(affiliate_id);
      CREATE INDEX IF NOT EXISTS idx_commissions_transaction_id ON commissions(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_email_invites_affiliate_id ON email_invites(affiliate_id);
      CREATE INDEX IF NOT EXISTS idx_bonuses_affiliate_id ON bonuses(affiliate_id);
    `);
    
    console.log('✅ SQLite migrations completed successfully');
    
  } catch (error) {
    console.error('❌ SQLite migration failed:', error);
    throw error;
  }
};

export { db };
export default db;