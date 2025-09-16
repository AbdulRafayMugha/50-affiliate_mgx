// src/models/TransactionModel.ts
import { pool } from '../database/init';
import { RowDataPacket, ResultSetHeader  } from 'mysql2';

export interface Transaction {
  id: string;
  customer_email: string;
  amount: number;
  affiliate_link_id?: string | null;
  referrer_id?: string | null;
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

type DBRow = RowDataPacket & Record<string, any>;
type MainStatsRow = RowDataPacket & {
  total_revenue?: number | string;
  total_transactions?: number | string;
  total_commissions_paid?: number | string;
  pending_commissions?: number | string;
};

type AffCountsRow = RowDataPacket & {
  total_affiliates?: number | string;
  active_affiliates?: number | string;
};

type CountRow = RowDataPacket & {
  new_signups?: number | string;
};

type RevRow = RowDataPacket & {
  current_month_revenue?: number | string;
  last_month_revenue?: number | string;
};

type ConvRow = RowDataPacket & {
  conversion_rate?: number | string;
};

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  // sometimes mysql returns numeric columns as strings
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}


/**
 * Helper: normalize a DB row to the Transaction interface
 */
function mapTransactionRow(row: DBRow): Transaction {
  return {
    id: String(row.id),
    customer_email: String(row.customer_email),
    amount: Number(row.amount),
    affiliate_link_id: row.affiliate_link_id ?? null,
    referrer_id: row.referrer_id ?? null,
    status: String(row.status) as Transaction['status'],
    transaction_type: String(row.transaction_type) as Transaction['transaction_type'],
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
    updated_at: row.updated_at ? new Date(row.updated_at) : new Date()
  };
}

export class TransactionModel {
  /**
   * Create a transaction. If referral_code provided, link to affiliate link and create commissions.
   */
  static async create(input: CreateTransactionInput): Promise<Transaction> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let affiliate_link_id: string | null = null;
      let referrer_id: string | null = null;

      // find affiliate_link and referrer if referral_code provided
      if (input.referral_code) {
        const [rows] = await conn.query<RowDataPacket[]>(
          `SELECT al.id AS affiliate_link_id, al.affiliate_id AS referrer_id
           FROM affiliate_links al
           JOIN users u ON al.affiliate_id = u.id
           WHERE al.link_code = ? AND al.is_active = 1 AND u.is_active = 1
           LIMIT 1`,
          [input.referral_code]
        );

        if (rows && rows.length > 0) {
          affiliate_link_id = String(rows[0].affiliate_link_id);
          referrer_id = String(rows[0].referrer_id);

          // update affiliate link conversions
          await conn.query<ResultSetHeader >(
            `UPDATE affiliate_links SET conversions = COALESCE(conversions, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [affiliate_link_id]
          );
        }
      }

      // insert transaction
      const [ins] = await conn.query<ResultSetHeader >(
        `INSERT INTO transactions (customer_email, amount, affiliate_link_id, referrer_id, transaction_type, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'completed', NOW(), NOW())`,
        [
          input.customer_email,
          input.amount,
          affiliate_link_id,
          referrer_id,
          input.transaction_type ?? 'purchase'
        ]
      );

      // fetch inserted transaction by lastInsertId
      const insertId = (ins as ResultSetHeader ).insertId;
      const [txRows] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM transactions WHERE id = ? LIMIT 1`,
        [insertId]
      );

      if (!txRows || txRows.length === 0) {
        throw new Error('Failed to fetch inserted transaction');
      }

      const transaction = mapTransactionRow(txRows[0]);

      // create commissions (if there is a referrer)
      if (referrer_id) {
        await this.createCommissions(conn, transaction.id, referrer_id, input.amount);
      }

      await conn.commit();
      return transaction;
    } catch (err) {
      try { await conn.rollback(); } catch (_) { /* ignore */ }
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Insert commission rows for level1..level3 if referrers exist.
   * Expects an active connection inside a transaction.
   */
  private static async createCommissions(conn: any, transactionId: string, referrerId: string, amount: number) {
    // Commission rates from env (fallback to defaults)
    const level1Rate = parseFloat(process.env.LEVEL_1_COMMISSION ?? '15');
    const level2Rate = parseFloat(process.env.LEVEL_2_COMMISSION ?? '5');
    const level3Rate = parseFloat(process.env.LEVEL_3_COMMISSION ?? '2.5');

    // Level 1
    const level1Amount = +(amount * level1Rate / 100).toFixed(2);
    await conn.query(
      `INSERT INTO commissions (affiliate_id, transaction_id, level, amount, rate, status, created_at, updated_at)
       VALUES (?, ?, 1, ?, ?, 'approved', NOW(), NOW())`,
      [referrerId, transactionId, level1Amount, level1Rate]
    );

    // Level 2: find referrer of referrer
    const [lvl2Rows] = await conn.query(
      `SELECT referrer_id FROM users WHERE id = ? AND referrer_id IS NOT NULL LIMIT 1`,
      [referrerId]
    );

    if (lvl2Rows && lvl2Rows.length > 0 && lvl2Rows[0].referrer_id) {
      const level2ReferrerId = String(lvl2Rows[0].referrer_id);
      const level2Amount = +(amount * level2Rate / 100).toFixed(2);

      await conn.query(
        `INSERT INTO commissions (affiliate_id, transaction_id, level, amount, rate, status, created_at, updated_at)
         VALUES (?, ?, 2, ?, ?, 'approved', NOW(), NOW())`,
        [level2ReferrerId, transactionId, level2Amount, level2Rate]
      );

      // Level 3: referrer of level2
      const [lvl3Rows] = await conn.query(
        `SELECT referrer_id FROM users WHERE id = ? AND referrer_id IS NOT NULL LIMIT 1`,
        [level2ReferrerId]
      );

      if (lvl3Rows && lvl3Rows.length > 0 && lvl3Rows[0].referrer_id) {
        const level3ReferrerId = String(lvl3Rows[0].referrer_id);
        const level3Amount = +(amount * level3Rate / 100).toFixed(2);

        await conn.query(
          `INSERT INTO commissions (affiliate_id, transaction_id, level, amount, rate, status, created_at, updated_at)
           VALUES (?, ?, 3, ?, ?, 'approved', NOW(), NOW())`,
          [level3ReferrerId, transactionId, level3Amount, level3Rate]
        );
      }
    }
  }

  /**
   * Get transactions for an affiliate (transactions joined with commissions).
   */
  static async getByAffiliateId(affiliateId: string, limit: number = 20): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, c.amount AS commission_amount, c.level AS commission_level, c.status AS commission_status
       FROM transactions t
       JOIN commissions c ON t.id = c.transaction_id
       WHERE c.affiliate_id = ?
       ORDER BY t.created_at DESC
       LIMIT ?`,
      [affiliateId, limit]
    );

    // Map dates to JS Dates
    return (rows || []).map(r => {
      return {
        ...r,
        created_at: r.created_at ? new Date(r.created_at) : null,
        updated_at: r.updated_at ? new Date(r.updated_at) : null
      };
    });
  }

  /**
   * Get paginated transactions for admin (with affiliate info).
   */
  static async getAll(page: number = 1, limit: number = 20): Promise<{
    transactions: Transaction[];
    total: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const [transactionsRows] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, u.name AS affiliate_name, u.email AS affiliate_email
       FROM transactions t
       LEFT JOIN users u ON t.referrer_id = u.id
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM transactions`
    );

    const total = Number((countRows && countRows[0] && countRows[0].cnt) || 0);
    const transactions: Transaction[] = (transactionsRows || []).map(mapTransactionRow);

    return {
      transactions,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    };
  }

  /**
   * Compute aggregated stats for dashboard
   */
  static async getTotalStats(): Promise<{
  totalRevenue: number;
  totalTransactions: number;
  totalCommissionsPaid: number;
  pendingCommissions: number;
  totalAffiliates: number;
  activeAffiliates: number;
  conversionRate: number;
  revenueGrowth: number;
  newSignupsToday: number;
}> {
  // Main stats: total revenue, transaction count, commissions
  const [mainRows] = await pool.query<MainStatsRow[]>(
    `SELECT
       COALESCE(SUM(t.amount), 0) AS total_revenue,
       COUNT(DISTINCT t.id) AS total_transactions,
       COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END), 0) AS total_commissions_paid,
       COALESCE(SUM(CASE WHEN c.status IN ('pending','approved') THEN c.amount ELSE 0 END), 0) AS pending_commissions
     FROM transactions t
     LEFT JOIN commissions c ON t.id = c.transaction_id
     WHERE t.status = 'completed'`
  );
  const main = (mainRows && mainRows[0]) ? mainRows[0] : ({} as MainStatsRow);

  // Affiliates counts
  const [affCountsRows] = await pool.query<AffCountsRow[]>(
    `SELECT
       COUNT(*) AS total_affiliates,
       SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_affiliates
     FROM users
     WHERE role = 'affiliate'`
  );
  const affCounts = (affCountsRows && affCountsRows[0]) ? affCountsRows[0] : ({} as AffCountsRow);

  // new signups today
  const [newSignupRows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS new_signups
     FROM users
     WHERE role = 'affiliate' AND DATE(created_at) = CURDATE()`
  );
  const newSignups = (newSignupRows && newSignupRows[0]) ? newSignupRows[0] : ({} as CountRow);

  // revenue for growth: current month vs last month
  const [revRows] = await pool.query<RevRow[]>(
    `SELECT
       COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN amount ELSE 0 END), 0) AS current_month_revenue,
       COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN amount ELSE 0 END), 0) AS last_month_revenue
     FROM transactions
     WHERE status = 'completed'`
  );
  const rev = (revRows && revRows[0]) ? revRows[0] : ({} as RevRow);

  const currentMonthRevenue = toNumber(rev.current_month_revenue);
  const lastMonthRevenue = toNumber(rev.last_month_revenue);
  const growthRate = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  // conversion rate: completed transactions / total link clicks
  const [convRows] = await pool.query<ConvRow[]>(
    `SELECT
       CASE WHEN SUM(al.clicks) > 0 THEN (COUNT(DISTINCT t.id) / SUM(al.clicks)) * 100 ELSE 0 END AS conversion_rate
     FROM affiliate_links al
     LEFT JOIN transactions t ON t.affiliate_link_id = al.id AND t.status = 'completed'`
  );
  const conv = (convRows && convRows[0]) ? convRows[0] : ({} as ConvRow);
  const conversionRate = toNumber(conv.conversion_rate);

  return {
    totalRevenue: toNumber(main.total_revenue),
    totalTransactions: toNumber(main.total_transactions),
    totalCommissionsPaid: toNumber(main.total_commissions_paid),
    pendingCommissions: toNumber(main.pending_commissions),
    totalAffiliates: toNumber(affCounts.total_affiliates),
    activeAffiliates: toNumber(affCounts.active_affiliates),
    conversionRate,
    revenueGrowth: Number(growthRate.toFixed(2)),
    newSignupsToday: toNumber(newSignups.new_signups)
  };
}
}
