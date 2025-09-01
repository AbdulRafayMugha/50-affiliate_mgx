import { db } from './sqlite-init';

const seedCommissionLevels = async () => {
  try {
    console.log('🌱 Seeding commission levels for SQLite...');
    
    // Insert default commission levels
    const insertLevelsStmt = db.prepare(`
      INSERT OR REPLACE INTO commission_levels (id, level, percentage, description, is_active, min_referrals, max_referrals)
      VALUES 
        (hex(randomblob(16)), 1, 15.00, 'Direct referrals commission', 1, 0, 999),
        (hex(randomblob(16)), 2, 5.00, 'Second level referrals commission', 1, 0, 999),
        (hex(randomblob(16)), 3, 2.50, 'Third level referrals commission', 1, 0, 999)
    `);
    
    insertLevelsStmt.run();
    
    // Insert default commission settings
    const insertSettingsStmt = db.prepare(`
      INSERT OR REPLACE INTO commission_settings (
        id,
        global_commission_enabled,
        default_level1_commission,
        default_level2_commission,
        default_level3_commission,
        max_commission_levels,
        auto_adjust_enabled,
        minimum_commission,
        maximum_commission
      )
      VALUES (
        hex(randomblob(16)), 
        1, 15.00, 5.00, 2.50, 3, 0, 0.00, 100.00
      )
    `);
    
    insertSettingsStmt.run();
    
    console.log('✅ Commission levels seeded successfully for SQLite');
    
  } catch (error) {
    console.error('❌ Failed to seed commission levels:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  seedCommissionLevels()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedCommissionLevels;
