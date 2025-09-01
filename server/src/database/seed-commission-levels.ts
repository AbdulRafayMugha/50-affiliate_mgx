import { pool } from './init';

const seedCommissionLevels = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Seeding commission levels...');
    
    // Insert default commission levels
    await client.query(`
      INSERT INTO commission_levels (level, percentage, description, is_active, min_referrals, max_referrals)
      VALUES 
        (1, 15.00, 'Direct referrals commission', true, 0, 999),
        (2, 5.00, 'Second level referrals commission', true, 0, 999),
        (3, 2.50, 'Third level referrals commission', true, 0, 999)
      ON CONFLICT (level) DO UPDATE SET
        percentage = EXCLUDED.percentage,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        min_referrals = EXCLUDED.min_referrals,
        max_referrals = EXCLUDED.max_referrals,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    // Insert default commission settings
    await client.query(`
      INSERT INTO commission_settings (
        global_commission_enabled,
        default_level1_commission,
        default_level2_commission,
        default_level3_commission,
        max_commission_levels,
        auto_adjust_enabled,
        minimum_commission,
        maximum_commission
      )
      VALUES (true, 15.00, 5.00, 2.50, 3, false, 0.00, 100.00)
      ON CONFLICT (id) DO UPDATE SET
        global_commission_enabled = EXCLUDED.global_commission_enabled,
        default_level1_commission = EXCLUDED.default_level1_commission,
        default_level2_commission = EXCLUDED.default_level2_commission,
        default_level3_commission = EXCLUDED.default_level3_commission,
        max_commission_levels = EXCLUDED.max_commission_levels,
        auto_adjust_enabled = EXCLUDED.auto_adjust_enabled,
        minimum_commission = EXCLUDED.minimum_commission,
        maximum_commission = EXCLUDED.maximum_commission,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    await client.query('COMMIT');
    console.log('✅ Commission levels seeded successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed commission levels:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run if called directly
if (require.main === module) {
  seedCommissionLevels()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedCommissionLevels;
