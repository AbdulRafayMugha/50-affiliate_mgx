"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPublicTransaction = exports.getTransactionsByAffiliate = exports.createTransaction = void 0;
const Transaction_1 = require("../models/Transaction");
const errorHandler_1 = require("../middleware/errorHandler");
exports.createTransaction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { customer_email, amount, referral_code, transaction_type } = req.body;
    const transaction = await Transaction_1.TransactionModel.create({
        customer_email,
        amount,
        referral_code,
        transaction_type
    });
    res.status(201).json({
        message: 'Transaction created successfully',
        transaction: {
            id: transaction.id,
            customer_email: transaction.customer_email,
            amount: transaction.amount,
            status: transaction.status,
            transaction_type: transaction.transaction_type,
            created_at: transaction.created_at
        }
    });
});
exports.getTransactionsByAffiliate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const transactions = await Transaction_1.TransactionModel.getByAffiliateId(req.user.id);
    res.json({ transactions });
});
// Public endpoint for processing purchases with referral codes
exports.processPublicTransaction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { customer_email, amount, referral_code, transaction_type } = req.body;
    // Validate required fields
    if (!customer_email || !amount) {
        return res.status(400).json({ error: 'Customer email and amount are required' });
    }
    if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
    }
    const transaction = await Transaction_1.TransactionModel.create({
        customer_email,
        amount,
        referral_code,
        transaction_type
    });
    res.status(201).json({
        message: 'Purchase processed successfully',
        transaction_id: transaction.id,
        amount: transaction.amount,
        status: transaction.status
    });
});
//# sourceMappingURL=transactionController.js.map