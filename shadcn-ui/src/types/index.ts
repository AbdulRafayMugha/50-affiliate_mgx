// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'affiliate' | 'client';
  avatar?: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'pending';
}

// Affiliate Types
export interface Affiliate {
  id: string;
  userId: string;
  referralCode: string;
  parentAffiliateId?: string;
  level: number;
  tier: AffiliateTier;
  totalEarnings: number;
  pendingEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  createdAt: string;
  user?: User;
  directReferrals?: number;
  level2Referrals?: number;
  level3Referrals?: number;
}

export interface AffiliateTier {
  id: string;
  name: string;
  minReferrals: number;
  minRevenue: number;
  commissionBoost: number;
  bonusAmount: number;
  benefits: string[];
}

// Commission Types
export interface Commission {
  id: string;
  affiliateId: string;
  saleId: string;
  level: 1 | 2 | 3;
  amount: number;
  rate: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  affiliate?: Affiliate;
  sale?: Sale;
}

// Sale Types
export interface Sale {
  id: string;
  clientEmail: string;
  clientName: string;
  amount: number;
  currency: string;
  referralCode?: string;
  affiliateId?: string;
  status: 'completed' | 'refunded' | 'cancelled';
  createdAt: string;
  odooInvoiceId?: string;
}

// Email Lead Types
export interface EmailLead {
  id: string;
  email: string;
  affiliateId: string;
  status: 'invited' | 'confirmed' | 'converted' | 'expired';
  invitedAt: string;
  confirmedAt?: string;
  convertedAt?: string;
  expiresAt: string;
  conversionValue?: number;
}

// Email Referral Types
export interface EmailReferral {
  id: string;
  affiliate_id: string;
  email: string;
  name?: string;
  status: 'invited' | 'confirmed' | 'converted' | 'expired';
  invited_at: string;
  confirmed_at?: string;
  converted_at?: string;
  expires_at: string;
  conversion_value?: number;
  created_at: string;
  updated_at: string;
}

// Bonus Types
export interface Bonus {
  id: string;
  affiliateId: string;
  type: 'signup' | 'milestone' | 'tier_upgrade' | 'streak' | 'conversion';
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'paid';
  createdAt: string;
  paidAt?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalSales: number;
  totalCommissions: number;
  pendingPayouts: number;
  conversionRate: number;
  revenueGrowth: number;
  newSignupsToday: number;
  revenueGenerated: number;
  commissionTrends?: {
    date: string;
    amount: number;
  }[];
  conversionTrends?: {
    date: string;
    rate: number;
  }[];
}

export interface AffiliateStats {
  totalEarnings: number;
  pendingEarnings: number;
  thisMonthEarnings: number;
  totalReferrals: number;
  directReferrals: number;
  level2Referrals: number;
  level3Referrals: number;
  conversionRate: number;
  clickThroughRate: number;
  tierProgress: {
    currentTier: string;
    nextTier?: string;
    progress: number;
    requirement: string;
  };
}

// Analytics Types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

export interface AnalyticsData {
  registrations?: ChartData;
  commissions?: ChartData;
  sales?: ChartData;
  commissionTrends?: {
    date: string;
    amount: number;
  }[];
  conversionTrends?: {
    date: string;
    rate: number;
  }[];
  topAffiliates: {
    affiliate: Affiliate;
    earnings: number;
    conversionRate: number;
  }[];
}

// Bank Details Types
export interface BankDetails {
  id: string;
  user_id: string;
  payment_method: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto' | 'check';
  account_name: string;
  account_number?: string;
  routing_number?: string;
  bank_name?: string;
  paypal_email?: string;
  stripe_account_id?: string;
  crypto_wallet_address?: string;
  crypto_currency?: string;
  check_payable_to?: string;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}