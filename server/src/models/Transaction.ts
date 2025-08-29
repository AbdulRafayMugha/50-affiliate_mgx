import { pool } from '../database/init';

export interface Transaction {
  id: string;
  customer_email: string;
  amount: number;
  affiliate_link_id?: string;
  referrer_id?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  transaction_type: 'purchase' | 'subscription' | 'upgrade';
  created_at: Date;
  updated_at: Date;
}

export interface CreateTransactionInput {
  customer_email: string;
  amount: number;
  referral_code?: string;
  transaction_type?: 'purchase' | 'subscription' | 'upgrade';
}

export class TransactionModel {
  static async create(input: CreateTransactionInput): Promise<Transaction> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let affiliate_link_id = null;
      let referrer_id = null;
      
      // Find affiliate link and referrer if referral code is provided
      if (input.referral_code) {
        const { rows } = await client.query(
          `SELECT al.id as affiliate_link_id, al.affiliate_id as referrer_id
           FROM affiliate_links al
           JOIN users u ON al.affiliate_id = u.id
           WHERE al.link_code = $1 AND al.is_active = true AND u.is_active = true`,
          [input.referral_code]
        );
        
        if (rows.length > 0) {
          affiliate_link_id = rows[0].affiliate_link_id;
          referrer_id = rows[0].referrer_id;
          
          // Update affiliate link stats
          await client.query(
            'UPDATE affiliate_links SET conversions = conversions + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [affiliate_link_id]
          );
        }
      }
      
      // Create transaction
      const { rows: transactionRows } = await client.query(
        `INSERT INTO transactions (customer_email, amount, affiliate_link_id, referrer_id, transaction_type, status)
         VALUES ($1, $2, $3, $4, $5, 'completed')
         RETURNING *`,
        [
          input.customer_email,
          input.amount,
          affiliate_link_id,
          referrer_id,
          input.transaction_type || 'purchase'
        ]
      );
      
      const transaction = transactionRows[0];
      
      // Create commissions if there's a referrer
      if (referrer_id) {
        await this.createCommissions(client, transaction.id, referrer_id, input.amount);
      }
      
      await client.query('COMMIT');
      
      return transaction;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  private static async createCommissions(client: any, transactionId: string, referrerId: string, amount: number) {
    // Commission rates from environment variables
    const level1Rate = parseFloat(process.env.LEVEL_1_COMMISSION || '15');
    const level2Rate = parseFloat(process.env.LEVEL_2_COMMISSION || '5');
    const level3Rate = parseFloat(process.env.LEVEL_3_COMMISSION || '2.5');
    
    // Level 1 Commission (Direct referrer)
    const level1Amount = (amount * level1Rate) / 100;
    await client.query(
      `INSERT INTO commissions (affiliate_id, transaction_id, level, amount, rate, status)
       VALUES ($1, $2, 1, $3, $4, 'approved')`,
      [referrerId, transactionId, level1Amount, level1Rate]
    );
    
    // Find Level 2 referrer
    const { rows: level2Rows } = await client.query(
      'SELECT referrer_id FROM users WHERE id = $1 AND referrer_id IS NOT NULL',
      [referrerId]
    );
    
    if (level2Rows.length > 0) {
      const level2ReferrerId = level2Rows[0].referrer_id;
      const level2Amount = (amount * level2Rate) / 100;
      
      await client.query(
        `INSERT INTO commissions (affiliate_id, transaction_id, level, amount, rate, status)
         VALUES ($1, $2, 2, $3, $4, 'approved')`,
        [level2ReferrerId, transactionId, level2Amount, level2Rate]
      );
      
      // Find Level 3 referrer
      const { rows: level3Rows } = await client.query(
        'SELECT referrer_id FROM users WHERE id = $1 AND referrer_id IS NOT NULL',
        [level2ReferrerId]
      );
      
      if (level3Rows.length > 0) {
        const level3ReferrerId = level3Rows[0].referrer_id;
        const level3Amount = (amount * level3Rate) / 100;
        
        await client.query(
          `INSERT INTO commissions (affiliate_id, transaction_id, level, amount, rate, status)
           VALUES ($1, $2, 3, $3, $4, 'approved')`,
          [level3ReferrerId, transactionId, level3Amount, level3Rate]
        );
      }
    }
  }
  
  static async getByAffiliateId(affiliateId: string, limit: number = 20): Promise<any[]> {
    const { rows } = await pool.query(
      `SELECT t.*, c.amount as commission_amount, c.level as commission_level, c.status as commission_status
       FROM transactions t
       JOIN commissions c ON t.id = c.transaction_id
       WHERE c.affiliate_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [affiliateId, limit]
    );
    
    return rows;
  }
  
  static async getAll(page: number = 1, limit: number = 20): Promise<{
    transactions: Transaction[];
    total: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    const [transactionsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT t.*, u.name as affiliate_name, u.email as affiliate_email
         FROM transactions t
         LEFT JOIN users u ON t.referrer_id = u.id
         ORDER BY t.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM transactions')
    ]);
    
    return {
      transactions: transactionsResult.rows,
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
  }
  
  static async getTotalStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCommissionsPaid: number;
    pendingCommissions: number;
  }> {
    const { rows } = await pool.query(`
      SELECT 
        COALESCE(SUM(t.amount), 0) as total_revenue,
        COUNT(t.id) as total_transactions,
        COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END), 0) as total_commissions_paid,
        COALESCE(SUM(CASE WHEN c.status IN ('pending', 'approved') THEN c.amount ELSE 0 END), 0) as pending_commissions
      FROM transactions t
      LEFT JOIN commissions c ON t.id = c.transaction_id
      WHERE t.status = 'completed'
    `);
    
    return {
      totalRevenue: parseFloat(rows[0].total_revenue || '0'),
      totalTransactions: parseInt(rows[0].total_transactions || '0'),
      totalCommissionsPaid: parseFloat(rows[0].total_commissions_paid || '0'),
      pendingCommissions: parseFloat(rows[0].pending_commissions || '0')
    };
  }
}