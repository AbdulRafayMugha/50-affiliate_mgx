// src/models/BankDetailsModel.ts
import { pool } from '../database/init';
import { RowDataPacket } from 'mysql2';

export interface BankDetails {
  id: string;
  user_id: string;
  payment_method: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto' | 'check';
  account_name: string;
  account_number?: string | null;
  routing_number?: string | null;
  bank_name?: string | null;
  paypal_email?: string | null;
  stripe_account_id?: string | null;
  crypto_wallet_address?: string | null;
  crypto_currency?: string | null;
  check_payable_to?: string | null;
  is_default: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBankDetailsInput {
  user_id: string;
  payment_method: BankDetails['payment_method'];
  account_name: string;
  account_number?: string;
  routing_number?: string;
  bank_name?: string;
  paypal_email?: string;
  stripe_account_id?: string;
  crypto_wallet_address?: string;
  crypto_currency?: string;
  check_payable_to?: string;
  is_default?: boolean;
}

type DBRow = RowDataPacket & Partial<Record<keyof BankDetails, any>>;

export class BankDetailsModel {
  /**
   * Create bank details entry. If is_default is true, unset other defaults for this user in the same transaction.
   */
  static async create(input: CreateBankDetailsInput): Promise<BankDetails> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (input.is_default) {
        await conn.query('UPDATE bank_details SET is_default = 0 WHERE user_id = ?', [input.user_id]);
      }

      await conn.query(
        `INSERT INTO bank_details
          (id, user_id, payment_method, account_name, account_number, routing_number, bank_name,
           paypal_email, stripe_account_id, crypto_wallet_address, crypto_currency, check_payable_to,
           is_default, is_verified, created_at, updated_at)
         VALUES
          (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          input.user_id,
          input.payment_method,
          input.account_name,
          input.account_number || null,
          input.routing_number || null,
          input.bank_name || null,
          input.paypal_email || null,
          input.stripe_account_id || null,
          input.crypto_wallet_address || null,
          input.crypto_currency || null,
          input.check_payable_to || null,
          input.is_default ? 1 : 0
        ]
      );

      // fetch inserted row
      const [rows] = await conn.query<DBRow[] & RowDataPacket[]>('SELECT * FROM bank_details WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [input.user_id]);
      const row = rows && rows[0];
      if (!row) throw new Error('Failed to fetch created bank details');

      await conn.commit();
      return this.mapRowToBankDetails(row);
    } catch (err) {
      try { await conn.rollback(); } catch (_) { /* ignore */ }
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getByUserId(userId: string): Promise<BankDetails[]> {
    const [rows] = await pool.query<DBRow[] & RowDataPacket[]>('SELECT * FROM bank_details WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId]);
    return (rows || []).map(this.mapRowToBankDetails);
  }

  static async getById(id: string): Promise<BankDetails | null> {
    const [rows] = await pool.query<DBRow[] & RowDataPacket[]>('SELECT * FROM bank_details WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return null;
    return this.mapRowToBankDetails(rows[0]);
  }

  /**
   * Update allowed fields. Uses whitelist to avoid accidental SQL injection.
   */
  static async update(id: string, updates: Partial<CreateBankDetailsInput & { is_default?: boolean }>): Promise<BankDetails> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // If setting default, unset other defaults for same user
      if (updates.is_default) {
        const [rows] = await conn.query<RowDataPacket[]>('SELECT user_id FROM bank_details WHERE id = ? LIMIT 1', [id]);
        const userId = rows && rows[0] ? rows[0].user_id : null;
        if (!userId) throw new Error('Bank details not found');
        await conn.query('UPDATE bank_details SET is_default = 0 WHERE user_id = ? AND id != ?', [userId, id]);
      }

      // Whitelist columns allowed to update
      const allowed: Array<keyof CreateBankDetailsInput | 'is_default'> = [
        'payment_method', 'account_name', 'account_number', 'routing_number', 'bank_name',
        'paypal_email', 'stripe_account_id', 'crypto_wallet_address', 'crypto_currency',
        'check_payable_to', 'is_default'
      ];

      const setParts: string[] = [];
      const values: any[] = [];

      (Object.keys(updates) as Array<string>).forEach((key) => {
        if (!allowed.includes(key as any)) return;
        const val = (updates as any)[key];
        if (key === 'is_default') {
          setParts.push('is_default = ?');
          values.push(val ? 1 : 0);
        } else {
          setParts.push(`${key} = ?`);
          values.push(val ?? null);
        }
      });

      if (setParts.length === 0) {
        // nothing to update, just return current record
        const current = await this.getById(id);
        if (!current) throw new Error('Bank details not found');
        return current;
      }

      // append updated_at
      setParts.push('updated_at = NOW()');

      const sql = `UPDATE bank_details SET ${setParts.join(', ')} WHERE id = ?`;
      await conn.query(sql, [...values, id]);

      // fetch updated row
      const [rowsAfter] = await conn.query<DBRow[] & RowDataPacket[]>('SELECT * FROM bank_details WHERE id = ? LIMIT 1', [id]);
      const row = rowsAfter && rowsAfter[0];
      if (!row) throw new Error('Failed to fetch updated bank details');

      await conn.commit();
      return this.mapRowToBankDetails(row);
    } catch (err) {
      try { await conn.rollback(); } catch (_) { /* ignore */ }
      throw err;
    } finally {
      conn.release();
    }
  }

  static async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM bank_details WHERE id = ?', [id]);
  }

  /**
   * Set a bank details record as default. Unsets other defaults for the same user inside a transaction.
   */
  static async setDefault(id: string): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query<RowDataPacket[]>('SELECT user_id FROM bank_details WHERE id = ? LIMIT 1', [id]);
      if (!rows || rows.length === 0) throw new Error('Bank details not found');

      const userId = rows[0].user_id;
      await conn.query('UPDATE bank_details SET is_default = 0 WHERE user_id = ?', [userId]);
      await conn.query('UPDATE bank_details SET is_default = 1, updated_at = NOW() WHERE id = ?', [id]);

      await conn.commit();
    } catch (err) {
      try { await conn.rollback(); } catch (_) { /* ignore */ }
      throw err;
    } finally {
      conn.release();
    }
  }

  private static mapRowToBankDetails(row: DBRow): BankDetails {
    return {
      id: String(row.id),
      user_id: String(row.user_id),
      payment_method: String(row.payment_method) as BankDetails['payment_method'],
      account_name: String(row.account_name),
      account_number: row.account_number ?? null,
      routing_number: row.routing_number ?? null,
      bank_name: row.bank_name ?? null,
      paypal_email: row.paypal_email ?? null,
      stripe_account_id: row.stripe_account_id ?? null,
      crypto_wallet_address: row.crypto_wallet_address ?? null,
      crypto_currency: row.crypto_currency ?? null,
      check_payable_to: row.check_payable_to ?? null,
      is_default: !!Number(row.is_default),
      is_verified: !!Number(row.is_verified),
      created_at: row.created_at ? new Date(row.created_at as any) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at as any) : new Date()
    };
  }
}
