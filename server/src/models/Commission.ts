import { pool } from '../database/init';

export interface Commission {
  id: string;
  affiliate_id: string;
  transaction_id: string;
  level: 1 | 2 | 3;
  amount: number;
  rate: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class CommissionModel {
  static async getByAffiliateId(affiliateId: string, limit: number = 50): Promise<any[]> {
    const { rows } = await pool.query(
      `SELECT c.*, t.customer_email, t.amount as transaction_amount, t.created_at as transaction_date
       FROM commissions c
       JOIN transactions t ON c.transaction_id = t.id
       WHERE c.affiliate_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2`,
      [affiliateId, limit]
    );
    
    return rows;
  }
  
  static async getStats(affiliateId: string): Promise<{
    totalEarnings: number;
    pendingEarnings: number;
    thisMonthEarnings: number;
    commissionsByLevel: { level1: number; level2: number; level3: number };
  }> {
    const { rows } = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_earnings,
         COALESCE(SUM(CASE WHEN status IN ('pending', 'approved') THEN amount ELSE 0 END), 0) as pending_earnings,
         COALESCE(SUM(CASE WHEN status = 'paid' AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as this_month_earnings,
         COALESCE(SUM(CASE WHEN level = 1 AND status = 'paid' THEN amount ELSE 0 END), 0) as level1_earnings,
         COALESCE(SUM(CASE WHEN level = 2 AND status = 'paid' THEN amount ELSE 0 END), 0) as level2_earnings,
         COALESCE(SUM(CASE WHEN level = 3 AND status = 'paid' THEN amount ELSE 0 END), 0) as level3_earnings
       FROM commissions 
       WHERE affiliate_id = $1`,
      [affiliateId]
    );
    
    return {
      totalEarnings: parseFloat(rows[0].total_earnings || '0'),
      pendingEarnings: parseFloat(rows[0].pending_earnings || '0'),
      thisMonthEarnings: parseFloat(rows[0].this_month_earnings || '0'),
      commissionsByLevel: {
        level1: parseFloat(rows[0].level1_earnings || '0'),
        level2: parseFloat(rows[0].level2_earnings || '0'),
        level3: parseFloat(rows[0].level3_earnings || '0')
      }
    };
  }
  
  static async updateStatus(commissionId: string, status: Commission['status']): Promise<void> {
    const paid_at = status === 'paid' ? 'CURRENT_TIMESTAMP' : 'NULL';
    
    await pool.query(
      `UPDATE commissions 
       SET status = $1, paid_at = ${paid_at}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [status, commissionId]
    );
  }
  
  static async bulkUpdateStatus(commissionIds: string[], status: Commission['status']): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const paid_at = status === 'paid' ? 'CURRENT_TIMESTAMP' : 'NULL';
      
      await client.query(
        `UPDATE commissions 
         SET status = $1, paid_at = ${paid_at}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ANY($2)`,
        [status, commissionIds]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async getAllPending(page: number = 1, limit: number = 20): Promise<{
    commissions: any[];
    total: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    const [commissionsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT c.*, u.name as affiliate_name, u.email as affiliate_email, 
                t.customer_email, t.amount as transaction_amount
         FROM commissions c
         JOIN users u ON c.affiliate_id = u.id
         JOIN transactions t ON c.transaction_id = t.id
         WHERE c.status IN ('pending', 'approved')
         ORDER BY c.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM commissions WHERE status IN ('pending', 'approved')`)
    ]);
    
    return {
      commissions: commissionsResult.rows,
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
  }
}