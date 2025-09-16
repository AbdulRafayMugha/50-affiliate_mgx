// src/database/seedCommissionLevels.ts
import { pool } from './init';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

const seedCommissionLevels = async () => {
  let conn: PoolConnection | null = null;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    console.log('🌱 Seeding commission levels (MySQL/MariaDB)...');

    // commission_levels: use INSERT ... ON DUPLICATE KEY UPDATE
    // (requires commission_levels.level to be UNIQUE)
    const seedLevelsSql = `
      INSERT INTO commission_levels
        (level, percentage, description, is_active, min_referrals, max_referrals, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, NOW(), NOW()),
        (?, ?, ?, ?, ?, ?, NOW(), NOW()),
        (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        percentage = VALUES(percentage),
        description = VALUES(description),
        is_active = VALUES(is_active),
        min_referrals = VALUES(min_referrals),
        max_referrals = VALUES(max_referrals),
        updated_at = NOW()
    `;

    await conn.query(seedLevelsSql, [
      1, 15.0, 'Direct referrals commission', 1, 0, 999,
      2, 5.0, 'Second level referrals commission', 1, 0, 999,
      3, 2.5, 'Third level referrals commission', 1, 0, 999
    ]);

    // commission_settings: there should typically be a single settings row.
    // We'll check if any row exists; if yes -> UPDATE, otherwise -> INSERT.
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM commission_settings`
    );

    const existingCount = rows && rows.length > 0 ? Number(rows[0].cnt || 0) : 0;

    if (existingCount === 0) {
      const insertSettingsSql = `
        INSERT INTO commission_settings (
          global_commission_enabled,
          default_level1_commission,
          default_level2_commission,
          default_level3_commission,
          max_commission_levels,
          auto_adjust_enabled,
          minimum_commission,
          maximum_commission,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await conn.query(insertSettingsSql, [
        1,        // global_commission_enabled (true)
        15.0,     // default_level1_commission
        5.0,      // default_level2_commission
        2.5,      // default_level3_commission
        3,        // max_commission_levels
        0,        // auto_adjust_enabled (false)
        0.0,      // minimum_commission
        100.0     // maximum_commission
      ]);
    } else {
      const updateSettingsSql = `
        UPDATE commission_settings SET
          global_commission_enabled = ?,
          default_level1_commission = ?,
          default_level2_commission = ?,
          default_level3_commission = ?,
          max_commission_levels = ?,
          auto_adjust_enabled = ?,
          minimum_commission = ?,
          maximum_commission = ?,
          updated_at = NOW()
      `;
      await conn.query(updateSettingsSql, [
        1,
        15.0,
        5.0,
        2.5,
        3,
        0,
        0.0,
        100.0
      ]);
    }

    await conn.commit();
    console.log('✅ Commission levels & settings seeded successfully.');
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr);
      }
    }
    console.error('❌ Failed to seed commission levels:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// Run if called directly
if (require.main === module) {
  seedCommissionLevels()
    .then(() => {
      console.log('Seeding completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed.', err);
      process.exit(1);
    });
}

export default seedCommissionLevels;
