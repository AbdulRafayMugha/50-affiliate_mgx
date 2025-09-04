"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const tslib_1 = require("tslib");
const init_1 = require("../database/init");
const bcryptjs_1 = tslib_1.__importDefault(require("bcryptjs"));
class UserModel {
    static async getTopAffiliates(limit = 5) {
        const { rows } = await init_1.pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.referral_code,
        u.tier,
        u.is_active,
        COALESCE(
          (SELECT SUM(c.amount::numeric)
           FROM commissions c 
           WHERE c.affiliate_id = u.id), 
          0
        ) as total_earnings,
        COALESCE(
          (SELECT SUM(c.amount::numeric)
           FROM commissions c 
           WHERE c.affiliate_id = u.id 
           AND c.status IN ('pending', 'approved')), 
          0
        ) as pending_earnings,
        COALESCE(
          (SELECT COUNT(DISTINCT t.id)
           FROM transactions t 
           WHERE t.referrer_id = u.id), 
          0
        ) as total_referrals,
        COALESCE(
          (SELECT COUNT(DISTINCT t.id)
           FROM transactions t 
           WHERE t.referrer_id = u.id
           AND t.status = 'completed'),
          0
        ) as active_referrals,
        CASE 
          WHEN (SELECT COUNT(*) FROM affiliate_links al WHERE al.affiliate_id = u.id AND al.clicks > 0) > 0
          THEN ROUND(
            (COALESCE(
              (SELECT COUNT(DISTINCT t.id)
               FROM transactions t 
               WHERE t.referrer_id = u.id 
               AND t.status = 'completed'), 
              0
            )::numeric / 
            NULLIF((SELECT SUM(clicks) FROM affiliate_links al WHERE al.affiliate_id = u.id), 0)::numeric * 100
          ), 2)
          ELSE 0
        END as conversion_rate
      FROM users u
      WHERE u.role = 'affiliate'
      ORDER BY total_earnings DESC
      LIMIT $1
    `, [limit]);
        return rows.map(row => ({
            id: row.id,
            user: {
                name: row.name,
                email: row.email
            },
            referralCode: row.referral_code,
            tier: {
                name: row.tier
            },
            totalEarnings: parseFloat(row.total_earnings),
            pendingEarnings: parseFloat(row.pending_earnings),
            totalReferrals: parseInt(row.total_referrals),
            activeReferrals: parseInt(row.active_referrals),
            conversionRate: parseFloat(row.conversion_rate)
        }));
    }
    static async create(input) {
        const client = await init_1.pool.connect();
        try {
            await client.query('BEGIN');
            // Hash password
            const password_hash = await bcryptjs_1.default.hash(input.password, 12);
            // Generate unique referral code
            let referral_code;
            let isUnique = false;
            while (!isUnique) {
                referral_code = this.generateReferralCode();
                const { rows } = await client.query('SELECT id FROM users WHERE referral_code = $1', [referral_code]);
                isUnique = rows.length === 0;
            }
            // Find referrer if referrer_code is provided
            let referrer_id = null;
            if (input.referrer_code) {
                const { rows } = await client.query('SELECT id FROM users WHERE referral_code = $1 AND is_active = true', [input.referrer_code]);
                if (rows.length > 0) {
                    referrer_id = rows[0].id;
                }
            }
            // Determine coordinator_id - use provided value or created_by_coordinator
            const coordinatorId = input.coordinator_id || input.created_by_coordinator || null;
            // Create user
            const { rows } = await client.query(`INSERT INTO users (email, password_hash, name, role, referrer_id, coordinator_id, referral_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, name, role, referrer_id, coordinator_id, referral_code, tier, is_active, email_verified, created_at, updated_at`, [input.email, password_hash, input.name, input.role || 'affiliate', referrer_id, coordinatorId, referral_code]);
            const user = rows[0];
            // Create default affiliate link for new affiliates
            if (user.role === 'affiliate') {
                await client.query(`INSERT INTO affiliate_links (affiliate_id, link_code)
           VALUES ($1, $2)`, [user.id, referral_code]);
                // Give signup bonus
                await client.query(`INSERT INTO bonuses (affiliate_id, type, description, amount)
           VALUES ($1, 'signup', 'Welcome bonus for joining as affiliate', 10.00)`, [user.id]);
            }
            await client.query('COMMIT');
            return user;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async findByEmail(email) {
        const { rows } = await init_1.pool.query(`SELECT id, email, password_hash, name, role, referrer_id, referral_code, tier, is_active, email_verified, created_at, updated_at
       FROM users WHERE email = $1`, [email]);
        return rows[0] || null;
    }
    static async findById(id) {
        const { rows } = await init_1.pool.query(`SELECT id, email, name, role, referrer_id, referral_code, tier, is_active, email_verified, created_at, updated_at
       FROM users WHERE id = $1`, [id]);
        return rows[0] || null;
    }
    static async findByReferralCode(referral_code) {
        const { rows } = await init_1.pool.query(`SELECT id, email, name, role, referrer_id, referral_code, tier, is_active, email_verified, created_at, updated_at
       FROM users WHERE referral_code = $1 AND is_active = true`, [referral_code]);
        return rows[0] || null;
    }
    static async verifyPassword(email, password) {
        const { rows } = await init_1.pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
        if (rows.length === 0) {
            return null;
        }
        const user = rows[0];
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return null;
        }
        // Remove password from returned object
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    static async getReferralTree(userId, levels = 3) {
        try {
            // Get direct referrals (Level 1)
            const { rows: level1 } = await init_1.pool.query(`
        SELECT id, name, email, created_at, tier, is_active,
               (SELECT COUNT(*) FROM transactions t 
                JOIN affiliate_links al ON t.affiliate_link_id = al.id 
                WHERE al.affiliate_id = users.id) as total_sales,
               (SELECT COUNT(*) FROM users u2 WHERE u2.referrer_id = users.id) as total_referrals,
               (SELECT COALESCE(SUM(c.amount), 0) FROM commissions c WHERE c.affiliate_id = users.id) as total_earnings
        FROM users 
        WHERE referrer_id = $1 AND is_active = true
      `, [userId]);
            // Get Level 2 referrals
            let level2 = [];
            if (levels >= 2 && level1.length > 0) {
                const level1Ids = level1.map(u => u.id).filter(id => id);
                if (level1Ids.length > 0) {
                    const { rows: level2Rows } = await init_1.pool.query(`
            SELECT id, name, email, created_at, tier, is_active,
                   (SELECT COUNT(*) FROM transactions t 
                    JOIN affiliate_links al ON t.affiliate_link_id = al.id 
                    WHERE al.affiliate_id = users.id) as total_sales,
                   (SELECT COUNT(*) FROM users u2 WHERE u2.referrer_id = users.id) as total_referrals,
                   (SELECT COALESCE(SUM(c.amount), 0) FROM commissions c WHERE c.affiliate_id = users.id) as total_earnings
            FROM users 
            WHERE referrer_id = ANY($1) AND is_active = true
          `, [level1Ids]);
                    level2 = level2Rows;
                }
            }
            // Get Level 3 referrals
            let level3 = [];
            if (levels >= 3 && level2.length > 0) {
                const level2Ids = level2.map(u => u.id).filter(id => id);
                if (level2Ids.length > 0) {
                    const { rows: level3Rows } = await init_1.pool.query(`
            SELECT id, name, email, created_at, tier, is_active,
                   (SELECT COUNT(*) FROM transactions t 
                    JOIN affiliate_links al ON t.affiliate_link_id = al.id 
                    WHERE al.affiliate_id = users.id) as total_sales,
                   (SELECT COUNT(*) FROM users u2 WHERE u2.referrer_id = users.id) as total_referrals,
                   (SELECT COALESCE(SUM(c.amount), 0) FROM commissions c WHERE c.affiliate_id = users.id) as total_earnings
            FROM users 
            WHERE referrer_id = ANY($1) AND is_active = true
          `, [level2Ids]);
                    level3 = level3Rows;
                }
            }
            // Transform the data to match the expected format
            const transformUser = (user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: 'affiliate',
                tier: user.tier,
                isActive: user.is_active === true,
                createdAt: user.created_at,
                totalEarnings: parseFloat(user.total_earnings || 0),
                totalReferrals: parseInt(user.total_referrals || 0),
                conversionRate: user.total_sales > 0 ? (user.total_sales / user.total_referrals * 100) : 0
            });
            return {
                level1: level1.map(transformUser),
                level2: level2.map(transformUser),
                level3: level3.map(transformUser),
                totals: {
                    level1: level1.length,
                    level2: level2.length,
                    level3: level3.length,
                    total: level1.length + level2.length + level3.length
                }
            };
        }
        catch (error) {
            console.error('Error in getReferralTree:', error);
            // Return empty results on error
            return {
                level1: [],
                level2: [],
                level3: [],
                totals: {
                    level1: 0,
                    level2: 0,
                    level3: 0,
                    total: 0
                }
            };
        }
    }
    static async updateTier(userId, tier) {
        await init_1.pool.query('UPDATE users SET tier = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [tier, userId]);
    }
    static async updateProfile(userId, updates) {
        const setClause = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');
        const values = Object.values(updates);
        const { rows } = await init_1.pool.query(`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING id, email, name, role, referrer_id, referral_code, tier, is_active, email_verified, created_at, updated_at`, [userId, ...values]);
        return rows[0];
    }
    static async updatePassword(userId, newPassword) {
        const password_hash = await bcryptjs_1.default.hash(newPassword, 12);
        await init_1.pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [password_hash, userId]);
    }
    static async updateStatus(userId, isActive) {
        await init_1.pool.query('UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [isActive, userId]);
    }
    static async deleteUser(userId) {
        await init_1.pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    static generateReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    static async getAllAffiliates(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [affiliatesResult, countResult] = await Promise.all([
            init_1.pool.query(`SELECT u.id, u.name, u.email, u.tier, u.created_at, u.is_active, u.referral_code,
                (SELECT COUNT(*) FROM users WHERE referrer_id = u.id) as direct_referrals,
                (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE affiliate_id = u.id AND status = 'paid') as total_earnings,
                (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE affiliate_id = u.id AND status = 'pending') as pending_earnings
         FROM users u
         WHERE u.role = 'affiliate'
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`, [limit, offset]),
            init_1.pool.query('SELECT COUNT(*) FROM users WHERE role = \'affiliate\'')
        ]);
        // Transform the data to match frontend expectations
        const transformedAffiliates = affiliatesResult.rows.map(row => ({
            id: row.id,
            userId: row.id,
            referralCode: row.referral_code,
            tier: row.tier ? { name: row.tier } : { name: 'Bronze' },
            totalEarnings: parseFloat(row.total_earnings || 0),
            pendingEarnings: parseFloat(row.pending_earnings || 0),
            totalReferrals: parseInt(row.direct_referrals || 0),
            activeReferrals: parseInt(row.direct_referrals || 0),
            conversionRate: 0, // Calculate this if needed
            createdAt: row.created_at,
            user: {
                id: row.id,
                name: row.name,
                email: row.email,
                role: 'affiliate',
                status: row.is_active ? 'active' : 'inactive',
                createdAt: row.created_at
            }
        }));
        return {
            affiliates: transformedAffiliates,
            total: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        };
    }
    // Coordinator-specific methods
    static async getAffiliatesByCoordinator(coordinatorId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [affiliatesResult, countResult] = await Promise.all([
            init_1.pool.query(`SELECT u.id, u.name, u.email, u.tier, u.created_at, u.is_active, u.referral_code,
                (SELECT COUNT(*) FROM users WHERE referrer_id = u.id) as direct_referrals,
                (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE affiliate_id = u.id AND status = 'paid') as total_earnings,
                (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE affiliate_id = u.id AND status = 'pending') as pending_earnings
         FROM users u
         WHERE u.role = 'affiliate' AND u.coordinator_id = $1
         ORDER BY u.created_at DESC
         LIMIT $2 OFFSET $3`, [coordinatorId, limit, offset]),
            init_1.pool.query('SELECT COUNT(*) FROM users WHERE role = \'affiliate\' AND coordinator_id = $1', [coordinatorId])
        ]);
        // Transform the data to match frontend expectations
        const transformedAffiliates = affiliatesResult.rows.map(row => ({
            id: row.id,
            userId: row.id,
            referralCode: row.referral_code,
            tier: row.tier ? { name: row.tier } : { name: 'Bronze' },
            totalEarnings: parseFloat(row.total_earnings || 0),
            pendingEarnings: parseFloat(row.pending_earnings || 0),
            totalReferrals: parseInt(row.direct_referrals || 0),
            activeReferrals: parseInt(row.direct_referrals || 0),
            conversionRate: 0, // Calculate this if needed
            createdAt: row.created_at,
            user: {
                id: row.id,
                name: row.name,
                email: row.email,
                role: 'affiliate',
                status: row.is_active ? 'active' : 'inactive',
                createdAt: row.created_at
            }
        }));
        return {
            affiliates: transformedAffiliates,
            total: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        };
    }
    static async assignAffiliateToCoordinator(affiliateId, coordinatorId) {
        await init_1.pool.query('UPDATE users SET coordinator_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = \'affiliate\'', [coordinatorId, affiliateId]);
    }
    static async removeAffiliateFromCoordinator(affiliateId) {
        await init_1.pool.query('UPDATE users SET coordinator_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND role = \'affiliate\'', [affiliateId]);
    }
    static async getCoordinatorStats(coordinatorId) {
        const { rows } = await init_1.pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE coordinator_id = $1 AND role = 'affiliate') as total_affiliates,
        (SELECT COUNT(*) FROM users WHERE coordinator_id = $1 AND role = 'affiliate' AND is_active = true) as active_affiliates,
        (SELECT COALESCE(SUM(amount), 0) FROM commissions c 
         JOIN users u ON c.affiliate_id = u.id 
         WHERE u.coordinator_id = $1 AND c.status = 'paid') as total_commissions,
        (SELECT COALESCE(SUM(amount), 0) FROM commissions c 
         JOIN users u ON c.affiliate_id = u.id 
         WHERE u.coordinator_id = $1 AND c.status = 'pending') as pending_commissions,
        (SELECT COUNT(*) FROM transactions t 
         JOIN users u ON t.referrer_id = u.id 
         WHERE u.coordinator_id = $1) as total_referrals
    `, [coordinatorId]);
        return rows[0] || {
            total_affiliates: 0,
            active_affiliates: 0,
            total_commissions: 0,
            pending_commissions: 0,
            total_referrals: 0
        };
    }
    static async getCoordinatorReferrals(coordinatorId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [referralsResult, countResult] = await Promise.all([
            init_1.pool.query(`SELECT t.id, t.customer_email, t.amount, t.status, t.created_at,
                u.name as affiliate_name, u.email as affiliate_email
         FROM transactions t
         JOIN users u ON t.referrer_id = u.id
         WHERE u.coordinator_id = $1
         ORDER BY t.created_at DESC
         LIMIT $2 OFFSET $3`, [coordinatorId, limit, offset]),
            init_1.pool.query(`SELECT COUNT(*) FROM transactions t
         JOIN users u ON t.referrer_id = u.id
         WHERE u.coordinator_id = $1`, [coordinatorId])
        ]);
        return {
            referrals: referralsResult.rows,
            total: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        };
    }
    // Get all coordinators with their stats
    static async getAllCoordinators() {
        const { rows } = await init_1.pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.is_active,
        u.created_at,
        COUNT(a.id) as affiliate_count,
        COUNT(CASE WHEN a.is_active = true THEN 1 END) as active_affiliate_count,
        0 as total_commissions,
        COALESCE(SUM(ref_count.referral_count), 0) as total_referrals
      FROM users u
      LEFT JOIN users a ON a.coordinator_id = u.id AND a.role = 'affiliate'
      LEFT JOIN (
        SELECT 
          referrer_id as affiliate_id,
          COUNT(*) as referral_count
        FROM users
        WHERE referrer_id IS NOT NULL
        GROUP BY referrer_id
      ) ref_count ON ref_count.affiliate_id = a.id
      WHERE u.role = 'coordinator'
      GROUP BY u.id, u.name, u.email, u.is_active, u.created_at
      ORDER BY u.created_at DESC
    `);
        return rows;
    }
    // Get referral count for a specific user
    static async getReferralCount(userId) {
        const { rows } = await init_1.pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE referrer_id = $1
    `, [userId]);
        return parseInt(rows[0].count);
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=User.js.map