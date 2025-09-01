export interface User {
    id: string;
    email: string;
    password_hash?: string;
    name: string;
    role: 'admin' | 'affiliate' | 'client';
    referrer_id?: string;
    referral_code: string;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    is_active: boolean;
    email_verified: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateUserInput {
    email: string;
    password: string;
    name: string;
    role?: 'admin' | 'affiliate' | 'client';
    referrer_code?: string;
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
}
