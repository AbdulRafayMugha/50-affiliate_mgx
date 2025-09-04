import { Router } from 'express';
import {
  getDashboard,
  getAffiliates,
  getAffiliateDetails,
  updateAffiliateStatus,
  getReferrals,
  getPayments,
  getCommissions,
  sendEmailReferral,
  getEmailReferrals,
  getReferralKey,
  assignAffiliate,
  removeAffiliate,
  registerAffiliate
} from '../controllers/coordinatorController';
import { authenticateToken, requireCoordinator } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication and coordinator role
router.use(authenticateToken, requireCoordinator);

// Dashboard
router.get('/dashboard', getDashboard);

// Affiliate Management
router.get('/affiliates', getAffiliates);
router.get('/affiliates/:affiliateId', getAffiliateDetails);
router.patch('/affiliates/:affiliateId/status', updateAffiliateStatus);

// Referrals
router.get('/referrals', getReferrals);

// Payments
router.get('/payments', getPayments);

// Commissions
router.get('/commissions', getCommissions);

// Email Referrals
router.post('/email-referrals', validate(schemas.emailReferral), sendEmailReferral);
router.get('/email-referrals', getEmailReferrals);

// Referral Key
router.get('/referral-key', getReferralKey);

// Affiliate Registration and Assignment
router.post('/affiliates/register', validate(schemas.register), registerAffiliate);

// Affiliate Assignment (for admin use, but accessible to coordinators for their own assignments)
router.post('/affiliates/:affiliateId/assign', assignAffiliate);
router.delete('/affiliates/:affiliateId/assign', removeAffiliate);

export { router as coordinatorRoutes };
