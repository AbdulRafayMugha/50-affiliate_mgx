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
  exportAffiliateReport,
  getTopAffiliates,
  getCoordinators,
  getCoordinatorNetwork,
  updateCoordinatorStatus,
  exportCoordinatorReport
} from '../controllers/adminController';
import {
  getCommissionLevels,
  getCommissionLevel,
  createCommissionLevel,
  updateCommissionLevel,
  deleteCommissionLevel,
  toggleCommissionLevel,
  getCommissionSettings,
  updateCommissionSettings,
  resetToDefaults,
  calculateCommissions
} from '../controllers/commissionController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/top-affiliates', getTopAffiliates);
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

// Commission Level Management Routes (Admin Only)
router.post('/commission-levels', createCommissionLevel);
router.put('/commission-levels/:id', updateCommissionLevel);
router.delete('/commission-levels/:id', deleteCommissionLevel);
router.patch('/commission-levels/:id/toggle', toggleCommissionLevel);

// Commission Settings Routes (Admin Only)
router.put('/commission-settings', updateCommissionSettings);

// Commission Utility Routes (Admin Only)
router.post('/commission-levels/reset', resetToDefaults);
router.post('/commission-calculator', calculateCommissions);

// Coordinator Management Routes (Admin Only)
router.get('/coordinators', getCoordinators);
router.get('/coordinators/:coordinatorId/network', getCoordinatorNetwork);
router.patch('/coordinators/:coordinatorId/status', updateCoordinatorStatus);
router.get('/coordinators/export-report', exportCoordinatorReport);

export { router as adminRoutes };