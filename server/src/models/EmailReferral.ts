import { pool } from '../database/init';

export interface EmailReferral {
  id: string;
  affiliate_id: string;
  email: string;
  name?: string;
  status: 'invited' | 'confirmed' | 'converted' | 'expired';
  invited_at: string;
  confirmed_at?: string;
  converted_at?: string;
  expires_at: string;
  conversion_value?: number;
  created_at: string;
  updated_at: string;
}

export class EmailReferralModel {
  static async getByAffiliateId(affiliateId: string, limit: number = 50): Promise<EmailReferral[]> {
    const { rows } = await pool.query(
      `SELECT id, affiliate_id, email, 
              CASE 
                WHEN status = 'sent' THEN 'invited'
                WHEN status = 'opened' THEN 'confirmed'
                WHEN status = 'clicked' THEN 'confirmed'
                WHEN status = 'converted' THEN 'converted'
                ELSE 'invited'
              END as status,
              sent_at as invited_at,
              clicked_at as confirmed_at,
              converted_at,
              (sent_at + INTERVAL '30 days') as expires_at,
              NULL as conversion_value,
              created_at,
              created_at as updated_at
       FROM email_invites 
       WHERE affiliate_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [affiliateId, limit]
    );
    return rows;
  }

  static async getStats(affiliateId: string): Promise<{
    total: number;
    invited: number;
    confirmed: number;
    converted: number;
    expired: number;
    totalConversionValue: number;
  }> {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as invited,
        COUNT(CASE WHEN status IN ('opened', 'clicked') THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
        COUNT(CASE WHEN sent_at < NOW() - INTERVAL '30 days' THEN 1 END) as expired,
        0 as total_conversion_value
       FROM email_invites 
       WHERE affiliate_id = $1`,
      [affiliateId]
    );
    
    return {
      total: parseInt(rows[0].total),
      invited: parseInt(rows[0].invited),
      confirmed: parseInt(rows[0].confirmed),
      converted: parseInt(rows[0].converted),
      expired: parseInt(rows[0].expired),
      totalConversionValue: 0 // No conversion value in email_invites table
    };
  }

  static async create(data: {
    affiliate_id: string;
    email: string;
    name?: string;
    expires_at: string;
  }): Promise<EmailReferral> {
    const { rows } = await pool.query(
      `INSERT INTO email_referrals (affiliate_id, email, name, status, invited_at, expires_at)
       VALUES ($1, $2, $3, 'invited', CURRENT_TIMESTAMP, $4)
       RETURNING *`,
      [data.affiliate_id, data.email, data.name, data.expires_at]
    );
    return rows[0];
  }

  static async updateStatus(id: string, status: EmailReferral['status'], conversionValue?: number): Promise<void> {
    const updateFields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    const values = [id, status];
    
    if (status === 'confirmed') {
      updateFields.push('confirmed_at = CURRENT_TIMESTAMP');
    } else if (status === 'converted') {
      updateFields.push('converted_at = CURRENT_TIMESTAMP');
      if (conversionValue) {
        updateFields.push('conversion_value = $3');
        values.push(conversionValue);
      }
    }
    
    await pool.query(
      `UPDATE email_referrals SET ${updateFields.join(', ')} WHERE id = $1`,
      values
    );
  }
}
