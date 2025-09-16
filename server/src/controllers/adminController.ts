// src/controllers/adminController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { TransactionModel } from '../models/Transaction';
import { CommissionModel } from '../models/Commission';
import { BankDetailsModel } from '../models/BankDetails';
import { EmailInviteModel } from '../models/EmailInvite';
import { ReportModel } from '../models/ReportModel';
import { asyncHandler } from '../middleware/errorHandler';
import { pool } from '../database/init';
import { RowDataPacket } from 'mysql2';

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [
    totalStats,
    recentTransactions,
    pendingCommissions
  ] = await Promise.all([
    TransactionModel.getTotalStats(),
    TransactionModel.getAll(1, 10),
    CommissionModel.getAllPending(1, 10)
  ]);

  res.json({
    stats: totalStats,
    recentTransactions: recentTransactions.transactions,
    pendingCommissions: pendingCommissions.commissions
  });
});

// Get analytics data for charts and trends
export const getAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const timeRange = (req.query.timeRange as string) || '30d';

  // Calculate date range
  let daysBack = 30;
  if (timeRange === '7d') daysBack = 7;
  else if (timeRange === '90d') daysBack = 90;
  else if (timeRange === '1y') daysBack = 365;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // MySQL/MariaDB: we use ? placeholders and DATE() / DATE_FORMAT for month grouping
  // revenueTrends (daily)
  const [revenueRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      DATE(created_at) AS date,
      COALESCE(SUM(amount), 0) AS revenue,
      COUNT(*) AS transactions
    FROM transactions 
    WHERE status = 'completed' 
      AND created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
    `,
    [startDate]
  );

  // commissionTrends (daily) - paid commissions
  const [commissionRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      DATE(created_at) AS date,
      COALESCE(SUM(amount), 0) AS commissions,
      COUNT(*) AS commission_count
    FROM commissions 
    WHERE status = 'paid'
      AND created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
    `,
    [startDate]
  );

  // registrationTrends (daily) - affiliate signups
  const [registrationRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      DATE(created_at) AS date,
      COUNT(*) AS registrations
    FROM users 
    WHERE role = 'affiliate'
      AND created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
    `,
    [startDate]
  );

  // topAffiliates - affiliates created since startDate (performance)
  const [topAffiliatesRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      u.id,
      u.name,
      u.email,
      COALESCE(SUM(c.amount), 0) AS total_commissions,
      COUNT(DISTINCT t.id) AS total_transactions,
      COALESCE(SUM(t.amount), 0) AS total_revenue
    FROM users u
    LEFT JOIN commissions c ON c.affiliate_id = u.id AND c.status = 'paid'
    LEFT JOIN transactions t ON t.referrer_id = u.id AND t.status = 'completed'
    WHERE u.role = 'affiliate'
      AND u.created_at >= ?
    GROUP BY u.id, u.name, u.email
    ORDER BY total_commissions DESC
    LIMIT 10
    `,
    [startDate]
  );

  // commissionLevels distribution
  const [commissionLevelsRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      level,
      COUNT(*) AS count,
      COALESCE(SUM(amount), 0) AS total_amount
    FROM commissions 
    WHERE status = 'paid'
      AND created_at >= ?
    GROUP BY level
    ORDER BY level ASC
    `,
    [startDate]
  );

  // monthlyRevenue: group by month using DATE_FORMAT (MariaDB / MySQL)
  const [monthlyRevenueRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-01') AS month,
      COALESCE(SUM(amount), 0) AS revenue,
      COUNT(*) AS transactions
    FROM transactions 
    WHERE status = 'completed'
      AND created_at >= ?
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-01')
    ORDER BY month ASC
    `,
    [startDate]
  );

  res.json({
    revenueTrends: revenueRows,
    commissionTrends: commissionRows,
    registrationTrends: registrationRows,
    topAffiliates: topAffiliatesRows,
    commissionLevels: commissionLevelsRows,
    monthlyRevenue: monthlyRevenueRows
  });
});

export const getTopAffiliates = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = parseInt((req.query.limit as string) || '5', 10);
  const topAffiliates = await UserModel.getTopAffiliates(limit);
  res.json(topAffiliates);
});

export const getAffiliates = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);

  const result = await UserModel.getAllAffiliates(page, limit);

  res.json(result);
});

export const getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);

  const result = await TransactionModel.getAll(page, limit);

  res.json(result);
});

export const getPendingCommissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);

  const result = await CommissionModel.getAllPending(page, limit);

  res.json(result);
});

export const approveCommissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { commission_ids } = req.body;

  if (!Array.isArray(commission_ids) || commission_ids.length === 0) {
    return res.status(400).json({ error: 'Commission IDs array is required' });
  }

  await CommissionModel.bulkUpdateStatus(commission_ids, 'approved');

  res.json({ message: `${commission_ids.length} commissions approved successfully` });
});

export const payCommissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { commission_ids } = req.body;

  if (!Array.isArray(commission_ids) || commission_ids.length === 0) {
    return res.status(400).json({ error: 'Commission IDs array is required' });
  }

  await CommissionModel.bulkUpdateStatus(commission_ids, 'paid');

  res.json({ message: `${commission_ids.length} commissions marked as paid successfully` });
});

export const getAffiliateDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { affiliateId } = req.params;

  try {
    const [
      affiliate,
      commissionStats,
      referralTree,
      recentCommissions
    ] = await Promise.all([
      UserModel.findById(affiliateId),
      CommissionModel.getStats(affiliateId).catch(() => ({ totalEarnings: 0, pendingEarnings: 0, thisMonthEarnings: 0 })),
      UserModel.getReferralTree(affiliateId).catch(() => ({ level1: [], level2: [], level3: [], totals: { level1: 0, level2: 0, level3: 0, total: 0 } })),
      CommissionModel.getByAffiliateId(affiliateId, 20).catch(() => [])
    ]);

    if (!affiliate) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    res.json({
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        referral_code: affiliate.referral_code,
        created_at: affiliate.created_at,
        is_active: affiliate.is_active
      },
      stats: commissionStats,
      referralTree,
      recentCommissions
    });
  } catch (error) {
    console.error('Error fetching affiliate details:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate details' });
  }
});

export const updateCommissionStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { commissionId } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'paid', 'cancelled'].includes(String(status))) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  await CommissionModel.updateStatus(commissionId, status as any);

  res.json({ message: 'Commission status updated successfully' });
});

export const getAffiliateBankDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { affiliateId } = req.params;

  const bankDetails = await BankDetailsModel.getByUserId(affiliateId);

  res.json(bankDetails);
});

export const getAffiliateCommissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { affiliateId } = req.params;

  const commissions = await CommissionModel.getByAffiliateId(affiliateId, 50);

  res.json(commissions);
});

export const processAffiliatePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { affiliateId } = req.params;
  const { amount, bank_detail_id } = req.body;

  // Verify affiliate exists
  const affiliate = await UserModel.findById(affiliateId);
  if (!affiliate) {
    return res.status(404).json({ error: 'Affiliate not found' });
  }

  // Verify bank details exist and belong to affiliate
  const bankDetails = await BankDetailsModel.getById(bank_detail_id);
  if (!bankDetails || bankDetails.user_id !== affiliateId) {
    return res.status(404).json({ error: 'Bank details not found' });
  }

  // Get pending commissions for this affiliate (use model to fetch commissions)
  const pendingCommissions = await CommissionModel.getByAffiliateId(affiliateId, 1000);
  const pendingAmount = pendingCommissions
    .filter((c: any) => c.status === 'pending' || c.status === 'approved')
    .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

  if (Number(amount) > pendingAmount) {
    return res.status(400).json({ error: 'Payment amount exceeds pending commissions' });
  }

  // Choose commissions to mark paid (simple greedy approach)
  const commissionsToPay = pendingCommissions
    .filter((c: any) => c.status === 'pending' || c.status === 'approved')
    // sort earliest first (optional)
    .sort((a: any, b: any) => (new Date(a.created_at)).getTime() - (new Date(b.created_at)).getTime());

  const selected: string[] = [];
  let remaining = Number(amount);
  for (const c of commissionsToPay) {
    if (remaining <= 0) break;
    if (c.amount <= remaining + 1e-9) {
      selected.push(c.id);
      remaining -= Number(c.amount);
    } else {
      // if a commission is larger than remaining, you may choose to allow partial or skip.
      // Since your rule is "admin can pay less than or equal to earned" we skip partial splitting here.
      continue;
    }
  }

  if (selected.length > 0) {
    await CommissionModel.bulkUpdateStatus(selected, 'paid');
  }

  res.json({
    message: 'Payment processed successfully',
    amount_paid: Number(amount) - remaining,
    commissions_updated: selected.length
  });
});

export const updateAffiliateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { affiliateId } = req.params;
  const { isActive } = req.body;

  // Verify affiliate exists
  const affiliate = await UserModel.findById(affiliateId);
  if (!affiliate) {
    return res.status(404).json({ error: 'Affiliate not found' });
  }

  await UserModel.updateStatus(affiliateId, Boolean(isActive));

  res.json({
    message: `Affiliate ${isActive ? 'activated' : 'deactivated'} successfully`,
    isActive: Boolean(isActive)
  });
});

export const deleteAffiliate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { affiliateId } = req.params;

  // Verify affiliate exists
  const affiliate = await UserModel.findById(affiliateId);
  if (!affiliate) {
    return res.status(404).json({ error: 'Affiliate not found' });
  }

  await UserModel.deleteUser(affiliateId);

  res.json({
    message: 'Affiliate deleted successfully'
  });
});

export const getAffiliateEmailReferrals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { affiliateId } = req.params;

  // Verify affiliate exists
  const affiliate = await UserModel.findById(affiliateId);
  if (!affiliate) {
    return res.status(404).json({ error: 'Affiliate not found' });
  }

  const emailReferrals = await EmailInviteModel.getByAffiliateId(affiliateId, 100);

  res.json(emailReferrals);
});

export const getAffiliateEmailStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { affiliateId } = req.params;

  // Verify affiliate exists
  const affiliate = await UserModel.findById(affiliateId);
  if (!affiliate) {
    return res.status(404).json({ error: 'Affiliate not found' });
  }

  const emailStats = await EmailInviteModel.getStats(affiliateId);

  res.json(emailStats);
});

export const exportAffiliateReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const buffer = await ReportModel.generateExcelReport();

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="affiliate-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Length', String(buffer.length));

    res.send(buffer);
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({ message: 'Failed to generate Excel report' });
  }
});

// Coordinator Management Endpoints
export const getCoordinators = asyncHandler(async (req: AuthRequest, res: Response) => {
  const coordinators = await UserModel.getAllCoordinators();
  res.json({ coordinators });
});

export const getCoordinatorNetwork = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { coordinatorId } = req.params;

  // Verify coordinator exists
  const coordinator = await UserModel.findById(coordinatorId);
  if (!coordinator || coordinator.role !== 'coordinator') {
    return res.status(404).json({ error: 'Coordinator not found' });
  }

  // Get coordinator's affiliates with their stats
  const affiliatesResult = await UserModel.getAffiliatesByCoordinator(coordinatorId);
  const affiliates = affiliatesResult.affiliates;

  // Get additional stats for each affiliate
  const affiliatesWithStats = await Promise.all(
    affiliates.map(async (affiliate: any) => {
      const [commissionStats, referralCount] = await Promise.all([
        CommissionModel.getStats(affiliate.id).catch(() => ({ totalEarnings: 0, pendingEarnings: 0, thisMonthEarnings: 0 })),
        UserModel.getReferralCount(affiliate.id).catch(() => 0)
      ]);

      return {
        id: affiliate.id,
        name: affiliate.user?.name || affiliate.user?.name || 'N/A',
        email: affiliate.user?.email || 'N/A',
        is_active: affiliate.user?.status === 'active' || affiliate.user?.status === 'Active' || !!affiliate.user?.status,
        // tier may not exist in your DB - show 'N/A' if not available
        tier: (affiliate.tier && affiliate.tier.name) ? affiliate.tier.name : 'N/A',
        referral_count: referralCount,
        commission_earned: Number(commissionStats?.totalEarnings || 0),
        created_at: affiliate.createdAt || affiliate.created_at
      };
    })
  );

  res.json({
    coordinator: {
      id: coordinator.id,
      name: coordinator.name,
      email: coordinator.email,
      is_active: coordinator.is_active,
      created_at: coordinator.created_at,
      affiliate_count: affiliates.length,
      active_affiliate_count: affiliates.filter((a: any) => a.user?.status === 'active' || a.user?.status === 'Active').length,
      total_commissions: affiliatesWithStats.reduce((sum: number, a: any) => sum + Number(a.commission_earned || 0), 0),
      total_referrals: affiliatesWithStats.reduce((sum: number, a: any) => sum + Number(a.referral_count || 0), 0)
    },
    affiliates: affiliatesWithStats
  });
});

export const updateCoordinatorStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { coordinatorId } = req.params;
  const { isActive } = req.body;

  // Verify coordinator exists
  const coordinator = await UserModel.findById(coordinatorId);
  if (!coordinator || coordinator.role !== 'coordinator') {
    return res.status(404).json({ error: 'Coordinator not found' });
  }

  await UserModel.updateStatus(coordinatorId, Boolean(isActive));

  res.json({
    message: `Coordinator ${isActive ? 'activated' : 'deactivated'} successfully`,
    isActive: Boolean(isActive)
  });
});

export const exportCoordinatorReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const buffer = await ReportModel.generateCoordinatorExcelReport();

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="coordinator-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Length', String(buffer.length));

    res.send(buffer);
  } catch (error) {
    console.error('Error generating coordinator Excel report:', error);
    res.status(500).json({ message: 'Failed to generate coordinator Excel report' });
  }
});
