// src/models/CommissionModel.ts
import { pool } from '../database/init';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface Commission {
  id: string;
  affiliate_id: string;
  transaction_id: string;
  level: 1 | 2 | 3;
  amount: number;
  rate: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paid_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * DB row typing convenience
 */
type CommissionRow = RowDataPacket & {
  id: string;
  affiliate_id: string;
  transaction_id: string;
  level: number;
  amount: string | number;
  rate: string | number;
  status: string;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  customer_email?: string;
  transaction_amount?: string | number;
  affiliate_name?: string;
  affiliate_email?: string;
  transaction_date?: string;
};

export class CommissionModel {
  /**
   * Get commission records for an affiliate (joined with transaction summary).
   */
  static async getByAffiliateId(affiliateId: string, limit: number = 50): Promise<any[]> {
    const sql = `
      SELECT c.*, t.customer_email, t.amount AS transaction_amount, t.created_at AS transaction_date
      FROM commissions c
      JOIN transactions t ON c.transaction_id = t.id
      WHERE c.affiliate_id = ?
      ORDER BY c.created_at DESC
      LIMIT ?
    `;
    const [rows] = await pool.query<CommissionRow[]>(sql, [affiliateId, limit]);
    return (rows || []).map(r => this.mapRow(r));
  }

  /**
   * Return earnings & breakdown statistics for an affiliate.
   */
  static async getStats(affiliateId: string): Promise<{
    totalEarnings: number;
    pendingEarnings: number;
    thisMonthEarnings: number;
    commissionsByLevel: { level1: number; level2: number; level3: number };
  }> {
    // MySQL equivalent for DATE_TRUNC month check
    const sql = `
      SELECT
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_earnings,
        COALESCE(SUM(CASE WHEN status IN ('pending','approved') THEN amount ELSE 0 END), 0) AS pending_earnings,
        COALESCE(SUM(CASE WHEN status = 'paid' AND MONTH(created_at) = MONTH(CURRENT_DATE) AND YEAR(created_at) = YEAR(CURRENT_DATE) THEN amount ELSE 0 END), 0) AS this_month_earnings,
        COALESCE(SUM(CASE WHEN level = 1 AND status = 'paid' THEN amount ELSE 0 END), 0) AS level1_earnings,
        COALESCE(SUM(CASE WHEN level = 2 AND status = 'paid' THEN amount ELSE 0 END), 0) AS level2_earnings,
        COALESCE(SUM(CASE WHEN level = 3 AND status = 'paid' THEN amount ELSE 0 END), 0) AS level3_earnings
      FROM commissions
      WHERE affiliate_id = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [affiliateId]);
    const r: any = (rows && rows[0]) || {};
    const parse = (v: any) => (v === null || v === undefined ? 0 : Number(v));
    return {
      totalEarnings: parse(r.total_earnings),
      pendingEarnings: parse(r.pending_earnings),
      thisMonthEarnings: parse(r.this_month_earnings),
      commissionsByLevel: {
        level1: parse(r.level1_earnings),
        level2: parse(r.level2_earnings),
        level3: parse(r.level3_earnings)
      }
    };
  }

  /**
   * Update a single commission's status.
   */
  static async updateStatus(commissionId: string, status: Commission['status']): Promise<void> {
    const paid_at_sql = status === 'paid' ? 'NOW()' : 'NULL';
    const sql = `
      UPDATE commissions
      SET status = ?, paid_at = ${paid_at_sql}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await pool.query<OkPacket>(sql, [status, commissionId]);
  }

  /**
   * Bulk update statuses for multiple commission ids (transactional).
   */
  static async bulkUpdateStatus(commissionIds: string[], status: Commission['status']): Promise<void> {
    if (!commissionIds || commissionIds.length === 0) return;

    // Build placeholders '?, ?, ?'
    const placeholders = commissionIds.map(() => '?').join(', ');
    const paid_at_sql = status === 'paid' ? 'NOW()' : 'NULL';
    const sql = `
      UPDATE commissions
      SET status = ?, paid_at = ${paid_at_sql}, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(sql, [status, ...commissionIds]);
      await conn.commit();
    } catch (err) {
      try { await conn.rollback(); } catch (_) { /* ignore */ }
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Get pending/approved commissions with pagination.
   */
  static async getAllPending(page: number = 1, limit: number = 20): Promise<{
    commissions: any[];
    total: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const sqlList = `
      SELECT c.*, u.name AS affiliate_name, u.email AS affiliate_email,
             t.customer_email, t.amount AS transaction_amount
      FROM commissions c
      JOIN users u ON c.affiliate_id = u.id
      JOIN transactions t ON c.transaction_id = t.id
      WHERE c.status IN ('pending', 'approved')
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const sqlCount = `SELECT COUNT(*) AS cnt FROM commissions WHERE status IN ('pending', 'approved')`;

    const [[listRows], [countRows]] = await Promise.all([
      pool.query<CommissionRow[]>(sqlList, [limit, offset]),
      pool.query<RowDataPacket[]>(sqlCount)
    ]);

    const total = Number((countRows && countRows[0] && (countRows[0] as any).cnt) || 0);
    return {
      commissions: (listRows || []).map(r => this.mapRow(r)),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get commissions for affiliates assigned to a coordinator (with pagination).
   */
  static async getCommissionsByCoordinator(coordinatorId: string, page: number = 1, limit: number = 20): Promise<{
    commissions: any[];
    total: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const sqlList = `
      SELECT c.*, u.name AS affiliate_name, u.email AS affiliate_email,
             t.customer_email, t.amount AS transaction_amount, t.created_at AS transaction_date
      FROM commissions c
      JOIN users u ON c.affiliate_id = u.id
      JOIN transactions t ON c.transaction_id = t.id
      WHERE u.coordinator_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const sqlCount = `
      SELECT COUNT(*) AS cnt
      FROM commissions c
      JOIN users u ON c.affiliate_id = u.id
      WHERE u.coordinator_id = ?
    `;

    const [[listRows], [countRows]] = await Promise.all([
      pool.query<CommissionRow[]>(sqlList, [coordinatorId, limit, offset]),
      pool.query<RowDataPacket[]>(sqlCount, [coordinatorId])
    ]);

    const total = Number((countRows && countRows[0] && (countRows[0] as any).cnt) || 0);
    return {
      commissions: (listRows || []).map(r => this.mapRow(r)),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Helper: normalize DB row to nicer object
   */
  private static mapRow(row: CommissionRow) {
    return {
      id: String(row.id),
      affiliate_id: String(row.affiliate_id),
      transaction_id: String(row.transaction_id),
      level: Number(row.level) as 1 | 2 | 3,
      amount: Number(row.amount || 0),
      rate: Number(row.rate || 0),
      status: String(row.status) as Commission['status'],
      paid_at: row.paid_at ? new Date(row.paid_at) : null,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
      // optional joined fields
      customer_email: row.customer_email ?? undefined,
      transaction_amount: row.transaction_amount ? Number(row.transaction_amount) : undefined,
      affiliate_name: (row as any).affiliate_name ?? undefined,
      affiliate_email: (row as any).affiliate_email ?? undefined,
      transaction_date: (row as any).transaction_date ? new Date((row as any).transaction_date) : undefined
    };
  }
}
