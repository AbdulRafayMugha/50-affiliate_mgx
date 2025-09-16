// src/models/AffiliateLinkModel.ts
import { pool } from '../database/init';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

export interface AffiliateLink {
  id: string;
  affiliate_id: string;
  link_code: string;
  clicks: number;
  conversions: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

type DBRow = RowDataPacket & Partial<AffiliateLink>;

export class AffiliateLinkModel {
  static async create(affiliateId: string, customCode?: string): Promise<AffiliateLink> {
    const conn = await pool.getConnection();
    try {
      // Generate unique link code if not provided
      let link_code = customCode;
      if (!link_code) {
        let isUnique = false;
        while (!isUnique) {
          link_code = this.generateLinkCode();
          const [rows] = await conn.query<RowDataPacket[]>('SELECT id FROM affiliate_links WHERE link_code = ? LIMIT 1', [link_code]);
          isUnique = !(rows && rows.length > 0);
        }
      } else {
        // if custom code provided, ensure it is unique
        const [rows] = await conn.query<RowDataPacket[]>('SELECT id FROM affiliate_links WHERE link_code = ? LIMIT 1', [link_code]);
        if (rows && rows.length > 0) {
          throw new Error('Provided link code already exists');
        }
      }

      // Insert (id is NULL so DB trigger will generate UUID())
      await conn.query('INSERT INTO affiliate_links (id, affiliate_id, link_code, clicks, conversions, is_active, created_at, updated_at) VALUES (NULL, ?, ?, 0, 0, 1, NOW(), NOW())', [affiliateId, link_code]);

      // Fetch the inserted row
      const [selRows] = await conn.query<DBRow[]>('SELECT * FROM affiliate_links WHERE affiliate_id = ? AND link_code = ? ORDER BY created_at DESC LIMIT 1', [affiliateId, link_code]);
      const row = selRows && selRows[0];
      if (!row) throw new Error('Failed to create affiliate link');

      return this.mapRowToAffiliateLink(row);
    } finally {
      conn.release();
    }
  }

  static async getByAffiliateId(affiliateId: string): Promise<AffiliateLink[]> {
    const [rows] = await pool.query<DBRow[]>('SELECT * FROM affiliate_links WHERE affiliate_id = ? ORDER BY created_at DESC', [affiliateId]);

    return (rows || []).map(this.mapRowToAffiliateLink);
  }

  static async getByLinkCode(linkCode: string): Promise<AffiliateLink | null> {
    const [rows] = await pool.query<DBRow[]>('SELECT * FROM affiliate_links WHERE link_code = ? AND is_active = 1 LIMIT 1', [linkCode]);

    if (!rows || rows.length === 0) return null;
    return this.mapRowToAffiliateLink(rows[0]);
  }

  static async recordClick(linkCode: string): Promise<void> {
    await pool.query('UPDATE affiliate_links SET clicks = clicks + 1, updated_at = CURRENT_TIMESTAMP WHERE link_code = ?', [linkCode]);
  }

  static async getStats(affiliateId: string): Promise<{
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    activeLinks: number;
  }> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(clicks), 0) AS total_clicks,
         COALESCE(SUM(conversions), 0) AS total_conversions,
         COALESCE(SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END), 0) AS active_links
       FROM affiliate_links
       WHERE affiliate_id = ?`,
      [affiliateId]
    );

    const r = (rows && rows[0]) as any;
    const totalClicks = Number(r.total_clicks || 0);
    const totalConversions = Number(r.total_conversions || 0);
    const activeLinks = Number(r.active_links || 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      totalClicks,
      totalConversions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      activeLinks
    };
  }

  static async toggleStatus(linkId: string, isActive: boolean): Promise<void> {
    await pool.query('UPDATE affiliate_links SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [isActive ? 1 : 0, linkId]);
  }

  private static generateLinkCode(): string {
    return uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
  }

  static generateReferralUrl(linkCode: string, baseUrl: string = process.env.FRONTEND_URL || 'http://localhost:5173'): string {
    return `${baseUrl}?ref=${linkCode}`;
  }

  private static mapRowToAffiliateLink(row: DBRow): AffiliateLink {
    return {
      id: String(row.id),
      affiliate_id: String(row.affiliate_id),
      link_code: String(row.link_code),
      clicks: Number(row.clicks || 0),
      conversions: Number(row.conversions || 0),
      is_active: Boolean(Number(row.is_active) === 1),
      created_at: row.created_at ? new Date(row.created_at as any) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at as any) : new Date()
    };
  }
}
