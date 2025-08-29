import { Router } from 'express';
import {
  getDashboard,
  getAffiliates,
  getTransactions,
  getPendingCommissions,
  approveCommissions,
  payCommissions,
  getAffiliateDetails,
  updateCommissionStatus,
  getAffiliateBankDetails,
  getAffiliateCommissions,
  processAffiliatePayment,
  updateAffiliateStatus,
  deleteAffiliate,
  getAffiliateEmailReferrals,
  getAffiliateEmailStats,
  exportAffiliateReport
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/affiliates', getAffiliates);
router.get('/affiliates/:affiliateId', getAffiliateDetails);
router.get('/affiliates/:affiliateId/bank-details', getAffiliateBankDetails);
router.get('/affiliates/:affiliateId/commissions', getAffiliateCommissions);
router.post('/affiliates/:affiliateId/payments', processAffiliatePayment);
router.patch('/affiliates/:affiliateId/status', updateAffiliateStatus);
router.delete('/affiliates/:affiliateId', deleteAffiliate);
router.get('/affiliates/:affiliateId/email-referrals', getAffiliateEmailReferrals);
router.get('/affiliates/:affiliateId/email-stats', getAffiliateEmailStats);
router.get('/export-report', exportAffiliateReport);
router.get('/transactions', getTransactions);
router.get('/commissions/pending', getPendingCommissions);
router.post('/commissions/approve', approveCommissions);
router.post('/commissions/pay', payCommissions);
router.patch('/commissions/:commissionId/status', updateCommissionStatus);

export { router as adminRoutes };