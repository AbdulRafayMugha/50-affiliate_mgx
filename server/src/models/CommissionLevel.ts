// src/models/CommissionLevelModel.ts
import { pool } from '../database/init';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface CommissionLevel {
  id: string;
  level: number;
  percentage: number;
  description: string;
  isActive: boolean;
  minReferrals?: number;
  maxReferrals?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionSettings {
  id: string;
  globalCommissionEnabled: boolean;
  defaultLevel1Commission: number;
  defaultLevel2Commission: number;
  defaultLevel3Commission: number;
  maxCommissionLevels: number;
  autoAdjustEnabled: boolean;
  minimumCommission: number;
  maximumCommission: number;
  createdAt: Date;
  updatedAt: Date;
}

type DBRow = RowDataPacket & Record<string, any>;

export class CommissionLevelModel {
  // Get all commission levels
  static async getAll(): Promise<CommissionLevel[]> {
    const [rows] = await pool.query<DBRow[]>(
      `SELECT 
         id,
         level,
         percentage,
         description,
         is_active,
         min_referrals,
         max_referrals,
         created_at,
         updated_at
       FROM commission_levels 
       ORDER BY level ASC`
    );

    return (rows || []).map(this.mapLevelRow);
  }

  // Get a specific commission level by ID
  static async getById(id: string): Promise<CommissionLevel | null> {
    const [rows] = await pool.query<DBRow[]>(
      `SELECT 
         id,
         level,
         percentage,
         description,
         is_active,
         min_referrals,
         max_referrals,
         created_at,
         updated_at
       FROM commission_levels 
       WHERE id = ? LIMIT 1`,
      [id]
    );

    const row = rows && rows[0];
    return row ? this.mapLevelRow(row) : null;
  }

  // Get commission level by level number
  static async getByLevel(level: number): Promise<CommissionLevel | null> {
    const [rows] = await pool.query<DBRow[]>(
      `SELECT 
         id,
         level,
         percentage,
         description,
         is_active,
         min_referrals,
         max_referrals,
         created_at,
         updated_at
       FROM commission_levels 
       WHERE level = ? LIMIT 1`,
      [level]
    );

    const row = rows && rows[0];
    return row ? this.mapLevelRow(row) : null;
  }

  // Create a new commission level
  static async create(data: Omit<CommissionLevel, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommissionLevel> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query<OkPacket>(
        `INSERT INTO commission_levels 
           (id, level, percentage, description, is_active, min_referrals, max_referrals, created_at, updated_at)
         VALUES (NULL, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.level,
          data.percentage,
          data.description,
          data.isActive ? 1 : 0,
          data.minReferrals ?? 0,
          data.maxReferrals ?? 999
        ]
      );

      const [rows] = await conn.query<DBRow[]>(
        `SELECT id, level, percentage, description, is_active, min_referrals, max_referrals, created_at, updated_at
         FROM commission_levels
         WHERE level = ? ORDER BY created_at DESC LIMIT 1`,
        [data.level]
      );

      await conn.commit();

      const row = rows && rows[0];
      if (!row) throw new Error('Failed to fetch created commission level');
      return this.mapLevelRow(row);
    } catch (err) {
      try { await conn.rollback(); } catch (_) { /* ignore */ }
      throw err;
    } finally {
      conn.release();
    }
  }

  // Update a commission level
  static async update(id: string, data: Partial<CommissionLevel>): Promise<CommissionLevel | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.level !== undefined) {
      fields.push(`level = ?`);
      values.push(data.level);
    }
    if (data.percentage !== undefined) {
      fields.push(`percentage = ?`);
      values.push(data.percentage);
    }
    if (data.description !== undefined) {
      fields.push(`description = ?`);
      values.push(data.description);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = ?`);
      values.push(data.isActive ? 1 : 0);
    }
    if (data.minReferrals !== undefined) {
      fields.push(`min_referrals = ?`);
      values.push(data.minReferrals);
    }
    if (data.maxReferrals !== undefined) {
      fields.push(`max_referrals = ?`);
      values.push(data.maxReferrals);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    fields.push('updated_at = NOW()');
    const sql = `UPDATE commission_levels SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await pool.query<OkPacket>(sql, [...values, id]);
    if ((result as OkPacket).affectedRows === 0) return null;

    return this.getById(id);
  }

  // Delete a commission level
  static async delete(id: string): Promise<boolean> {
    const [result] = await pool.query<OkPacket>('DELETE FROM commission_levels WHERE id = ?', [id]);
    return (result as OkPacket).affectedRows > 0;
  }

  // Toggle commission level status
  static async toggleStatus(id: string, isActive: boolean): Promise<CommissionLevel | null> {
    const [result] = await pool.query<OkPacket>(
      `UPDATE commission_levels 
       SET is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [isActive ? 1 : 0, id]
    );
    if ((result as OkPacket).affectedRows === 0) return null;
    return this.getById(id);
  }

  // Get commission settings
  static async getSettings(): Promise<CommissionSettings | null> {
    const [rows] = await pool.query<DBRow[]>(
      `SELECT 
         id,
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
       FROM commission_settings 
       LIMIT 1`
    );

    const row = rows && rows[0];
    if (!row) return null;

    return {
      id: row.id,
      globalCommissionEnabled: !!Number(row.global_commission_enabled),
      defaultLevel1Commission: Number(row.default_level1_commission),
      defaultLevel2Commission: Number(row.default_level2_commission),
      defaultLevel3Commission: Number(row.default_level3_commission),
      maxCommissionLevels: Number(row.max_commission_levels),
      autoAdjustEnabled: !!Number(row.auto_adjust_enabled),
      minimumCommission: Number(row.minimum_commission),
      maximumCommission: Number(row.maximum_commission),
      createdAt: row.created_at ? new Date(row.created_at as any) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at as any) : new Date()
    };
  }

  // Update commission settings
  static async updateSettings(data: Partial<CommissionSettings>): Promise<CommissionSettings | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.globalCommissionEnabled !== undefined) {
      fields.push(`global_commission_enabled = ?`);
      values.push(data.globalCommissionEnabled ? 1 : 0);
    }
    if (data.defaultLevel1Commission !== undefined) {
      fields.push(`default_level1_commission = ?`);
      values.push(data.defaultLevel1Commission);
    }
    if (data.defaultLevel2Commission !== undefined) {
      fields.push(`default_level2_commission = ?`);
      values.push(data.defaultLevel2Commission);
    }
    if (data.defaultLevel3Commission !== undefined) {
      fields.push(`default_level3_commission = ?`);
      values.push(data.defaultLevel3Commission);
    }
    if (data.maxCommissionLevels !== undefined) {
      fields.push(`max_commission_levels = ?`);
      values.push(data.maxCommissionLevels);
    }
    if (data.autoAdjustEnabled !== undefined) {
      fields.push(`auto_adjust_enabled = ?`);
      values.push(data.autoAdjustEnabled ? 1 : 0);
    }
    if (data.minimumCommission !== undefined) {
      fields.push(`minimum_commission = ?`);
      values.push(data.minimumCommission);
    }
    if (data.maximumCommission !== undefined) {
      fields.push(`maximum_commission = ?`);
      values.push(data.maximumCommission);
    }

    if (fields.length === 0) {
      return this.getSettings();
    }

    fields.push('updated_at = NOW()');

    const sql = `UPDATE commission_settings SET ${fields.join(', ')} WHERE id = (SELECT id FROM commission_settings LIMIT 1)`;
    const [result] = await pool.query<OkPacket>(sql, values);
    if ((result as OkPacket).affectedRows === 0) return null;
    return this.getSettings();
  }

  // Reset to default commission levels and settings
  static async resetToDefaults(): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE commission_levels 
         SET 
           percentage = CASE 
             WHEN level = 1 THEN 15.00
             WHEN level = 2 THEN 5.00
             WHEN level = 3 THEN 2.50
           END,
           description = CASE 
             WHEN level = 1 THEN 'Direct referrals commission'
             WHEN level = 2 THEN 'Second level referrals commission'
             WHEN level = 3 THEN 'Third level referrals commission'
           END,
           is_active = 1,
           min_referrals = 0,
           max_referrals = 999,
           updated_at = NOW()`
      );

      await conn.query(
        `UPDATE commission_settings 
         SET 
           global_commission_enabled = 1,
           default_level1_commission = 15.00,
           default_level2_commission = 5.00,
           default_level3_commission = 2.50,
           max_commission_levels = 3,
           auto_adjust_enabled = 0,
           minimum_commission = 0.00,
           maximum_commission = 100.00,
           updated_at = NOW()`
      );

      await conn.commit();
    } catch (err) {
      try { await conn.rollback(); } catch (_) { /* ignore */ }
      throw err;
    } finally {
      conn.release();
    }
  }

  // Helper to map a DB row into CommissionLevel
  private static mapLevelRow(row: DBRow): CommissionLevel {
    return {
      id: String(row.id),
      level: Number(row.level),
      percentage: Number(row.percentage),
      description: String(row.description),
      isActive: !!Number(row.is_active),
      minReferrals: row.min_referrals !== undefined ? Number(row.min_referrals) : undefined,
      maxReferrals: row.max_referrals !== undefined ? Number(row.max_referrals) : undefined,
      createdAt: row.created_at ? new Date(row.created_at as any) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at as any) : new Date()
    };
  }
}
