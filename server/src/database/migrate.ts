import { initDatabase, pool } from './init';

const MIGRATIONS_SQL = `
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'affiliate' CHECK (role IN ('admin', 'affiliate', 'client')),
  referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(255) UNIQUE NOT NULL,
  tier VARCHAR(50) DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Bank Details Table
CREATE TABLE IF NOT EXISTS bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'crypto', 'check')),
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(255),
  routing_number VARCHAR(255),
  bank_name VARCHAR(255),
  paypal_email VARCHAR(255),
  stripe_account_id VARCHAR(255),
  crypto_wallet_address VARCHAR(255),
  crypto_currency VARCHAR(50),
  check_payable_to VARCHAR(255),
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS set_timestamp_bank_details ON bank_details;
CREATE TRIGGER set_timestamp_bank_details BEFORE UPDATE ON bank_details FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Affiliate Links Table
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_code VARCHAR(255) UNIQUE NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS set_timestamp_affiliate_links ON affiliate_links;
CREATE TRIGGER set_timestamp_affiliate_links BEFORE UPDATE ON affiliate_links FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  transaction_type VARCHAR(50) DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'subscription', 'upgrade')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS set_timestamp_transactions ON transactions;
CREATE TRIGGER set_timestamp_transactions BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Commissions Table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  amount DECIMAL(10,2) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS set_timestamp_commissions ON commissions;
CREATE TRIGGER set_timestamp_commissions BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Email Invites Table
CREATE TABLE IF NOT EXISTS email_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  message TEXT,
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'clicked', 'converted')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bonuses Table
CREATE TABLE IF NOT EXISTS bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('signup', 'milestone', 'tier_upgrade', 'special')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS set_timestamp_bonuses ON bonuses;
CREATE TRIGGER set_timestamp_bonuses BEFORE UPDATE ON bonuses FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_id ON affiliate_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_transactions_referrer_id ON transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_transaction_id ON commissions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_email_invites_affiliate_id ON email_invites(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_bonuses_affiliate_id ON bonuses(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_bank_details_user_id ON bank_details(user_id);

-- Email Referrals Table
CREATE TABLE IF NOT EXISTS email_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'converted', 'expired')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  conversion_value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS set_timestamp_email_referrals ON email_referrals;
CREATE TRIGGER set_timestamp_email_referrals BEFORE UPDATE ON email_referrals FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE INDEX IF NOT EXISTS idx_email_referrals_affiliate_id ON email_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_email_referrals_email ON email_referrals(email);
CREATE INDEX IF NOT EXISTS idx_email_referrals_status ON email_referrals(status);

-- Commission Levels Table
CREATE TABLE IF NOT EXISTS commission_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL UNIQUE CHECK (level IN (1, 2, 3)),
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  min_referrals INTEGER DEFAULT 0,
  max_referrals INTEGER DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS set_timestamp_commission_levels ON commission_levels;
CREATE TRIGGER set_timestamp_commission_levels BEFORE UPDATE ON commission_levels FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE INDEX IF NOT EXISTS idx_commission_levels_level ON commission_levels(level);
CREATE INDEX IF NOT EXISTS idx_commission_levels_active ON commission_levels(is_active);

-- Commission Settings Table
CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  global_commission_enabled BOOLEAN DEFAULT TRUE,
  default_level1_commission DECIMAL(5,2) DEFAULT 15.00,
  default_level2_commission DECIMAL(5,2) DEFAULT 5.00,
  default_level3_commission DECIMAL(5,2) DEFAULT 2.50,
  max_commission_levels INTEGER DEFAULT 3,
  auto_adjust_enabled BOOLEAN DEFAULT FALSE,
  minimum_commission DECIMAL(5,2) DEFAULT 0.00,
  maximum_commission DECIMAL(5,2) DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS set_timestamp_commission_settings ON commission_settings;
CREATE TRIGGER set_timestamp_commission_settings BEFORE UPDATE ON commission_settings FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
`;

const runMigrations = async () => {
  await initDatabase({ isMigration: true });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🚀 Running PostgreSQL migrations...');
    await client.query(MIGRATIONS_SQL);
    await client.query('COMMIT');
    console.log('✅ PostgreSQL migrations completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));