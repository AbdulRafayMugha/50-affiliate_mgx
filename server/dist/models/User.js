"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const tslib_1 = require("tslib");
const init_1 = require("../database/init");
const bcryptjs_1 = tslib_1.__importDefault(require("bcryptjs"));
class UserModel {
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
            // Create user
            const { rows } = await client.query(`INSERT INTO users (email, password_hash, name, role, referrer_id, referral_code)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, name, role, referrer_id, referral_code, tier, is_active, email_verified, created_at, updated_at`, [input.email, password_hash, input.name, input.role || 'affiliate', referrer_id, referral_code]);
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
        const client = await init_1.pool.connect();
        try {
            // Get direct referrals (Level 1)
            const level1Query = `
        SELECT id, name, email, created_at, tier,
               (SELECT COUNT(*) FROM transactions t 
                JOIN affiliate_links al ON t.affiliate_link_id = al.id 
                WHERE al.affiliate_id = users.id) as total_sales
        FROM users 
        WHERE referrer_id = $1 AND is_active = true
      `;
            const { rows: level1 } = await client.query(level1Query, [userId]);
            // Get Level 2 referrals
            let level2 = [];
            if (levels >= 2 && level1.length > 0) {
                const level1Ids = level1.map(u => u.id);
                const { rows } = await client.query(`${level1Query} AND referrer_id = ANY($1)`, [level1Ids]);
                level2 = rows;
            }
            // Get Level 3 referrals
            let level3 = [];
            if (levels >= 3 && level2.length > 0) {
                const level2Ids = level2.map(u => u.id);
                const { rows } = await client.query(`${level1Query} AND referrer_id = ANY($1)`, [level2Ids]);
                level3 = rows;
            }
            return {
                level1: level1,
                level2: level2,
                level3: level3,
                totals: {
                    level1: level1.length,
                    level2: level2.length,
                    level3: level3.length,
                    total: level1.length + level2.length + level3.length
                }
            };
        }
        finally {
            client.release();
        }
    }
    static async updateTier(userId, tier) {
        await init_1.pool.query('UPDATE users SET tier = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [tier, userId]);
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
            init_1.pool.query(`SELECT u.id, u.name, u.email, u.tier, u.created_at, u.is_active,
                (SELECT COUNT(*) FROM users WHERE referrer_id = u.id) as direct_referrals,
                (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE affiliate_id = u.id AND status = 'paid') as total_earnings,
                (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE affiliate_id = u.id AND status = 'pending') as pending_earnings
         FROM users u
         WHERE u.role = 'affiliate'
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`, [limit, offset]),
            init_1.pool.query('SELECT COUNT(*) FROM users WHERE role = \'affiliate\'')
        ]);
        return {
            affiliates: affiliatesResult.rows,
            total: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        };
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=User.js.map