export interface EmailInvite {
    id: string;
    affiliate_id: string;
    email: string;
    message?: string;
    status: 'sent' | 'opened' | 'clicked' | 'converted';
    sent_at: Date;
    clicked_at?: Date;
    converted_at?: Date;
    created_at: Date;
}
export declare class EmailInviteModel {
    static create(affiliateId: string, email: string, message?: string): Promise<EmailInvite>;
    static getByAffiliateId(affiliateId: string, limit?: number): Promise<EmailInvite[]>;
    static updateStatus(inviteId: string, status: EmailInvite['status']): Promise<void>;
    static getStats(affiliateId: string): Promise<{
        totalSent: number;
        totalOpened: number;
        totalClicked: number;
        totalConverted: number;
        openRate: number;
        clickRate: number;
        conversionRate: number;
    }>;
}
