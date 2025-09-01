export interface Transaction {
    id: string;
    customer_email: string;
    amount: number;
    affiliate_link_id?: string;
    referrer_id?: string;
    status: 'pending' | 'completed' | 'cancelled' | 'refunded';
    transaction_type: 'purchase' | 'subscription' | 'upgrade';
    created_at: Date;
    updated_at: Date;
}
export interface CreateTransactionInput {
    customer_email: string;
    amount: number;
    referral_code?: string;
    transaction_type?: 'purchase' | 'subscription' | 'upgrade';
}
export declare class TransactionModel {
    static create(input: CreateTransactionInput): Promise<Transaction>;
    private static createCommissions;
    static getByAffiliateId(affiliateId: string, limit?: number): Promise<any[]>;
    static getAll(page?: number, limit?: number): Promise<{
        transactions: Transaction[];
        total: number;
        totalPages: number;
    }>;
    static getTotalStats(): Promise<{
        totalRevenue: number;
        totalTransactions: number;
        totalCommissionsPaid: number;
        pendingCommissions: number;
        totalAffiliates: number;
        activeAffiliates: number;
        conversionRate: number;
        revenueGrowth: number;
        newSignupsToday: number;
    }>;
}
