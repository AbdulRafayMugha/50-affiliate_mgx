"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailInviteModel = void 0;
const init_1 = require("../database/init");
class EmailInviteModel {
    static async create(affiliateId, email, name) {
        try {
            // Set expiration date to 30 days from now
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            const { rows } = await init_1.pool.query(`
        INSERT INTO email_referrals (affiliate_id, email, name, invited_at, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [affiliateId, email, name, now.toISOString(), expiresAt.toISOString(), now.toISOString(), now.toISOString()]);
            const createdRecord = rows[0];
            if (!createdRecord) {
                throw new Error('Failed to create email referral');
            }
            return createdRecord;
        }
        catch (error) {
            console.error('Error creating email referral:', error);
            throw error;
        }
    }
    static async getByAffiliateId(affiliateId, limit = 50) {
        try {
            const { rows } = await init_1.pool.query(`
        SELECT * FROM email_referrals 
        WHERE affiliate_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [affiliateId, limit]);
            return rows;
        }
        catch (error) {
            console.error('Error getting email referrals:', error);
            return [];
        }
    }
    static async updateStatus(inviteId, status) {
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
            await init_1.pool.query(query, params);
        }
        catch (error) {
            console.error('Error updating email referral status:', error);
            throw error;
        }
    }
    static async getStats(affiliateId) {
        try {
            const { rows } = await init_1.pool.query(`
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
        }
        catch (error) {
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
exports.EmailInviteModel = EmailInviteModel;
//# sourceMappingURL=EmailInvite.js.map