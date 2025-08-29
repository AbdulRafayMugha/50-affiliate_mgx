export interface AffiliateLink {
    id: string;
    affiliate_id: string;
    link_code: string;
    clicks: number;
    conversions: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare class AffiliateLinkModel {
    static create(affiliateId: string, customCode?: string): Promise<AffiliateLink>;
    static getByAffiliateId(affiliateId: string): Promise<AffiliateLink[]>;
    static getByLinkCode(linkCode: string): Promise<AffiliateLink | null>;
    static recordClick(linkCode: string): Promise<void>;
    static getStats(affiliateId: string): Promise<{
        totalClicks: number;
        totalConversions: number;
        conversionRate: number;
        activeLinks: number;
    }>;
    static toggleStatus(linkId: string, isActive: boolean): Promise<void>;
    private static generateLinkCode;
    static generateReferralUrl(linkCode: string, baseUrl?: string): string;
}
