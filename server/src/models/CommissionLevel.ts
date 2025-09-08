import { pool } from '../database/init';

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

export class CommissionLevelModel {
  // Get all commission levels
  static async getAll(): Promise<CommissionLevel[]> {
    const { rows } = await pool.query(`
      SELECT 
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
       ORDER BY level ASC
    `);
    
    return rows.map(row => ({
      id: row.id,
      level: row.level,
      percentage: row.percentage,
      description: row.description,
      isActive: Boolean(row.is_active),
      minReferrals: row.min_referrals,
      maxReferrals: row.max_referrals,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  // Get a specific commission level by ID
  static async getById(id: string): Promise<CommissionLevel | null> {
    const { rows } = await pool.query(`
      SELECT 
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
       WHERE id = $1
    `, [id]);
    
    const row = rows[0];
    if (!row) return null;
    
    return {
      id: row.id,
      level: row.level,
      percentage: row.percentage,
      description: row.description,
      isActive: Boolean(row.is_active),
      minReferrals: row.min_referrals,
      maxReferrals: row.max_referrals,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Get commission level by level number
  static async getByLevel(level: number): Promise<CommissionLevel | null> {
    const { rows } = await pool.query(`
      SELECT 
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
       WHERE level = $1
    `, [level]);
    
    const row = rows[0];
    if (!row) return null;
    
    return {
      id: row.id,
      level: row.level,
      percentage: row.percentage,
      description: row.description,
      isActive: Boolean(row.is_active),
      minReferrals: row.min_referrals,
      maxReferrals: row.max_referrals,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Create a new commission level
  static async create(data: Omit<CommissionLevel, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommissionLevel> {
    const { rows } = await pool.query(`
      INSERT INTO commission_levels (
        level, percentage, description, is_active, min_referrals, max_referrals
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      data.level, 
      data.percentage, 
      data.description, 
      data.isActive, 
      data.minReferrals || 0, 
      data.maxReferrals || 999
    ]);
    
    const row = rows[0];
    return {
      ...row,
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Update a commission level
  static async update(id: string, data: Partial<CommissionLevel>): Promise<CommissionLevel | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.level !== undefined) {
      fields.push(`level = $${paramIndex++}`);
      values.push(data.level);
    }
    if (data.percentage !== undefined) {
      fields.push(`percentage = $${paramIndex++}`);
      values.push(data.percentage);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }
    if (data.minReferrals !== undefined) {
      fields.push(`min_referrals = $${paramIndex++}`);
      values.push(data.minReferrals);
    }
    if (data.maxReferrals !== undefined) {
      fields.push(`max_referrals = $${paramIndex++}`);
      values.push(data.maxReferrals);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    const { rowCount } = await pool.query(`
      UPDATE commission_levels 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `, [...values, id]);
    
    if (rowCount === 0) {
      return null;
    }
    
    return this.getById(id);
  }

  // Delete a commission level
  static async delete(id: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM commission_levels WHERE id = $1', [id]);
    return rowCount > 0;
  }

  // Toggle commission level status
  static async toggleStatus(id: string, isActive: boolean): Promise<CommissionLevel | null> {
    const { rowCount } = await pool.query(`
      UPDATE commission_levels 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [isActive, id]);
    
    if (rowCount === 0) {
      return null;
    }
    
    return this.getById(id);
  }

  // Get commission settings
  static async getSettings(): Promise<CommissionSettings | null> {
    const { rows } = await pool.query(`
      SELECT 
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
       LIMIT 1
    `);
    
    const row = rows[0];
    if (!row) return null;
    
    return {
      id: row.id,
      globalCommissionEnabled: Boolean(row.global_commission_enabled),
      defaultLevel1Commission: row.default_level1_commission,
      defaultLevel2Commission: row.default_level2_commission,
      defaultLevel3Commission: row.default_level3_commission,
      maxCommissionLevels: row.max_commission_levels,
      autoAdjustEnabled: Boolean(row.auto_adjust_enabled),
      minimumCommission: row.minimum_commission,
      maximumCommission: row.maximum_commission,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Update commission settings
  static async updateSettings(data: Partial<CommissionSettings>): Promise<CommissionSettings | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.globalCommissionEnabled !== undefined) {
      fields.push(`global_commission_enabled = $${paramIndex++}`);
      values.push(data.globalCommissionEnabled);
    }
    if (data.defaultLevel1Commission !== undefined) {
      fields.push(`default_level1_commission = $${paramIndex++}`);
      values.push(data.defaultLevel1Commission);
    }
    if (data.defaultLevel2Commission !== undefined) {
      fields.push(`default_level2_commission = $${paramIndex++}`);
      values.push(data.defaultLevel2Commission);
    }
    if (data.defaultLevel3Commission !== undefined) {
      fields.push(`default_level3_commission = $${paramIndex++}`);
      values.push(data.defaultLevel3Commission);
    }
    if (data.maxCommissionLevels !== undefined) {
      fields.push(`max_commission_levels = $${paramIndex++}`);
      values.push(data.maxCommissionLevels);
    }
    if (data.autoAdjustEnabled !== undefined) {
      fields.push(`auto_adjust_enabled = $${paramIndex++}`);
      values.push(data.autoAdjustEnabled);
    }
    if (data.minimumCommission !== undefined) {
      fields.push(`minimum_commission = $${paramIndex++}`);
      values.push(data.minimumCommission);
    }
    if (data.maximumCommission !== undefined) {
      fields.push(`maximum_commission = $${paramIndex++}`);
      values.push(data.maximumCommission);
    }

    if (fields.length === 0) {
      return this.getSettings();
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    const { rowCount } = await pool.query(`
      UPDATE commission_settings 
      SET ${fields.join(', ')}
      WHERE id = (SELECT id FROM commission_settings LIMIT 1)
    `, values);
    
    if (rowCount === 0) {
      return null;
    }
    
    return this.getSettings();
  }

  // Reset to default commission levels
  static async resetToDefaults(): Promise<void> {
    // Reset commission levels to defaults
    await pool.query(`
      UPDATE commission_levels 
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
        is_active = true,
        min_referrals = 0,
        max_referrals = 999,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    // Reset commission settings to defaults
    await pool.query(`
      UPDATE commission_settings 
      SET 
        global_commission_enabled = true,
        default_level1_commission = 15.00,
        default_level2_commission = 5.00,
        default_level3_commission = 2.50,
        max_commission_levels = 3,
        auto_adjust_enabled = false,
        minimum_commission = 0.00,
        maximum_commission = 100.00,
        updated_at = CURRENT_TIMESTAMP
    `);
  }
}
