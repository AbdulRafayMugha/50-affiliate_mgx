"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.adminRoutes = router;
// All routes require authentication and admin role
router.use(auth_1.authenticateToken, auth_1.requireAdmin);
router.get('/dashboard', adminController_1.getDashboard);
router.get('/affiliates', adminController_1.getAffiliates);
router.get('/affiliates/:affiliateId', adminController_1.getAffiliateDetails);
router.get('/transactions', adminController_1.getTransactions);
router.get('/commissions/pending', adminController_1.getPendingCommissions);
router.post('/commissions/approve', adminController_1.approveCommissions);
router.post('/commissions/pay', adminController_1.payCommissions);
router.patch('/commissions/:commissionId/status', adminController_1.updateCommissionStatus);
//# sourceMappingURL=admin.js.map