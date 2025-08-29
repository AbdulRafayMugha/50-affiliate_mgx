import { Router } from 'express';
import {
  getDashboard,
  generateReferralLink,
  getReferralLinks,
  sendEmailInvite,
  getEmailInvites,
  getReferralTree,
  getCommissions,
  recordLinkClick
} from '../controllers/affiliateController';
import { authenticateToken, requireAffiliate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication and affiliate role
router.use(authenticateToken, requireAffiliate);

router.get('/dashboard', getDashboard);
router.post('/links', validate(schemas.affiliateLink), generateReferralLink);
router.get('/links', getReferralLinks);
router.post('/email-invite', validate(schemas.emailInvite), sendEmailInvite);
router.get('/email-invites', getEmailInvites);
router.get('/referral-tree', getReferralTree);
router.get('/commissions', getCommissions);
router.post('/links/:linkCode/click', recordLinkClick);

export { router as affiliateRoutes };