export interface EmailInvite {
    id: string;
    affiliate_id: string;
    email: string;
    name?: string;
    status: 'invited' | 'confirmed' | 'converted' | 'expired';
    invited_at: Date;
    confirmed_at?: Date;
    converted_at?: Date;
    expires_at: Date;
    conversion_value?: number;
    created_at: Date;
    updated_at: Date;
}
export declare class EmailInviteModel {
    static create(affiliateId: string, email: string, name?: string): Promise<EmailInvite>;
    static getByAffiliateId(affiliateId: string, limit?: number): Promise<EmailInvite[]>;
    static updateStatus(inviteId: string, status: EmailInvite['status']): Promise<void>;
    static getStats(affiliateId: string): Promise<{
        totalInvited: number;
        totalConfirmed: number;
        totalConverted: number;
        totalExpired: number;
        confirmationRate: number;
        conversionRate: number;
    }>;
}
