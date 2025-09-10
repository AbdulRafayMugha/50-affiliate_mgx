import { pool } from '../database/init';

export interface EmailInvite {
  id: string;
  affiliate_id: string;
  email: string;
  name?: string;
  phone_number?: string;
  status: 'invited' | 'confirmed' | 'converted' | 'expired';
  invited_at: Date;
  confirmed_at?: Date;
  converted_at?: Date;
  expires_at: Date;
  conversion_value?: number;
  created_at: Date;
  updated_at: Date;
}

export class EmailInviteModel {
  static async create(affiliateId: string, email: string, name?: string, phoneNumber?: string): Promise<EmailInvite> {
    try {
      // Set expiration date to 30 days from now
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      // Handle empty string names and phone numbers
      const cleanName = name && name.trim() ? name.trim() : null;
      const cleanPhoneNumber = phoneNumber && phoneNumber.trim() ? phoneNumber.trim() : null;
      
      const { rows } = await pool.query(`
        INSERT INTO email_referrals (affiliate_id, email, name, phone_number, invited_at, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [affiliateId, email, cleanName, cleanPhoneNumber, now.toISOString(), expiresAt.toISOString(), now.toISOString(), now.toISOString()]);
      
      const createdRecord = rows[0];
      
      if (!createdRecord) {
        throw new Error('Failed to create email referral');
      }
      
      return createdRecord;
    } catch (error) {
      console.error('Error creating email referral:', error);
      throw error;
    }
  }
  
  static async getByAffiliateId(affiliateId: string, limit: number = 50): Promise<EmailInvite[]> {
    try {
      const { rows } = await pool.query(`
        SELECT * FROM email_referrals 
        WHERE affiliate_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [affiliateId, limit]);
      
      return rows;
    } catch (error) {
      console.error('Error getting email referrals:', error);
      return [];
    }
  }
  
  static async updateStatus(inviteId: string, status: EmailInvite['status']): Promise<void> {
    try {
      let query = 'UPDATE email_referrals SET status = $1, updated_at = CURRENT_TIMESTAMP';
      let params = [status, inviteId];
      
      switch (status) {
        case 'confirmed':
          query += ', confirmed_at = CURRENT_TIMESTAMP WHERE id = $2';
          break;
        case 'converted':
          query += ', converted_at = CURRENT_TIMESTAMP WHERE id = $2';
          break;
        default:
          query += ' WHERE id = $2';
      }
      
      await pool.query(query, params);
    } catch (error) {
      console.error('Error updating email referral status:', error);
      throw error;
    }
  }
  
  static async getStats(affiliateId: string): Promise<{
    totalInvited: number;
    totalConfirmed: number;
    totalConverted: number;
    totalExpired: number;
    confirmationRate: number;
    conversionRate: number;
  }> {
    try {
      const { rows } = await pool.query(`
        SELECT 
          COUNT(*) as total_invited,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as total_confirmed,
          COUNT(CASE WHEN status = 'converted' THEN 1 END) as total_converted,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as total_expired
        FROM email_referrals 
        WHERE affiliate_id = $1
      `, [affiliateId]);
      
      const row = rows[0];
      
      const totalInvited = parseInt(row.total_invited || '0');
      const totalConfirmed = parseInt(row.total_confirmed || '0');
      const totalConverted = parseInt(row.total_converted || '0');
      const totalExpired = parseInt(row.total_expired || '0');
      
      return {
        totalInvited,
        totalConfirmed,
        totalConverted,
        totalExpired,
        confirmationRate: totalInvited > 0 ? Math.round((totalConfirmed / totalInvited) * 100 * 100) / 100 : 0,
        conversionRate: totalInvited > 0 ? Math.round((totalConverted / totalInvited) * 100 * 100) / 100 : 0
      };
    } catch (error) {
      console.error('Error getting email referral stats:', error);
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
}