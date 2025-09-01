import { affiliateAPI, transactionAPI, adminAPI } from './api';
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

  //function for Analytics data 
static async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      const [{ data: dashboardData }, topAffiliatesData] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getTopAffiliates(5)
      ]);

      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

      // Transform the data into the required format
      const analyticsData: AnalyticsData = {
        registrations: {
          labels: monthLabels,
          datasets: [{
            label: 'Registrations',
            data: dashboardData.stats.registrationTrends || [],
            backgroundColor: '#3b82f6'
          }]
        },
        commissions: {
          labels: monthLabels,
          datasets: [{
            label: 'Commissions',
            data: dashboardData.stats.commissionTrends?.map(ct => ct.amount) || [],
            backgroundColor: '#10b981'
          }]
        },
        sales: {
          labels: monthLabels,
          datasets: [{
            label: 'Sales',
            data: dashboardData.stats.salesTrends || [],
            backgroundColor: '#f59e42'
          }]
        },
        commissionTrends: dashboardData.stats.commissionTrends || [],
        conversionTrends: dashboardData.stats.conversionTrends || [],
        topAffiliates: topAffiliatesData.data.map(affiliate => ({
          affiliate,
          earnings: affiliate.totalEarnings,
          conversionRate: affiliate.conversionRate
        }))
      };

      return analyticsData;
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      // Return empty analytics data as fallback
      return {
        registrations: { labels: [], datasets: [{ label: 'Registrations', data: [], backgroundColor: '#3b82f6' }] },
        commissions: { labels: [], datasets: [{ label: 'Commissions', data: [], backgroundColor: '#10b981' }] },
        sales: { labels: [], datasets: [{ label: 'Sales', data: [], backgroundColor: '#f59e42' }] },
        commissionTrends: [],
        conversionTrends: [],
        topAffiliates: [
          {
            affiliate: {
              id: '1',
              userId: '1',
              referralCode: 'DEMO1',
              level: 1,
              tier: {
                id: '1',
                name: 'Silver',
                minReferrals: 5,
                minRevenue: 1000,
                commissionBoost: 2,
                bonusAmount: 50,
                benefits: ['Priority Support']
              },
              totalEarnings: 0,
              pendingEarnings: 0,
              totalReferrals: 0,
              activeReferrals: 0,
              conversionRate: 0,
              createdAt: new Date().toISOString()
            },
            earnings: 0,
            conversionRate: 0
          }]
      };
    }
  }

  //mock function for Analytics data 
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await adminAPI.getDashboard();
      const { stats } = response.data;
      console.log('Raw stats from DB:', stats);
      
      // Map the received data to our DashboardStats interface
      return {
        totalSales: Number(stats.totalRevenue) || 0,
        totalCommissions: Number(stats.totalCommissionsPaid) || 0,
        pendingPayouts: Number(stats.pendingCommissions) || 0,
        totalAffiliates: Number(stats.totalAffiliates) || 0,
        activeAffiliates: Number(stats.activeAffiliates) || 0,
        conversionRate: Number(stats.conversionRate) || 0,
        revenueGrowth: Number(stats.revenueGrowth) || 0,
        newSignupsToday: Number(stats.newSignupsToday) || 0,
        revenueGenerated: Number(stats.totalRevenue) || 0,
        commissionTrends: stats.commissionTrends || [],
        conversionTrends: stats.conversionTrends || []
      };
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return empty stats as fallback
      return {
        totalAffiliates: 0,
        activeAffiliates: 0,
        totalSales: 0,
        totalCommissions: 0,
        pendingPayouts: 0,
        conversionRate: 0,
        revenueGrowth: 0,
        newSignupsToday: 0,
        revenueGenerated: 0,
        commissionTrends: [],
        conversionTrends: []
      };
    }
  }

  // Get all affiliates from the database
  static async getAllAffiliates(): Promise<any[]> {
    try {
      const response = await adminAPI.getAffiliates(1, 100); // Get first 100 affiliates
      return response.data.affiliates || [];
    } catch (error) {
      console.error('Failed to fetch all affiliates:', error);
      // Return mock data as fallback
      return [
        {
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
          createdAt: '2024-01-01T00:00:00Z',
          isActive: true,
          user: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        {
          id: 'aff2',
          userId: 'user2',
          referralCode: 'CODE2',
          level: 1,
          tier: {
            id: 'tier2',
            name: 'Gold',
            minReferrals: 10,
            minRevenue: 2500,
            commissionBoost: 3,
            bonusAmount: 100,
            benefits: ['Priority Support', 'Dedicated Manager']
          },
          totalEarnings: 2100,
          pendingEarnings: 150,
          totalReferrals: 15,
          activeReferrals: 12,
          conversionRate: 25,
          createdAt: '2024-01-15T00:00:00Z',
          isActive: true,
          user: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          }
        },
        {
          id: 'aff3',
          userId: 'user3',
          referralCode: 'CODE3',
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
          totalEarnings: 950,
          pendingEarnings: 75,
          totalReferrals: 8,
          activeReferrals: 6,
          conversionRate: 18,
          createdAt: '2024-02-01T00:00:00Z',
          isActive: true,
          user: {
            name: 'Mike Johnson',
            email: 'mike@example.com'
          }
        },
        {
          id: 'aff4',
          userId: 'user4',
          referralCode: 'CODE4',
          level: 1,
          tier: {
            id: 'tier3',
            name: 'Platinum',
            minReferrals: 20,
            minRevenue: 5000,
            commissionBoost: 4,
            bonusAmount: 200,
            benefits: ['Priority Support', 'Dedicated Manager', 'Custom Tools']
          },
          totalEarnings: 3200,
          pendingEarnings: 200,
          totalReferrals: 25,
          activeReferrals: 22,
          conversionRate: 30,
          createdAt: '2024-01-10T00:00:00Z',
          isActive: true,
          user: {
            name: 'Sarah Wilson',
            email: 'sarah@example.com'
          }
        },
        {
          id: 'aff5',
          userId: 'user5',
          referralCode: 'CODE5',
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
          totalEarnings: 750,
          pendingEarnings: 50,
          totalReferrals: 6,
          activeReferrals: 5,
          conversionRate: 16,
          createdAt: '2024-02-15T00:00:00Z',
          isActive: true,
          user: {
            name: 'David Brown',
            email: 'david@example.com'
          }
        }
      ];
    }
  }
  
}