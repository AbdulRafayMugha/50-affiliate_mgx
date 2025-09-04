"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionModel = void 0;
const init_1 = require("../database/init");
class CommissionModel {
    static async getByAffiliateId(affiliateId, limit = 50) {
        const { rows } = await init_1.pool.query(`SELECT c.*, t.customer_email, t.amount as transaction_amount, t.created_at as transaction_date
       FROM commissions c
       JOIN transactions t ON c.transaction_id = t.id
       WHERE c.affiliate_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2`, [affiliateId, limit]);
        return rows;
    }
    static async getStats(affiliateId) {
        const { rows } = await init_1.pool.query(`SELECT 
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_earnings,
         COALESCE(SUM(CASE WHEN status IN ('pending', 'approved') THEN amount ELSE 0 END), 0) as pending_earnings,
         COALESCE(SUM(CASE WHEN status = 'paid' AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as this_month_earnings,
         COALESCE(SUM(CASE WHEN level = 1 AND status = 'paid' THEN amount ELSE 0 END), 0) as level1_earnings,
         COALESCE(SUM(CASE WHEN level = 2 AND status = 'paid' THEN amount ELSE 0 END), 0) as level2_earnings,
         COALESCE(SUM(CASE WHEN level = 3 AND status = 'paid' THEN amount ELSE 0 END), 0) as level3_earnings
       FROM commissions 
       WHERE affiliate_id = $1`, [affiliateId]);
        return {
            totalEarnings: parseFloat(rows[0].total_earnings || '0'),
            pendingEarnings: parseFloat(rows[0].pending_earnings || '0'),
            thisMonthEarnings: parseFloat(rows[0].this_month_earnings || '0'),
            commissionsByLevel: {
                level1: parseFloat(rows[0].level1_earnings || '0'),
                level2: parseFloat(rows[0].level2_earnings || '0'),
                level3: parseFloat(rows[0].level3_earnings || '0')
            }
        };
    }
    static async updateStatus(commissionId, status) {
        const paid_at = status === 'paid' ? 'CURRENT_TIMESTAMP' : 'NULL';
        await init_1.pool.query(`UPDATE commissions 
       SET status = $1, paid_at = ${paid_at}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`, [status, commissionId]);
    }
    static async bulkUpdateStatus(commissionIds, status) {
        const client = await init_1.pool.connect();
        try {
            await client.query('BEGIN');
            const paid_at = status === 'paid' ? 'CURRENT_TIMESTAMP' : 'NULL';
            await client.query(`UPDATE commissions 
         SET status = $1, paid_at = ${paid_at}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ANY($2)`, [status, commissionIds]);
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async getAllPending(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [commissionsResult, countResult] = await Promise.all([
            init_1.pool.query(`SELECT c.*, u.name as affiliate_name, u.email as affiliate_email, 
                t.customer_email, t.amount as transaction_amount
         FROM commissions c
         JOIN users u ON c.affiliate_id = u.id
         JOIN transactions t ON c.transaction_id = t.id
         WHERE c.status IN ('pending', 'approved')
         ORDER BY c.created_at DESC
         LIMIT $1 OFFSET $2`, [limit, offset]),
            init_1.pool.query(`SELECT COUNT(*) FROM commissions WHERE status IN ('pending', 'approved')`)
        ]);
        return {
            commissions: commissionsResult.rows,
            total: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        };
    }
    // Coordinator-specific methods
    static async getCommissionsByCoordinator(coordinatorId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [commissionsResult, countResult] = await Promise.all([
            init_1.pool.query(`SELECT c.*, u.name as affiliate_name, u.email as affiliate_email, 
                t.customer_email, t.amount as transaction_amount, t.created_at as transaction_date
         FROM commissions c
         JOIN users u ON c.affiliate_id = u.id
         JOIN transactions t ON c.transaction_id = t.id
         WHERE u.coordinator_id = $1
         ORDER BY c.created_at DESC
         LIMIT $2 OFFSET $3`, [coordinatorId, limit, offset]),
            init_1.pool.query(`SELECT COUNT(*) FROM commissions c
         JOIN users u ON c.affiliate_id = u.id
         WHERE u.coordinator_id = $1`, [coordinatorId])
        ]);
        return {
            commissions: commissionsResult.rows,
            total: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        };
    }
}
exports.CommissionModel = CommissionModel;
//# sourceMappingURL=Commission.js.map