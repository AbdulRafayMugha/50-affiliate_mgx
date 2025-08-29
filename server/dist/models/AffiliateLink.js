"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateLinkModel = void 0;
const init_1 = require("../database/init");
const uuid_1 = require("uuid");
class AffiliateLinkModel {
    static async create(affiliateId, customCode) {
        const client = await init_1.pool.connect();
        try {
            // Generate unique link code if not provided
            let link_code = customCode;
            if (!link_code) {
                let isUnique = false;
                while (!isUnique) {
                    link_code = this.generateLinkCode();
                    const { rows } = await client.query('SELECT id FROM affiliate_links WHERE link_code = $1', [link_code]);
                    isUnique = rows.length === 0;
                }
            }
            const { rows } = await client.query(`INSERT INTO affiliate_links (affiliate_id, link_code)
         VALUES ($1, $2)
         RETURNING *`, [affiliateId, link_code]);
            return rows[0];
        }
        finally {
            client.release();
        }
    }
    static async getByAffiliateId(affiliateId) {
        const { rows } = await init_1.pool.query('SELECT * FROM affiliate_links WHERE affiliate_id = $1 ORDER BY created_at DESC', [affiliateId]);
        return rows;
    }
    static async getByLinkCode(linkCode) {
        const { rows } = await init_1.pool.query('SELECT * FROM affiliate_links WHERE link_code = $1 AND is_active = true', [linkCode]);
        return rows[0] || null;
    }
    static async recordClick(linkCode) {
        await init_1.pool.query('UPDATE affiliate_links SET clicks = clicks + 1, updated_at = CURRENT_TIMESTAMP WHERE link_code = $1', [linkCode]);
    }
    static async getStats(affiliateId) {
        const { rows } = await init_1.pool.query(`SELECT 
         COALESCE(SUM(clicks), 0) as total_clicks,
         COALESCE(SUM(conversions), 0) as total_conversions,
         COUNT(*) FILTER (WHERE is_active = true) as active_links
       FROM affiliate_links 
       WHERE affiliate_id = $1`, [affiliateId]);
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
    static async toggleStatus(linkId, isActive) {
        await init_1.pool.query('UPDATE affiliate_links SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [isActive, linkId]);
    }
    static generateLinkCode() {
        return (0, uuid_1.v4)().replace(/-/g, '').substring(0, 12).toUpperCase();
    }
    static generateReferralUrl(linkCode, baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173') {
        return `${baseUrl}?ref=${linkCode}`;
    }
}
exports.AffiliateLinkModel = AffiliateLinkModel;
//# sourceMappingURL=AffiliateLink.js.map