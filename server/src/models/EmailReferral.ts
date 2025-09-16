// src/models/EmailReferralModel.ts
import { pool } from '../database/init';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface EmailReferral {
  id: string;
  affiliate_id: string;
  email: string;
  name?: string | null;
  status: 'invited' | 'confirmed' | 'converted' | 'expired';
  invited_at: string;
  confirmed_at?: string | null;
  converted_at?: string | null;
  expires_at: string;
  conversion_value?: number | null;
  created_at: string;
  updated_at: string;
}

type DBRow = RowDataPacket & Partial<Record<keyof EmailReferral, any>>;

export class EmailReferralModel {
  /**
   * Get high-level stats for an affiliate's referrals.
   */
  static async getStats(affiliateId: string): Promise<{
    total: number;
    invited: number;
    confirmed: number;
    converted: number;
    expired: number;
    totalConversionValue: number;
  }> {
    const sql = `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'invited' THEN 1 ELSE 0 END) AS invited,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) AS converted,
        SUM(CASE WHEN expires_at < (NOW() - INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS expired,
        COALESCE(SUM(CASE WHEN conversion_value IS NOT NULL THEN conversion_value ELSE 0 END), 0) AS total_conversion_value
      FROM email_referrals
      WHERE affiliate_id = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [affiliateId]);
    const r: any = (rows && rows[0]) || {};

    return {
      total: Number(r.total || 0),
      invited: Number(r.invited || 0),
      confirmed: Number(r.confirmed || 0),
      converted: Number(r.converted || 0),
      expired: Number(r.expired || 0),
      totalConversionValue: Number(r.total_conversion_value || 0)
    };
  }

  /**
   * Create an email referral record and return it.
   */
  static async create(data: {
    affiliate_id: string;
    email: string;
    name?: string;
    message?: string;
    expires_at: string; // ISO string or MySQL compatible datetime
  }): Promise<EmailReferral> {
    // insert then select inserted row
    const insertSql = `
      INSERT INTO email_referrals (affiliate_id, email, name, status, invited_at, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, 'invited', NOW(), ?, NOW(), NOW())
    `;
    const [insertResult] = await pool.query<OkPacket>(insertSql, [
      data.affiliate_id,
      data.email,
      data.name ?? null,
      data.expires_at
    ]);

    // Try to fetch inserted row by affiliate+email most recent
    const [selRows] = await pool.query<DBRow[]>(
      `SELECT id, affiliate_id, email, name, status, invited_at, confirmed_at, converted_at, expires_at, conversion_value, created_at, updated_at
       FROM email_referrals
       WHERE affiliate_id = ? AND email = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [data.affiliate_id, data.email]
    );

    const row = selRows && selRows[0];
    if (!row) throw new Error('Failed to create email_referral');

    return this.mapRow(row);
  }

  /**
   * Update status (and optionally conversion value) of a referral.
   */
  static async updateStatus(id: string, status: EmailReferral['status'], conversionValue?: number): Promise<void> {
    const parts: string[] = [];
    const params: any[] = [];

    parts.push('status = ?');
    params.push(status);

    if (status === 'confirmed') {
      parts.push('confirmed_at = NOW()');
    } else if (status === 'converted') {
      parts.push('converted_at = NOW()');
      if (conversionValue !== undefined) {
        parts.push('conversion_value = ?');
        params.push(conversionValue);
      }
    }

    parts.push('updated_at = NOW()');

    const sql = `UPDATE email_referrals SET ${parts.join(', ')} WHERE id = ?`;
    params.push(id);

    await pool.query<OkPacket>(sql, params);
  }

  /**
   * Paginated fetch of referrals for an affiliate.
   */
  static async getByAffiliateId(affiliateId: string, page: number = 1, limit: number = 20): Promise<{
    referrals: EmailReferral[];
    total: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const listSql = `
      SELECT id, affiliate_id, email, name, status, invited_at, confirmed_at, converted_at, expires_at, conversion_value, created_at, updated_at
      FROM email_referrals
      WHERE affiliate_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `SELECT COUNT(*) AS cnt FROM email_referrals WHERE affiliate_id = ?`;

    const [[listRows], [countRows]] = await Promise.all([
      pool.query<DBRow[]>(listSql, [affiliateId, limit, offset]),
      pool.query<RowDataPacket[]>(countSql, [affiliateId])
    ]);

    const referrals = (listRows || []).map(r => this.mapRow(r as DBRow));
    const total = Number((countRows && countRows[0] && (countRows[0] as any).cnt) || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { referrals, total, totalPages };
  }

  /**
   * Helper: normalize DB row into EmailReferral
   */
  private static mapRow(row: DBRow): EmailReferral {
    return {
      id: String(row.id),
      affiliate_id: String(row.affiliate_id),
      email: String(row.email),
      name: row.name ?? null,
      status: String(row.status) as EmailReferral['status'],
      invited_at: row.invited_at ? new Date(row.invited_at as any).toISOString() : new Date().toISOString(),
      confirmed_at: row.confirmed_at ? new Date(row.confirmed_at as any).toISOString() : null,
      converted_at: row.converted_at ? new Date(row.converted_at as any).toISOString() : null,
      expires_at: row.expires_at ? new Date(row.expires_at as any).toISOString() : new Date().toISOString(),
      conversion_value: row.conversion_value !== undefined && row.conversion_value !== null ? Number(row.conversion_value) : null,
      created_at: row.created_at ? new Date(row.created_at as any).toISOString() : new Date().toISOString(),
      updated_at: row.updated_at ? new Date(row.updated_at as any).toISOString() : new Date().toISOString()
    };
  }
}
