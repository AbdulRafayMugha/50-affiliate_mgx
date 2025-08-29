import { affiliateAPI, transactionAPI } from './api';
import type { 
  AffiliateStats, 
  EmailLead, 
  Commission, 
  Bonus ,
  AnalyticsData ,
  DashboardStats
} from '../types';

export class DataService {
  // Replace mock data with real API calls
  static async getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
    try {
      const response = await affiliateAPI.getDashboard();
      return response.data.stats;
    } catch (error) {
      console.error('Failed to fetch affiliate stats:', error);
      // Return mock data as fallback
      return {
        totalEarnings: 2450.75,
        pendingEarnings: 325.50,
        thisMonthEarnings: 890.25,
        totalReferrals: 12,
        directReferrals: 8,
        level2Referrals: 3,
        level3Referrals: 1,
        conversionRate: 18.5,
        clickThroughRate: 22.3,
        tierProgress: {
          currentTier: 'Silver',
          nextTier: 'Gold',
          progress: 72,
          requirement: 'Earn $2,000 total to reach Gold'
        }
      };
    }
  }

  static async getCommissions(affiliateId: string): Promise<Commission[]> {
    try {
      const response = await affiliateAPI.getCommissions();
      return response.data.commissions.map((comm: Record<string, unknown>) => ({
        id: comm.id,
        amount: parseFloat(comm.amount as string),
        level: comm.level,
        status: comm.status,
        createdAt: comm.created_at,
        transactionId: comm.transaction_id
      }));
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
      // Return mock data as fallback
      return [
        {
          id: '1',
          amount: 45.00,
          level: 1,
          status: 'paid',
          createdAt: '2024-01-15T10:30:00Z',
          saleId: 'tx1',
          affiliateId: 'aff1',
          rate: 10
        },
        {
          id: '2',
          amount: 25.00,
          level: 2,
          status: 'pending',
          createdAt: '2024-01-14T14:20:00Z',
          saleId: 'tx2',
          affiliateId: 'aff2',
          rate: 5
        }
      ];
    }
  }

  static async getEmailLeads(affiliateId: string): Promise<EmailLead[]> {
    try {
      const response = await affiliateAPI.getEmailInvites();
      return response.data.invites.map((invite: Record<string, unknown>) => ({
        id: invite.id,
        email: invite.email,
        status: invite.status,
        invitedAt: invite.sent_at,
        clickedAt: invite.clicked_at,
        convertedAt: invite.converted_at
      }));
    } catch (error) {
      console.error('Failed to fetch email invites:', error);
      return [];
    }
  }

  static async getBonuses(affiliateId: string): Promise<Bonus[]> {
    try {
      // This would be a real API call when bonuses endpoint is implemented
      return [
        {
          id: '1',
          affiliateId:affiliateId,
          type: 'signup',
          description: 'Welcome bonus for joining as affiliate',
          amount: 10.00,
          status: 'paid',
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];
    } catch (error) {
      console.error('Failed to fetch bonuses:', error);
      return [];
    }
  }

  static async generateReferralLink(affiliateId: string): Promise<string> {
    try {
      const response = await affiliateAPI.getReferralLinks();
      const links = response.data.links;
      
      if (links.length > 0) {
        return links[0].url;
      }
      
      // Generate new link if none exists
      const newLinkResponse = await affiliateAPI.generateReferralLink();
      return newLinkResponse.data.link.url;
    } catch (error) {
      console.error('Failed to generate referral link:', error);
      return 'http://localhost:5173?ref=DEMO123';
    }
  }

  static async sendEmailInvite(affiliateId: string, email: string, message: string): Promise<boolean> {
    try {
      await affiliateAPI.sendEmailInvite(email, message);
      return true;
    } catch (error) {
      console.error('Failed to send email invite:', error);
      return false;
    }
  }

  // Mock function for demo purchases
  static async createDemoTransaction(amount: number, referralCode?: string): Promise<Record<string, unknown>> {
    try {
      const response = await transactionAPI.recordPublic({
        customer_email: `customer${Date.now()}@example.com`,
        amount,
        referral_code: referralCode,
        transaction_type: 'purchase'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create demo transaction:', error);
      throw error;
    }
  }

  //mock function for Analytics data 
static async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      // Replace with real API call if available
      // Example mock data:
      return {
        registrations: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [
            { label: 'Registrations', data: [10, 20, 15, 30], backgroundColor: '#3b82f6' }
          ]
        },
        commissions: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [
            { label: 'Commissions', data: [100, 200, 150, 300], backgroundColor: '#10b981' }
          ]
        },
        sales: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [
            { label: 'Sales', data: [1000, 2000, 1500, 3000], backgroundColor: '#f59e42' }
          ]
        },
        topAffiliates: [
          {
            affiliate: {
              id: 'aff1',
              userId: 'user1',
              referralCode: 'CODE1',
              level: 1,
              tier: {
                id: 'tier1',
                name: 'Silver',
                minReferrals: 5,
                minRevenue: 1000,
                commissionBoost: 2,
                bonusAmount: 50,
                benefits: ['Priority Support']
              },
              totalEarnings: 1200,
              pendingEarnings: 100,
              totalReferrals: 10,
              activeReferrals: 8,
              conversionRate: 20,
              createdAt: '2024-01-01T00:00:00Z'
            },
            earnings: 1200,
            referrals: 10
          }
        ]
      };
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      // Return empty mock data as fallback
      return {
        registrations: { labels: [], datasets: [] },
        commissions: { labels: [], datasets: [] },
        sales: { labels: [], datasets: [] },
        topAffiliates: []
      };
    }
  }

  //mock function for Analytics data 
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Replace with real API call if available
      // Example mock data:
      return {
        totalAffiliates: 120,
        activeAffiliates: 95,
        totalSales: 15000,
        totalCommissions: 3200,
        pendingPayouts: 450,
        conversionRate: 18.5,
        revenueGrowth: 12.3,
        newSignupsToday: 7
      };
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return empty mock data as fallback
      return {
        totalAffiliates: 0,
        activeAffiliates: 0,
        totalSales: 0,
        totalCommissions: 0,
        pendingPayouts: 0,
        conversionRate: 0,
        revenueGrowth: 0,
        newSignupsToday: 0
      };
    }
  }
  
}