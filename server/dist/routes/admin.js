"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const commissionController_1 = require("../controllers/commissionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.adminRoutes = router;
// All routes require authentication and admin role
router.use(auth_1.authenticateToken, auth_1.requireAdmin);
router.get('/dashboard', adminController_1.getDashboard);
router.get('/top-affiliates', adminController_1.getTopAffiliates);
router.get('/affiliates', adminController_1.getAffiliates);
router.get('/affiliates/:affiliateId', adminController_1.getAffiliateDetails);
router.get('/affiliates/:affiliateId/bank-details', adminController_1.getAffiliateBankDetails);
router.get('/affiliates/:affiliateId/commissions', adminController_1.getAffiliateCommissions);
router.post('/affiliates/:affiliateId/payments', adminController_1.processAffiliatePayment);
router.patch('/affiliates/:affiliateId/status', adminController_1.updateAffiliateStatus);
router.delete('/affiliates/:affiliateId', adminController_1.deleteAffiliate);
router.get('/affiliates/:affiliateId/email-referrals', adminController_1.getAffiliateEmailReferrals);
router.get('/affiliates/:affiliateId/email-stats', adminController_1.getAffiliateEmailStats);
router.get('/export-report', adminController_1.exportAffiliateReport);
router.get('/transactions', adminController_1.getTransactions);
router.get('/commissions/pending', adminController_1.getPendingCommissions);
router.post('/commissions/approve', adminController_1.approveCommissions);
router.post('/commissions/pay', adminController_1.payCommissions);
router.patch('/commissions/:commissionId/status', adminController_1.updateCommissionStatus);
// Commission Level Management Routes (Admin Only)
router.post('/commission-levels', commissionController_1.createCommissionLevel);
router.put('/commission-levels/:id', commissionController_1.updateCommissionLevel);
router.delete('/commission-levels/:id', commissionController_1.deleteCommissionLevel);
router.patch('/commission-levels/:id/toggle', commissionController_1.toggleCommissionLevel);
// Commission Settings Routes (Admin Only)
router.put('/commission-settings', commissionController_1.updateCommissionSettings);
// Commission Utility Routes (Admin Only)
router.post('/commission-levels/reset', commissionController_1.resetToDefaults);
router.post('/commission-calculator', commissionController_1.calculateCommissions);
//# sourceMappingURL=admin.js.map