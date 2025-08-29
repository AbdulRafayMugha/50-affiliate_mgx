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
//# sourceMappingURL=auth.js.map