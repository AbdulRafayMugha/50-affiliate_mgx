"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRoutes = void 0;
const express_1 = require("express");
const transactionController_1 = require("../controllers/transactionController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
exports.transactionRoutes = router;
// Public route for processing transactions (webhook/API)
router.post('/record', (0, validation_1.validate)(validation_1.schemas.transaction), transactionController_1.processPublicTransaction);
// Protected routes
router.post('/', auth_1.authenticateToken, auth_1.requireAffiliate, (0, validation_1.validate)(validation_1.schemas.transaction), transactionController_1.createTransaction);
router.get('/affiliate', auth_1.authenticateToken, auth_1.requireAffiliate, transactionController_1.getTransactionsByAffiliate);
//# sourceMappingURL=transaction.js.map