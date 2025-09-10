export interface User {
    id: string;
    email: string;
    password_hash?: string;
    name: string;
    role: 'admin' | 'affiliate' | 'client' | 'coordinator';
    referrer_id?: string;
    coordinator_id?: string;
    referral_code: string;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    is_active: boolean;
    email_verified: boolean;
    email_verification_token?: string;
    email_verification_expires?: Date;
    password_reset_token?: string;
    password_reset_expires?: Date;
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
    created_by_coordinator?: string;
    email_verification_token?: string;
    email_verification_expires?: Date;
}
export declare class UserModel {
    static getTopAffiliates(limit?: number): Promise<any[]>;
    static create(input: CreateUserInput): Promise<User>;
    static findByEmail(email: string): Promise<User | null>;
    static findById(id: string): Promise<User | null>;
    static findByReferralCode(referral_code: string): Promise<User | null>;
    static verifyPassword(email: string, password: string): Promise<User | null>;
    static getReferralTree(userId: string, levels?: number): Promise<any>;
    static updateTier(userId: string, tier: User['tier']): Promise<void>;
    static updateProfile(userId: string, updates: {
        name?: string;
        email?: string;
    }): Promise<User>;
    static updatePassword(userId: string, newPassword: string): Promise<void>;
    static updateStatus(userId: string, isActive: boolean): Promise<void>;
    static deleteUser(userId: string): Promise<void>;
    private static generateReferralCode;
    static getAllAffiliates(page?: number, limit?: number): Promise<{
        affiliates: any[];
        total: number;
        totalPages: number;
    }>;
    static getAffiliatesByCoordinator(coordinatorId: string, page?: number, limit?: number): Promise<{
        affiliates: any[];
        total: number;
        totalPages: number;
    }>;
    static assignAffiliateToCoordinator(affiliateId: string, coordinatorId: string): Promise<void>;
    static removeAffiliateFromCoordinator(affiliateId: string): Promise<void>;
    static getCoordinatorStats(coordinatorId: string): Promise<any>;
    static getCoordinatorReferrals(coordinatorId: string, page?: number, limit?: number): Promise<{
        referrals: any[];
        total: number;
        totalPages: number;
    }>;
    static getAllCoordinators(): Promise<any[]>;
    static getReferralCount(userId: string): Promise<number>;
    static findByVerificationToken(token: string): Promise<User | null>;
    static findByPasswordResetToken(token: string): Promise<User | null>;
    static verifyEmail(userId: string): Promise<void>;
    static updateVerificationToken(userId: string, token: string, expires: Date): Promise<void>;
    static updatePasswordResetToken(userId: string, token: string, expires: Date): Promise<void>;
    static clearPasswordResetToken(userId: string): Promise<void>;
}
