import { pool } from '../database/init';

export interface BankDetails {
  id: string;
  user_id: string;
  payment_method: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto' | 'check';
  account_name: string;
  account_number?: string;
  routing_number?: string;
  bank_name?: string;
  paypal_email?: string;
  stripe_account_id?: string;
  crypto_wallet_address?: string;
  crypto_currency?: string;
  check_payable_to?: string;
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

export class BankDetailsModel {
  static async create(input: CreateBankDetailsInput): Promise<BankDetails> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // If this is set as default, unset other defaults for this user
      if (input.is_default) {
        await client.query(
          'UPDATE bank_details SET is_default = FALSE WHERE user_id = $1',
          [input.user_id]
        );
      }
      
      const { rows } = await client.query(
        `INSERT INTO bank_details (
          user_id, payment_method, account_name, account_number, routing_number, 
          bank_name, paypal_email, stripe_account_id, crypto_wallet_address, 
          crypto_currency, check_payable_to, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          input.user_id, input.payment_method, input.account_name, input.account_number,
          input.routing_number, input.bank_name, input.paypal_email, input.stripe_account_id,
          input.crypto_wallet_address, input.crypto_currency, input.check_payable_to,
          input.is_default || false
        ]
      );
      
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async getByUserId(userId: string): Promise<BankDetails[]> {
    const { rows } = await pool.query(
      'SELECT * FROM bank_details WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    
    return rows;
  }
  
  static async getById(id: string): Promise<BankDetails | null> {
    const { rows } = await pool.query(
      'SELECT * FROM bank_details WHERE id = $1',
      [id]
    );
    
    return rows[0] || null;
  }
  
  static async update(id: string, updates: Partial<CreateBankDetailsInput>): Promise<BankDetails> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // If setting as default, unset other defaults for this user
      if (updates.is_default) {
        const { rows: current } = await client.query(
          'SELECT user_id FROM bank_details WHERE id = $1',
          [id]
        );
        if (current.length > 0) {
          await client.query(
            'UPDATE bank_details SET is_default = FALSE WHERE user_id = $1 AND id != $2',
            [current[0].user_id, id]
          );
        }
      }
      
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = Object.values(updates);
      
      const { rows } = await client.query(
        `UPDATE bank_details SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM bank_details WHERE id = $1', [id]);
  }
  
  static async setDefault(id: string): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get user_id for this bank detail
      const { rows } = await client.query(
        'SELECT user_id FROM bank_details WHERE id = $1',
        [id]
      );
      
      if (rows.length === 0) {
        throw new Error('Bank details not found');
      }
      
      // Unset all other defaults for this user
      await client.query(
        'UPDATE bank_details SET is_default = FALSE WHERE user_id = $1',
        [rows[0].user_id]
      );
      
      // Set this one as default
      await client.query(
        'UPDATE bank_details SET is_default = TRUE WHERE id = $1',
        [id]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
