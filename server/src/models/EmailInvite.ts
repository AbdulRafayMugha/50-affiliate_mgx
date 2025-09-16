// src/models/EmailInviteModel.ts
import { pool } from '../database/init';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface EmailInvite {
  id: string;
  affiliate_id: string;
  email: string;
  name?: string | null;
  phone_number?: string | null;
  status: 'invited' | 'confirmed' | 'converted' | 'expired';
  invited_at: Date;
  confirmed_at?: Date | null;
  converted_at?: Date | null;
  expires_at: Date;
  conversion_value?: number | null;
  created_at: Date;
  updated_at: Date;
}

type DBRow = RowDataPacket & Partial<Record<keyof EmailInvite, any>>;

export class EmailInviteModel {
  /**
   * Create an email invite (referral). Returns the created row as EmailInvite.
   */
  static async create(affiliateId: string, email: string, name?: string, phoneNumber?: string): Promise<EmailInvite> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const cleanName = name && name.trim() ? name.trim() : null;
      const cleanPhoneNumber = phoneNumber && phoneNumber.trim() ? phoneNumber.trim() : null;

      await conn.query<OkPacket>(
        `INSERT INTO email_referrals
          (id, affiliate_id, email, name, phone_number, status, invited_at, expires_at, created_at, updated_at)
         VALUES
          (NULL, ?, ?, ?, ?, 'sent', ?, ?, NOW(), NOW())`,
        [affiliateId, email, cleanName, cleanPhoneNumber, now, expiresAt]
      );

      // Fetch the inserted row (by affiliate, email, most recent)
      const [rows] = await conn.query<DBRow[]>(
        `SELECT * FROM email_referrals
         WHERE affiliate_id = ? AND email = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [affiliateId, email]
      );

      await conn.commit();

      const row = rows && rows[0];
      if (!row) throw new Error('Failed to fetch created email referral');

      return this.mapRow(row);
    } catch (err) {
      try { await conn.rollback(); } catch (_) { /* ignore */ }
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Get invites for an affiliate with optional limit.
   */
  static async getByAffiliateId(affiliateId: string, limit: number = 50): Promise<EmailInvite[]> {
    try {
      const [rows] = await pool.query<DBRow[]>(
        `SELECT * FROM email_referrals
         WHERE affiliate_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [affiliateId, limit]
      );
      return (rows || []).map(this.mapRow);
    } catch (err) {
      console.error('Error getting email referrals:', err);
      return [];
    }
  }

  /**
   * Update invite status. If 'confirmed' or 'converted' set the corresponding timestamp to NOW().
   */
  static async updateStatus(inviteId: string, status: EmailInvite['status']): Promise<void> {
    try {
      let sql = 'UPDATE email_referrals SET status = ?, updated_at = NOW()';
      const params: any[] = [status];

      if (status === 'confirmed') {
        sql += ', confirmed_at = NOW()';
      } else if (status === 'converted') {
        sql += ', converted_at = NOW()';
      }

      sql += ' WHERE id = ?';
      params.push(inviteId);

      await pool.query<OkPacket>(sql, params);
    } catch (err) {
      console.error('Error updating email referral status:', err);
      throw err;
    }
  }

  /**
   * Get simple invite statistics for an affiliate.
   */
  static async getStats(affiliateId: string): Promise<{
    totalInvited: number;
    totalConfirmed: number;
    totalConverted: number;
    totalExpired: number;
    confirmationRate: number;
    conversionRate: number;
  }> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
           COUNT(*) AS total_invited,
           SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS total_confirmed,
           SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) AS total_converted,
           SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS total_expired
         FROM email_referrals
         WHERE affiliate_id = ?`,
        [affiliateId]
      );

      const r: any = (rows && rows[0]) || {};
      const totalInvited = Number(r.total_invited || 0);
      const totalConfirmed = Number(r.total_confirmed || 0);
      const totalConverted = Number(r.total_converted || 0);
      const totalExpired = Number(r.total_expired || 0);

      return {
        totalInvited,
        totalConfirmed,
        totalConverted,
        totalExpired,
        confirmationRate: totalInvited > 0 ? Math.round((totalConfirmed / totalInvited) * 10000) / 100 : 0,
        conversionRate: totalInvited > 0 ? Math.round((totalConverted / totalInvited) * 10000) / 100 : 0
      };
    } catch (err) {
      console.error('Error getting email referral stats:', err);
      return {
        totalInvited: 0,
        totalConfirmed: 0,
        totalConverted: 0,
        totalExpired: 0,
        confirmationRate: 0,
        conversionRate: 0
      };
    }
  }

  /**
   * Map DB row to EmailInvite object and normalize fields.
   */
  private static mapRow(row: DBRow): EmailInvite {
    return {
      id: String(row.id),
      affiliate_id: String(row.affiliate_id),
      email: String(row.email),
      name: row.name ?? null,
      phone_number: row.phone_number ?? null,
      status: String(row.status) as EmailInvite['status'],
      invited_at: row.invited_at ? new Date(row.invited_at as any) : new Date(),
      confirmed_at: row.confirmed_at ? new Date(row.confirmed_at as any) : null,
      converted_at: row.converted_at ? new Date(row.converted_at as any) : null,
      expires_at: row.expires_at ? new Date(row.expires_at as any) : new Date(),
      conversion_value: row.conversion_value !== undefined && row.conversion_value !== null ? Number(row.conversion_value) : null,
      created_at: row.created_at ? new Date(row.created_at as any) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at as any) : new Date()
    };
  }
}
