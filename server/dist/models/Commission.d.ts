export interface Commission {
    id: string;
    affiliate_id: string;
    transaction_id: string;
    level: 1 | 2 | 3;
    amount: number;
    rate: number;
    status: 'pending' | 'approved' | 'paid' | 'cancelled';
    paid_at?: Date;
    created_at: Date;
    updated_at: Date;
}
export declare class CommissionModel {
    static getByAffiliateId(affiliateId: string, limit?: number): Promise<any[]>;
    static getStats(affiliateId: string): Promise<{
        totalEarnings: number;
        pendingEarnings: number;
        thisMonthEarnings: number;
        commissionsByLevel: {
            level1: number;
            level2: number;
            level3: number;
        };
    }>;
    static updateStatus(commissionId: string, status: Commission['status']): Promise<void>;
    static bulkUpdateStatus(commissionIds: string[], status: Commission['status']): Promise<void>;
    static getAllPending(page?: number, limit?: number): Promise<{
        commissions: any[];
        total: number;
        totalPages: number;
    }>;
    static getCommissionsByCoordinator(coordinatorId: string, page?: number, limit?: number): Promise<{
        commissions: any[];
        total: number;
        totalPages: number;
    }>;
}
