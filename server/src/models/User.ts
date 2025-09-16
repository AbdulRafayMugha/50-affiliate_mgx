// src/models/User.ts
import { pool } from '../database/init';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  role: 'admin' | 'affiliate' | 'client' | 'coordinator';
  referrer_id?: string | null;
  coordinator_id?: string | null;
  referral_code: string;
  is_active: boolean;
  email_verified: boolean;
  email_verification_token?: string | null;
  email_verification_expires?: Date | null;
  password_reset_token?: string | null;
  password_reset_expires?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'affiliate' | 'client' | 'coordinator';
  referrer_code?: string;
  coordinator_id?: string;
  created_by_coordinator?: string; // ID of coordinator who created this user
  email_verification_token?: string;
  email_verification_expires?: Date;
}

/* --- Helper types and functions --- */
type Row = RowDataPacket & Record<string, any>;

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

export class UserModel {
  static async getTopAffiliates(limit: number = 5): Promise<any[]> {
    const [rows] = await pool.query<Row[]>(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.referral_code,
        u.is_active,
        COALESCE(
          (SELECT SUM(c.amount) FROM commissions c WHERE c.affiliate_id = u.id), 
          0
        ) as total_earnings,
        COALESCE(
          (SELECT SUM(c.amount) FROM commissions c WHERE c.affiliate_id = u.id AND c.status IN ('pending', 'approved')), 
          0
        ) as pending_earnings,
        COALESCE(
          (SELECT COUNT(DISTINCT t.id) FROM transactions t WHERE t.referrer_id = u.id), 
          0
        ) as total_referrals,
        COALESCE(
          (SELECT COUNT(DISTINCT t.id) FROM transactions t WHERE t.referrer_id = u.id AND t.status = 'completed'),
          0
        ) as active_referrals,
        CASE 
          WHEN (SELECT COUNT(*) FROM affiliate_links al WHERE al.affiliate_id = u.id AND al.clicks > 0) > 0
          THEN ROUND(
            (COALESCE(
              (SELECT COUNT(DISTINCT t.id) FROM transactions t WHERE t.referrer_id = u.id AND t.status = 'completed'), 
              0
            ) / NULLIF((SELECT SUM(clicks) FROM affiliate_links al WHERE al.affiliate_id = u.id), 0) ) * 100, 2)
          ELSE 0
        END as conversion_rate
      FROM users u
      WHERE u.role = 'affiliate'
      ORDER BY total_earnings DESC
      LIMIT ?
      `,
      [limit]
    );

    return rows.map((row) => ({
      id: row.id,
      user: {
        name: row.name,
        email: row.email
      },
      referralCode: row.referral_code,
      totalEarnings: toNumber(row.total_earnings),
      pendingEarnings: toNumber(row.pending_earnings),
      totalReferrals: parseInt(row.total_referrals || 0),
      activeReferrals: parseInt(row.active_referrals || 0),
      conversionRate: toNumber(row.conversion_rate)
    }));
  }

  static async create(input: CreateUserInput): Promise<User> {
    const client = await pool.getConnection();
    try {
      await client.beginTransaction();

      const password_hash = await bcrypt.hash(input.password, 12);

      let referral_code: string;
      let isUnique = false;
      // generate unique referral code
      while (!isUnique) {
        referral_code = this.generateReferralCode();
        const [exists] = await client.query<Row[]>(
          'SELECT id FROM users WHERE referral_code = ?',
          [referral_code]
        );
        isUnique = (exists && exists.length === 0);
      }

      // Resolve referrer and coordinator logic
      let referrer_id: string | null = null;
      let coordinatorId: string | null = input.coordinator_id || input.created_by_coordinator || null;

      // Super Coordinator ID (Hadi)
      const SUPER_COORDINATOR_ID = 'e81feb9a-6d2e-4540-a092-1005ecac6fa1';

      if (input.referrer_code) {
        const [rows] = await client.query<Row[]>(
          'SELECT id, role, coordinator_id FROM users WHERE referral_code = ? AND is_active = true LIMIT 1',
          [input.referrer_code]
        );
        if (rows && rows.length > 0) {
          const ref = rows[0];
          referrer_id = ref.id;
          if (ref.role === 'coordinator' && ref.id !== SUPER_COORDINATOR_ID) {
            coordinatorId = ref.id;
          } else if (ref.role === 'coordinator' && ref.id === SUPER_COORDINATOR_ID) {
            coordinatorId = SUPER_COORDINATOR_ID;
          } else if (ref.role === 'affiliate' && ref.coordinator_id) {
            coordinatorId = ref.coordinator_id;
          }
        }
      } else {
        coordinatorId = SUPER_COORDINATOR_ID;
      }

      // Insert user
      const [insertedRows] = await client.query<Row[]>(
        `INSERT INTO users (email, password_hash, name, role, referrer_id, coordinator_id, referral_code, email_verification_token, email_verification_expires)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id, email, name, role, referrer_id, coordinator_id, referral_code, is_active, email_verified, email_verification_token, email_verification_expires, created_at, updated_at`,
        [
          input.email,
          password_hash,
          input.name,
          input.role || 'affiliate',
          referrer_id,
          coordinatorId,
          referral_code,
          input.email_verification_token || null,
          input.email_verification_expires ? input.email_verification_expires.toISOString() : null
        ]
      );

      const userRow = insertedRows && insertedRows[0];
      if (!userRow) {
        await client.rollback();
        throw new Error('Failed to create user');
      }

      // If created user is affiliate - create affiliate link and give signup bonus
      if ((userRow.role || input.role || 'affiliate') === 'affiliate') {
        await client.query<ResultSetHeader>(
          `INSERT INTO affiliate_links (affiliate_id, link_code) VALUES (?, ?)`,
          [userRow.id, referral_code]
        );

        await client.query<ResultSetHeader>(
          `INSERT INTO bonuses (affiliate_id, type, description, amount) VALUES (?, 'signup', 'Welcome bonus for joining as affiliate', 10.00)`,
          [userRow.id]
        );
      }

      await client.commit();
      // format the returned user to match interface
      return {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        role: userRow.role,
        referrer_id: userRow.referrer_id ?? null,
        coordinator_id: userRow.coordinator_id ?? null,
        referral_code: userRow.referral_code,
        is_active: Boolean(userRow.is_active),
        email_verified: Boolean(userRow.email_verified),
        email_verification_token: userRow.email_verification_token ?? null,
        email_verification_expires: userRow.email_verification_expires ? new Date(userRow.email_verification_expires) : null,
        created_at: new Date(userRow.created_at),
        updated_at: new Date(userRow.updated_at)
      } as User;
    } catch (err) {
      await client.rollback();
      throw err;
    } finally {
      client.release();
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query<Row[]>(
      `SELECT id, email, password_hash, name, role, referrer_id, referral_code, is_active, email_verified, created_at, updated_at
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    const r = rows && rows[0];
    if (!r) return null;
    return {
      id: r.id,
      email: r.email,
      password_hash: r.password_hash,
      name: r.name,
      role: r.role,
      referrer_id: r.referrer_id ?? null,
      coordinator_id: r.coordinator_id ?? null,
      referral_code: r.referral_code,
      is_active: Boolean(r.is_active),
      email_verified: Boolean(r.email_verified),
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at)
    };
  }

  static async findById(id: string): Promise<User | null> {
    const [rows] = await pool.query<Row[]>(
      `SELECT id, email, name, role, referrer_id, referral_code, is_active, email_verified, created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    const r = rows && rows[0];
    if (!r) return null;
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      referrer_id: r.referrer_id ?? null,
      coordinator_id: r.coordinator_id ?? null,
      referral_code: r.referral_code,
      is_active: Boolean(r.is_active),
      email_verified: Boolean(r.email_verified),
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at)
    };
  }

  static async findByReferralCode(referral_code: string): Promise<User | null> {
    const [rows] = await pool.query<Row[]>(
      `SELECT id, email, name, role, referrer_id, referral_code, is_active, email_verified, created_at, updated_at
       FROM users WHERE referral_code = ? AND is_active = true LIMIT 1`,
      [referral_code]
    );
    const r = rows && rows[0];
    if (!r) return null;
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      referrer_id: r.referrer_id ?? null,
      coordinator_id: r.coordinator_id ?? null,
      referral_code: r.referral_code,
      is_active: Boolean(r.is_active),
      email_verified: Boolean(r.email_verified),
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at)
    };
  }

  static async verifyPassword(email: string, password: string): Promise<User | null> {
    const [rows] = await pool.query<Row[]>(
      'SELECT * FROM users WHERE email = ? AND is_active = true LIMIT 1',
      [email]
    );
    if (!rows || rows.length === 0) return null;
    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) return null;
    // remove password_hash before returning
    const { password_hash, ...rest } = user;
    return {
      id: rest.id,
      email: rest.email,
      name: rest.name,
      role: rest.role,
      referrer_id: rest.referrer_id ?? null,
      coordinator_id: rest.coordinator_id ?? null,
      referral_code: rest.referral_code,
      is_active: Boolean(rest.is_active),
      email_verified: Boolean(rest.email_verified),
      created_at: new Date(rest.created_at),
      updated_at: new Date(rest.updated_at)
    } as User;
  }

  static async getReferralTree(userId: string, levels: number = 3): Promise<any> {
    try {
      const [level1Rows] = await pool.query<Row[]>(
        `
        SELECT id, name, email, created_at, is_active,
               (SELECT COUNT(*) FROM transactions t JOIN affiliate_links al ON t.affiliate_link_id = al.id WHERE al.affiliate_id = users.id) as total_sales,
               (SELECT COUNT(*) FROM users u2 WHERE u2.referrer_id = users.id) as total_referrals,
               (SELECT COALESCE(SUM(c.amount),0) FROM commissions c WHERE c.affiliate_id = users.id) as total_earnings
        FROM users 
        WHERE referrer_id = ? AND is_active = true
        `,
        [userId]
      );

      let level2: Row[] = [];
      if (levels >= 2 && level1Rows.length > 0) {
        const ids = level1Rows.map(r => r.id);
        const [level2Rows] = await pool.query<Row[]>(
          `
          SELECT id, name, email, created_at, is_active,
                 (SELECT COUNT(*) FROM transactions t JOIN affiliate_links al ON t.affiliate_link_id = al.id WHERE al.affiliate_id = users.id) as total_sales,
                 (SELECT COUNT(*) FROM users u2 WHERE u2.referrer_id = users.id) as total_referrals,
                 (SELECT COALESCE(SUM(c.amount),0) FROM commissions c WHERE c.affiliate_id = users.id) as total_earnings
          FROM users
          WHERE referrer_id IN (?) AND is_active = true
          `,
          [ids]
        );
        level2 = level2Rows || [];
      }

      let level3: Row[] = [];
      if (levels >= 3 && level2.length > 0) {
        const ids = level2.map(r => r.id);
        const [level3Rows] = await pool.query<Row[]>(
          `
          SELECT id, name, email, created_at, is_active,
                 (SELECT COUNT(*) FROM transactions t JOIN affiliate_links al ON t.affiliate_link_id = al.id WHERE al.affiliate_id = users.id) as total_sales,
                 (SELECT COUNT(*) FROM users u2 WHERE u2.referrer_id = users.id) as total_referrals,
                 (SELECT COALESCE(SUM(c.amount),0) FROM commissions c WHERE c.affiliate_id = users.id) as total_earnings
          FROM users
          WHERE referrer_id IN (?) AND is_active = true
          `,
          [ids]
        );
        level3 = level3Rows || [];
      }

      const transformUser = (u: Row) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: 'affiliate',
        isActive: Boolean(u.is_active),
        createdAt: new Date(u.created_at),
        totalEarnings: toNumber(u.total_earnings),
        totalReferrals: parseInt(u.total_referrals || 0),
        conversionRate: (toNumber(u.total_sales) > 0 && parseInt(u.total_referrals || 0) > 0)
          ? (toNumber(u.total_sales) / parseInt(u.total_referrals || 0)) * 100
          : 0
      });

      return {
        level1: level1Rows.map(transformUser),
        level2: level2.map(transformUser),
        level3: level3.map(transformUser),
        totals: {
          level1: level1Rows.length,
          level2: level2.length,
          level3: level3.length,
          total: level1Rows.length + level2.length + level3.length
        }
      };
    } catch (error) {
      console.error('Error in getReferralTree:', error);
      return {
        level1: [],
        level2: [],
        level3: [],
        totals: { level1: 0, level2: 0, level3: 0, total: 0 }
      };
    }
  }

  static async updateProfile(userId: string, updates: { name?: string; email?: string }): Promise<User> {
    const setClause = Object.keys(updates)
      .map((key, idx) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);
    const sql = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING id, email, name, role, referrer_id, referral_code, is_active, email_verified, created_at, updated_at`;
    const [rows] = await pool.query<Row[]>(
      sql,
      [...values, userId]
    );
    const r = rows && rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      referrer_id: r.referrer_id ?? null,
      coordinator_id: r.coordinator_id ?? null,
      referral_code: r.referral_code,
      is_active: Boolean(r.is_active),
      email_verified: Boolean(r.email_verified),
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at)
    };
  }

  static async updatePassword(userId: string, newPassword: string): Promise<void> {
    const password_hash = await bcrypt.hash(newPassword, 12);
    await pool.query<ResultSetHeader>(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [password_hash, userId]
    );
  }

  static async updateStatus(userId: string, isActive: boolean): Promise<void> {
    await pool.query<ResultSetHeader>(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [isActive ? 1 : 0, userId]
    );
  }

  static async deleteUser(userId: string): Promise<void> {
    await pool.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [userId]);
  }

  private static generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async getAllAffiliates(page: number = 1, limit: number = 20): Promise<{
    affiliates: any[];
    total: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const [affiliatesResult] = await pool.query<Row[]>(
      `
      SELECT u.id, u.name, u.email, u.created_at, u.is_active, u.referral_code,
             (SELECT COUNT(*) FROM users WHERE referrer_id = u.id) as direct_referrals,
             (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE affiliate_id = u.id AND status = 'paid') as total_earnings,
             (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE affiliate_id = u.id AND status = 'pending') as pending_earnings
      FROM users u
      WHERE u.role = 'affiliate'
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    const [countResult] = await pool.query<Row[]>(
      `SELECT COUNT(*) as count FROM users WHERE role = 'affiliate'`
    );

    const transformedAffiliates = affiliatesResult.map(row => ({
      id: row.id,
      userId: row.id,
      referralCode: row.referral_code,
      totalEarnings: toNumber(row.total_earnings),
      pendingEarnings: toNumber(row.pending_earnings),
      totalReferrals: parseInt(row.direct_referrals || 0),
      activeReferrals: parseInt(row.direct_referrals || 0),
      conversionRate: 0,
      createdAt: new Date(row.created_at),
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        role: 'affiliate',
        status: row.is_active ? 'active' : 'inactive',
        createdAt: new Date(row.created_at)
      }
    }));

    const total = parseInt(countResult[0]?.count || '0');

    return {
      affiliates: transformedAffiliates,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getAffiliatesByCoordinator(coordinatorId: string, page: number = 1, limit: number = 20): Promise<{
    affiliates: any[];
    total: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const [affiliatesResult] = await pool.query<Row[]>(
      `
      SELECT u.id, u.name, u.email, u.created_at, u.is_active, u.referral_code,
             (SELECT COUNT(*) FROM users WHERE referrer_id = u.id) as direct_referrals,
             (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE affiliate_id = u.id AND status = 'paid') as total_earnings,
             (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE affiliate_id = u.id AND status = 'pending') as pending_earnings
      FROM users u
      WHERE u.role = 'affiliate' AND u.coordinator_id = ?
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [coordinatorId, limit, offset]
    );

    const [countResult] = await pool.query<Row[]>(
      `SELECT COUNT(*) as count FROM users WHERE role = 'affiliate' AND coordinator_id = ?`,
      [coordinatorId]
    );

    const transformedAffiliates = affiliatesResult.map(row => ({
      id: row.id,
      userId: row.id,
      referralCode: row.referral_code,
      totalEarnings: toNumber(row.total_earnings),
      pendingEarnings: toNumber(row.pending_earnings),
      totalReferrals: parseInt(row.direct_referrals || 0),
      activeReferrals: parseInt(row.direct_referrals || 0),
      conversionRate: 0,
      createdAt: new Date(row.created_at),
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        role: 'affiliate',
        status: row.is_active ? 'active' : 'inactive',
        createdAt: new Date(row.created_at)
      }
    }));

    const total = parseInt(countResult[0]?.count || '0');

    return {
      affiliates: transformedAffiliates,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async assignAffiliateToCoordinator(affiliateId: string, coordinatorId: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      'UPDATE users SET coordinator_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = ?',
      [coordinatorId, affiliateId, 'affiliate']
    );
  }

  static async removeAffiliateFromCoordinator(affiliateId: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      'UPDATE users SET coordinator_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = ?',
      [affiliateId, 'affiliate']
    );
  }

  static async getCoordinatorStats(coordinatorId: string): Promise<any> {
    const [rows] = await pool.query<Row[]>(
      `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE coordinator_id = ? AND role = 'affiliate') as total_affiliates,
        (SELECT COUNT(*) FROM users WHERE coordinator_id = ? AND role = 'affiliate' AND is_active = 1) as active_affiliates,
        (SELECT COALESCE(SUM(amount), 0) FROM commissions c JOIN users u ON c.affiliate_id = u.id WHERE u.coordinator_id = ? AND c.status = 'paid') as total_commissions,
        (SELECT COALESCE(SUM(amount), 0) FROM commissions c JOIN users u ON c.affiliate_id = u.id WHERE u.coordinator_id = ? AND c.status = 'pending') as pending_commissions,
        (SELECT COUNT(*) FROM transactions t JOIN users u ON t.referrer_id = u.id WHERE u.coordinator_id = ?) as total_referrals
      `,
      [coordinatorId, coordinatorId, coordinatorId, coordinatorId, coordinatorId]
    );

    return rows && rows[0] ? rows[0] : {
      total_affiliates: 0,
      active_affiliates: 0,
      total_commissions: 0,
      pending_commissions: 0,
      total_referrals: 0
    };
  }

  static async getCoordinatorReferrals(coordinatorId: string, page: number = 1, limit: number = 20): Promise<{
    referrals: any[];
    total: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const [referralsResult] = await pool.query<Row[]>(
      `
      SELECT t.id, t.customer_email, t.amount, t.status, t.created_at,
             u.name as affiliate_name, u.email as affiliate_email
      FROM transactions t
      JOIN users u ON t.referrer_id = u.id
      WHERE u.coordinator_id = ?
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [coordinatorId, limit, offset]
    );

    const [countResult] = await pool.query<Row[]>(
      `SELECT COUNT(*) as count FROM transactions t JOIN users u ON t.referrer_id = u.id WHERE u.coordinator_id = ?`,
      [coordinatorId]
    );

    const total = parseInt(countResult[0]?.count || '0');

    return {
      referrals: referralsResult,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getAllCoordinators(): Promise<any[]> {
    const [rows] = await pool.query<Row[]>(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.is_active,
        u.created_at,
        COUNT(a.id) as affiliate_count,
        SUM(CASE WHEN a.is_active = 1 THEN 1 ELSE 0 END) as active_affiliate_count,
        0 as total_commissions,
        COALESCE(SUM(ref_count.referral_count), 0) as total_referrals
      FROM users u
      LEFT JOIN users a ON a.coordinator_id = u.id AND a.role = 'affiliate'
      LEFT JOIN (
        SELECT referrer_id as affiliate_id, COUNT(*) as referral_count
        FROM users WHERE referrer_id IS NOT NULL GROUP BY referrer_id
      ) ref_count ON ref_count.affiliate_id = a.id
      WHERE u.role = 'coordinator'
      GROUP BY u.id, u.name, u.email, u.is_active, u.created_at
      ORDER BY u.created_at DESC
      `
    );
    return rows;
  }

  static async getReferralCount(userId: string): Promise<number> {
    const [rows] = await pool.query<Row[]>(
      `SELECT COUNT(*) as count FROM users WHERE referrer_id = ?`,
      [userId]
    );
    return parseInt(rows[0]?.count || '0');
  }

  static async findByVerificationToken(token: string): Promise<User | null> {
    const [rows] = await pool.query<Row[]>(
      'SELECT * FROM users WHERE email_verification_token = ? LIMIT 1',
      [token]
    );
    const r = rows && rows[0];
    if (!r) return null;
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      referrer_id: r.referrer_id ?? null,
      coordinator_id: r.coordinator_id ?? null,
      referral_code: r.referral_code,
      is_active: Boolean(r.is_active),
      email_verified: Boolean(r.email_verified),
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at)
    };
  }

  static async findByPasswordResetToken(token: string): Promise<User | null> {
    const [rows] = await pool.query<Row[]>(
      'SELECT * FROM users WHERE password_reset_token = ? LIMIT 1',
      [token]
    );
    const r = rows && rows[0];
    if (!r) return null;
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      referrer_id: r.referrer_id ?? null,
      coordinator_id: r.coordinator_id ?? null,
      referral_code: r.referral_code,
      is_active: Boolean(r.is_active),
      email_verified: Boolean(r.email_verified),
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at)
    };
  }

  static async verifyEmail(userId: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      'UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?',
      [userId]
    );
  }

  static async updateVerificationToken(userId: string, token: string, expires: Date): Promise<void> {
    await pool.query<ResultSetHeader>(
      'UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?',
      [token, expires.toISOString(), userId]
    );
  }

  static async updatePasswordResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await pool.query<ResultSetHeader>(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [token, expires.toISOString(), userId]
    );
  }

  static async clearPasswordResetToken(userId: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [userId]
    );
  }
}
