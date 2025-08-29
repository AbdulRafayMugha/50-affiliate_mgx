"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.affiliateRoutes = void 0;
const express_1 = require("express");
const affiliateController_1 = require("../controllers/affiliateController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
exports.affiliateRoutes = router;
// All routes require authentication and affiliate role
router.use(auth_1.authenticateToken, auth_1.requireAffiliate);
router.get('/dashboard', affiliateController_1.getDashboard);
router.post('/links', (0, validation_1.validate)(validation_1.schemas.affiliateLink), affiliateController_1.generateReferralLink);
router.get('/links', affiliateController_1.getReferralLinks);
router.post('/email-invite', (0, validation_1.validate)(validation_1.schemas.emailInvite), affiliateController_1.sendEmailInvite);
router.get('/email-invites', affiliateController_1.getEmailInvites);
router.get('/referral-tree', affiliateController_1.getReferralTree);
router.get('/commissions', affiliateController_1.getCommissions);
router.post('/links/:linkCode/click', affiliateController_1.recordLinkClick);
//# sourceMappingURL=affiliate.js.map