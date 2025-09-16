// migrate-to-mariadb.ts
import dotenv from 'dotenv';
dotenv.config();

import { initDatabase, pool } from './init';
import mysql from 'mysql2/promise';

const DB_NAME = process.env.DB_NAME || (() => {
  // try to parse DB name from DATABASE_URL if not provided
  const url = process.env.DATABASE_URL || '';
  try {
    const u = new URL(url);
    return u.pathname?.replace('/', '') || 'myapp';
  } catch {
    return 'myapp';
  }
})();

const MIGRATIONS_SQL = `
/* -------------------------
   Database + Schema for MariaDB
   Converted from Postgres migrations
   ------------------------- */

CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`${DB_NAME}\`;

/* USERS table */
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'affiliate',
  referrer_id CHAR(36),
  referral_code VARCHAR(255) UNIQUE NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  email_verified TINYINT(1) DEFAULT 0,
  email_verification_token VARCHAR(255),
  email_verification_expires DATETIME,
  password_reset_token VARCHAR(255),
  password_reset_expires DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  coordinator_id CHAR(36) NULL,
  CONSTRAINT fk_users_referrer FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_users_coordinator FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'affiliate', 'client', 'coordinator'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Trigger to set UUID on insert (users) */
DROP TRIGGER IF EXISTS trg_users_uuid;
CREATE TRIGGER trg_users_uuid BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END;

/* BANK DETAILS table */
CREATE TABLE IF NOT EXISTS bank_details (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(255),
  routing_number VARCHAR(255),
  bank_name VARCHAR(255),
  paypal_email VARCHAR(255),
  stripe_account_id VARCHAR(255),
  crypto_wallet_address VARCHAR(255),
  crypto_currency VARCHAR(50),
  check_payable_to VARCHAR(255),
  is_default TINYINT(1) DEFAULT 0,
  is_verified TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bank_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_bank_payment_method CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'crypto', 'check'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_bank_details_uuid;
CREATE TRIGGER trg_bank_details_uuid BEFORE INSERT ON bank_details
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END;

/* AFFILIATE LINKS table */
CREATE TABLE IF NOT EXISTS affiliate_links (
  id CHAR(36) NOT NULL PRIMARY KEY,
  affiliate_id CHAR(36) NOT NULL,
  link_code VARCHAR(255) UNIQUE NOT NULL,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_affiliate_links_affiliate FOREIGN KEY (affiliate_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_affiliate_links_uuid;
CREATE TRIGGER trg_affiliate_links_uuid BEFORE INSERT ON affiliate_links
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END;

/* TRANSACTIONS table */
CREATE TABLE IF NOT EXISTS transactions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  affiliate_link_id CHAR(36),
  referrer_id CHAR(36),
  status VARCHAR(50) DEFAULT 'completed',
  transaction_type VARCHAR(50) DEFAULT 'purchase',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_affiliate_link FOREIGN KEY (affiliate_link_id) REFERENCES affiliate_links(id) ON DELETE SET NULL,
  CONSTRAINT fk_transactions_referrer FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_transactions_status CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  CONSTRAINT chk_transactions_type CHECK (transaction_type IN ('purchase', 'subscription', 'upgrade'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_transactions_uuid;
CREATE TRIGGER trg_transactions_uuid BEFORE INSERT ON transactions
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END;

/* COMMISSIONS table */
CREATE TABLE IF NOT EXISTS commissions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  affiliate_id CHAR(36) NOT NULL,
  transaction_id CHAR(36) NOT NULL,
  level INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_commissions_affiliate FOREIGN KEY (affiliate_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_commissions_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  CONSTRAINT chk_commissions_level CHECK (level IN (1,2,3)),
  CONSTRAINT chk_commissions_status CHECK (status IN ('pending','approved','paid','cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_commissions_uuid;
CREATE TRIGGER trg_commissions_uuid BEFORE INSERT ON commissions
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END;

/* EMAIL INVITES table */
CREATE TABLE IF NOT EXISTS email_invites (
  id CHAR(36) NOT NULL PRIMARY KEY,
  affiliate_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  clicked_at DATETIME,
  converted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_invites_affiliate FOREIGN KEY (affiliate_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_email_invites_status CHECK (status IN ('sent','opened','clicked','converted'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_email_invites_uuid;
CREATE TRIGGER trg_email_invites_uuid BEFORE INSERT ON email_invites
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END;

/* BONUSES table */
CREATE TABLE IF NOT EXISTS bonuses (
  id CHAR(36) NOT NULL PRIMARY KEY,
  affiliate_id CHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bonuses_affiliate FOREIGN KEY (affiliate_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_bonuses_type CHECK (type IN ('signup','milestone','tier_upgrade','special')),
  CONSTRAINT chk_bonuses_status CHECK (status IN ('pending','approved','paid'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_bonuses_uuid;
CREATE TRIGGER trg_bonuses_uuid BEFORE INSERT ON bonuses
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END;

/* EMAIL REFERRALS table */
CREATE TABLE IF NOT EXISTS email_referrals (
  id CHAR(36) NOT NULL PRIMARY KEY,
  affiliate_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone_number VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'invited',
  invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  converted_at DATETIME,
  expires_at DATETIME NOT NULL,
  conversion_value DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_referrals_affiliate FOREIGN KEY (affiliate_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_email_referrals_status CHECK (status IN ('invited','confirmed','converted','expired'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_email_referrals_uuid;
CREATE TRIGGER trg_email_referrals_uuid BEFORE INSERT ON email_referrals
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END;

/* COMMISSION LEVELS table */
CREATE TABLE IF NOT EXISTS commission_levels (
  id CHAR(36) NOT NULL PRIMARY KEY,
  level INT NOT NULL UNIQUE,
  percentage DECIMAL(5,2) NOT NULL,
  description TEXT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  min_referrals INT DEFAULT 0,
  max_referrals INT DEFAULT 999,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_commission_levels_percentage CHECK (percentage >= 0 AND percentage <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_commission_levels_uuid;
CREATE TRIGGER trg_commission_levels_uuid BEFORE INSERT ON commission_levels
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END;

/* COMMISSION SETTINGS table */
CREATE TABLE IF NOT EXISTS commission_settings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  global_commission_enabled TINYINT(1) DEFAULT 1,
  default_level1_commission DECIMAL(5,2) DEFAULT 15.00,
  default_level2_commission DECIMAL(5,2) DEFAULT 5.00,
  default_level3_commission DECIMAL(5,2) DEFAULT 2.50,
  max_commission_levels INT DEFAULT 3,
  auto_adjust_enabled TINYINT(1) DEFAULT 0,
  minimum_commission DECIMAL(5,2) DEFAULT 0.00,
  maximum_commission DECIMAL(5,2) DEFAULT 100.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_commission_settings_uuid;
CREATE TRIGGER trg_commission_settings_uuid BEFORE INSERT ON commission_settings
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END;

/* Indexes */
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_id ON affiliate_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_transactions_referrer_id ON transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_transaction_id ON commissions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_email_invites_affiliate_id ON email_invites(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_bonuses_affiliate_id ON bonuses(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_bank_details_user_id ON bank_details(user_id);
CREATE INDEX IF NOT EXISTS idx_email_referrals_affiliate_id ON email_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_email_referrals_email ON email_referrals(email);
CREATE INDEX IF NOT EXISTS idx_email_referrals_status ON email_referrals(status);
CREATE INDEX IF NOT EXISTS idx_commission_levels_level ON commission_levels(level);
CREATE INDEX IF NOT EXISTS idx_commission_levels_active ON commission_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_users_coordinator_id ON users(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
`;

/**
 * Run migrations using the provided pool (from ./init).
 * If the pool cannot execute multiple statements at once, fall back to a dedicated connection
 * with multipleStatements enabled.
 */
async function runMigrations() {
  console.log('Initializing database connection via initDatabase()...');
  try {
    await initDatabase({ isMigration: true });
  } catch (err) {
    // initDatabase will throw if connection fails; show helpful message and rethrow
    console.error('Failed to initialize DB via initDatabase():', err);
    throw err;
  }

  // Try running the SQL using the existing pool
  try {
    console.log('Attempting to run migrations using existing pool...');
    // some pools/connection configs require multipleStatements; attempt single-call first
    await pool.query(MIGRATIONS_SQL);
    console.log('✅ Migrations applied successfully using pool.');
    return;
  } catch (err) {
    console.warn('Pool execution failed (likely due to multipleStatements not enabled). Falling back to temporary connection.');
    console.warn('Pool error:', err.message || err);
  }

  // Fallback: create a dedicated connection with multipleStatements=true
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set in environment for fallback connection.');
  }

  // createConnection from mysql2/promise with multipleStatements true
  let tempConn;
  try {
    tempConn = await mysql.createConnection({
      uri: dbUrl,
      multipleStatements: true,
      charset: 'utf8mb4'
    } as any);
    console.log('Connected using fallback connection with multipleStatements=true');

    await tempConn.query(MIGRATIONS_SQL);
    console.log('✅ Migrations applied successfully using fallback connection.');
  } catch (err) {
    console.error('❌ Migration failed using fallback connection:', err);
    throw err;
  } finally {
    if (tempConn) {
      await tempConn.end();
    }
  }
}

/* Run when executed directly */
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration encountered an error:', err);
      process.exit(1);
    });
}

export { runMigrations };
