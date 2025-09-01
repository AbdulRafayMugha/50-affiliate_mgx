"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
exports.authRoutes = router;
// Public routes
router.post('/register', (0, validation_1.validate)(validation_1.schemas.register), authController_1.register);
router.post('/login', (0, validation_1.validate)(validation_1.schemas.login), authController_1.login);
// Protected routes
router.get('/profile', auth_1.authenticateToken, authController_1.getProfile);
router.get('/verify', auth_1.authenticateToken, authController_1.verifyToken);
// Profile management
router.put('/profile', auth_1.authenticateToken, authController_1.updateProfile);
router.put('/password', auth_1.authenticateToken, authController_1.updatePassword);
// Bank details management
router.get('/bank-details', auth_1.authenticateToken, authController_1.getBankDetails);
router.post('/bank-details', auth_1.authenticateToken, authController_1.createBankDetails);
router.put('/bank-details/:id', auth_1.authenticateToken, authController_1.updateBankDetails);
router.delete('/bank-details/:id', auth_1.authenticateToken, authController_1.deleteBankDetails);
router.put('/bank-details/:id/default', auth_1.authenticateToken, authController_1.setDefaultBankDetails);
//# sourceMappingURL=auth.js.map