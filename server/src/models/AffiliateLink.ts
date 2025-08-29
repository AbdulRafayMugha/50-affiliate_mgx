import { pool } from '../database/init';
import { v4 as uuidv4 } from 'uuid';

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

export class AffiliateLinkModel {
  static async create(affiliateId: string, customCode?: string): Promise<AffiliateLink> {
    const client = await pool.connect();
    
    try {
      // Generate unique link code if not provided
      let link_code = customCode;
      if (!link_code) {
        let isUnique = false;
        while (!isUnique) {
          link_code = this.generateLinkCode();
          const { rows } = await client.query(
            'SELECT id FROM affiliate_links WHERE link_code = $1',
            [link_code]
          );
          isUnique = rows.length === 0;
        }
      }
      
      const { rows } = await client.query(
        `INSERT INTO affiliate_links (affiliate_id, link_code)
         VALUES ($1, $2)
         RETURNING *`,
        [affiliateId, link_code]
      );
      
      return rows[0];
    } finally {
      client.release();
    }
  }
  
  static async getByAffiliateId(affiliateId: string): Promise<AffiliateLink[]> {
    const { rows } = await pool.query(
      'SELECT * FROM affiliate_links WHERE affiliate_id = $1 ORDER BY created_at DESC',
      [affiliateId]
    );
    
    return rows;
  }
  
  static async getByLinkCode(linkCode: string): Promise<AffiliateLink | null> {
    const { rows } = await pool.query(
      'SELECT * FROM affiliate_links WHERE link_code = $1 AND is_active = true',
      [linkCode]
    );
    
    return rows[0] || null;
  }
  
  static async recordClick(linkCode: string): Promise<void> {
    await pool.query(
      'UPDATE affiliate_links SET clicks = clicks + 1, updated_at = CURRENT_TIMESTAMP WHERE link_code = $1',
      [linkCode]
    );
  }
  
  static async getStats(affiliateId: string): Promise<{
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    activeLinks: number;
  }> {
    const { rows } = await pool.query(
      `SELECT 
         COALESCE(SUM(clicks), 0) as total_clicks,
         COALESCE(SUM(conversions), 0) as total_conversions,
         COUNT(*) FILTER (WHERE is_active = true) as active_links
       FROM affiliate_links 
       WHERE affiliate_id = $1`,
      [affiliateId]
    );
    
    const totalClicks = parseInt(rows[0].total_clicks || '0');
    const totalConversions = parseInt(rows[0].total_conversions || '0');
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    
    return {
      totalClicks,
      totalConversions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      activeLinks: parseInt(rows[0].active_links || '0')
    };
  }
  
  static async toggleStatus(linkId: string, isActive: boolean): Promise<void> {
    await pool.query(
      'UPDATE affiliate_links SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [isActive, linkId]
    );
  }
  
  private static generateLinkCode(): string {
    return uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
  }
  
  static generateReferralUrl(linkCode: string, baseUrl: string = process.env.FRONTEND_URL || 'http://localhost:5173'): string {
    return `${baseUrl}?ref=${linkCode}`;
  }
}