import { pool } from '../database/init';

export interface EmailInvite {
  id: string;
  affiliate_id: string;
  email: string;
  message?: string;
  status: 'sent' | 'opened' | 'clicked' | 'converted';
  sent_at: Date;
  clicked_at?: Date;
  converted_at?: Date;
  created_at: Date;
}

export class EmailInviteModel {
  static async create(affiliateId: string, email: string, message?: string): Promise<EmailInvite> {
    const { rows } = await pool.query(
      `INSERT INTO email_invites (affiliate_id, email, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [affiliateId, email, message]
    );
    
    return rows[0];
  }
  
  static async getByAffiliateId(affiliateId: string, limit: number = 50): Promise<EmailInvite[]> {
    const { rows } = await pool.query(
      `SELECT * FROM email_invites 
       WHERE affiliate_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [affiliateId, limit]
    );
    
    return rows;
  }
  
  static async updateStatus(inviteId: string, status: EmailInvite['status']): Promise<void> {
    let updateField = '';
    
    switch (status) {
      case 'clicked':
        updateField = ', clicked_at = CURRENT_TIMESTAMP';
        break;
      case 'converted':
        updateField = ', converted_at = CURRENT_TIMESTAMP';
        break;
    }
    
    await pool.query(
      `UPDATE email_invites 
       SET status = $1${updateField}
       WHERE id = $2`,
      [status, inviteId]
    );
  }
  
  static async getStats(affiliateId: string): Promise<{
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalConverted: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }> {
    const { rows } = await pool.query(
      `SELECT 
         COUNT(*) as total_sent,
         COUNT(*) FILTER (WHERE status IN ('opened', 'clicked', 'converted')) as total_opened,
         COUNT(*) FILTER (WHERE status IN ('clicked', 'converted')) as total_clicked,
         COUNT(*) FILTER (WHERE status = 'converted') as total_converted
       FROM email_invites 
       WHERE affiliate_id = $1`,
      [affiliateId]
    );
    
    const totalSent = parseInt(rows[0].total_sent || '0');
    const totalOpened = parseInt(rows[0].total_opened || '0');
    const totalClicked = parseInt(rows[0].total_clicked || '0');
    const totalConverted = parseInt(rows[0].total_converted || '0');
    
    return {
      totalSent,
      totalOpened,
      totalClicked,
      totalConverted,
      openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100 * 100) / 100 : 0,
      clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100 * 100) / 100 : 0,
      conversionRate: totalSent > 0 ? Math.round((totalConverted / totalSent) * 100 * 100) / 100 : 0
    };
  }
}