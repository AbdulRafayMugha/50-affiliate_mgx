import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { TransactionModel } from '../models/Transaction';
import { CommissionModel } from '../models/Commission';
import { BankDetailsModel } from '../models/BankDetails';
import { EmailReferralModel } from '../models/EmailReferral';
import { ReportModel } from '../models/ReportModel';
import { asyncHandler } from '../middleware/errorHandler';

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

export const getAffiliates = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await UserModel.getAllAffiliates(page, limit);
  
  res.json(result);
});

export const getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await TransactionModel.getAll(page, limit);
  
  res.json(result);
});

export const getPendingCommissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
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
      CommissionModel.getStats(affiliateId).catch(() => ({ total: 0, pending: 0, paid: 0 })),
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
        tier: affiliate.tier,
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
  
  if (!['pending', 'approved', 'paid', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  await CommissionModel.updateStatus(commissionId, status);
  
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
  
  // Get pending commissions for this affiliate
  const pendingCommissions = await CommissionModel.getByAffiliateId(affiliateId, 1000);
  const pendingAmount = pendingCommissions
    .filter(c => c.status === 'pending' || c.status === 'approved')
    .reduce((sum, c) => sum + c.amount, 0);
  
  if (amount > pendingAmount) {
    return res.status(400).json({ error: 'Payment amount exceeds pending commissions' });
  }
  
  // Mark commissions as paid (this is a simplified version - in production you'd want more sophisticated logic)
  const commissionsToPay = pendingCommissions
    .filter(c => c.status === 'pending' || c.status === 'approved')
    .slice(0, Math.ceil(amount / 10)); // Approximate number of commissions to mark as paid
  
  const commissionIds = commissionsToPay.map(c => c.id);
  if (commissionIds.length > 0) {
    await CommissionModel.bulkUpdateStatus(commissionIds, 'paid');
  }
  
  res.json({ 
    message: 'Payment processed successfully',
    amount_paid: amount,
    commissions_updated: commissionIds.length
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
  
  await UserModel.updateStatus(affiliateId, isActive);
  
  res.json({ 
    message: `Affiliate ${isActive ? 'activated' : 'deactivated'} successfully`,
    isActive
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
  
  const emailReferrals = await EmailReferralModel.getByAffiliateId(affiliateId, 100);
  
  res.json(emailReferrals);
});

export const getAffiliateEmailStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { affiliateId } = req.params;
  
  // Verify affiliate exists
  const affiliate = await UserModel.findById(affiliateId);
  if (!affiliate) {
    return res.status(404).json({ error: 'Affiliate not found' });
  }
  
  const emailStats = await EmailReferralModel.getStats(affiliateId);
  
  res.json(emailStats);
});

export const exportAffiliateReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const buffer = await ReportModel.generateExcelReport();
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="affiliate-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({ message: 'Failed to generate Excel report' });
  }
});