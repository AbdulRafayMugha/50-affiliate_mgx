"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.initSQLiteDatabase = void 0;
const tslib_1 = require("tslib");
const better_sqlite3_1 = tslib_1.__importDefault(require("better-sqlite3"));
const path_1 = tslib_1.__importDefault(require("path"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
const dbPath = path_1.default.join(process.cwd(), 'affiliate_system.db');
const db = new better_sqlite3_1.default(dbPath);
exports.db = db;
const initSQLiteDatabase = async () => {
    try {
        console.log('🚀 Initializing SQLite database...');
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        // Run migrations
        await runSQLiteMigrations();
        console.log('✅ SQLite database initialized successfully');
        return db;
    }
    catch (error) {
        console.error('❌ SQLite database initialization failed:', error);
        throw error;
    }
};
exports.initSQLiteDatabase = initSQLiteDatabase;
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
        // Commission Levels table
        db.exec(`
      CREATE TABLE IF NOT EXISTS commission_levels (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        level INTEGER NOT NULL UNIQUE CHECK (level IN (1, 2, 3)),
        percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
        description TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        min_referrals INTEGER DEFAULT 0,
        max_referrals INTEGER DEFAULT 999,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Commission Settings table
        db.exec(`
      CREATE TABLE IF NOT EXISTS commission_settings (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        global_commission_enabled BOOLEAN DEFAULT 1,
        default_level1_commission DECIMAL(5,2) DEFAULT 15.00,
        default_level2_commission DECIMAL(5,2) DEFAULT 5.00,
        default_level3_commission DECIMAL(5,2) DEFAULT 2.50,
        max_commission_levels INTEGER DEFAULT 3,
        auto_adjust_enabled BOOLEAN DEFAULT 0,
        minimum_commission DECIMAL(5,2) DEFAULT 0.00,
        maximum_commission DECIMAL(5,2) DEFAULT 100.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Email referrals table
        db.exec(`
      CREATE TABLE IF NOT EXISTS email_referrals (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        affiliate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        name TEXT,
        phone_number TEXT,
        status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'converted', 'expired')),
        invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        confirmed_at DATETIME,
        converted_at DATETIME,
        expires_at DATETIME NOT NULL,
        conversion_value DECIMAL(10,2),
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
      CREATE INDEX IF NOT EXISTS idx_commission_levels_level ON commission_levels(level);
      CREATE INDEX IF NOT EXISTS idx_commission_levels_active ON commission_levels(is_active);
      CREATE INDEX IF NOT EXISTS idx_email_referrals_affiliate_id ON email_referrals(affiliate_id);
      CREATE INDEX IF NOT EXISTS idx_email_referrals_email ON email_referrals(email);
      CREATE INDEX IF NOT EXISTS idx_email_referrals_status ON email_referrals(status);
    `);
        console.log('✅ SQLite migrations completed successfully');
    }
    catch (error) {
        console.error('❌ SQLite migration failed:', error);
        throw error;
    }
};
exports.default = db;
//# sourceMappingURL=sqlite-init.js.map