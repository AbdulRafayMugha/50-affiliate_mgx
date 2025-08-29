"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommissionStatus = exports.getAffiliateDetails = exports.payCommissions = exports.approveCommissions = exports.getPendingCommissions = exports.getTransactions = exports.getAffiliates = exports.getDashboard = void 0;
const User_1 = require("../models/User");
const Transaction_1 = require("../models/Transaction");
const Commission_1 = require("../models/Commission");
const errorHandler_1 = require("../middleware/errorHandler");
exports.getDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const [totalStats, recentTransactions, pendingCommissions] = await Promise.all([
        Transaction_1.TransactionModel.getTotalStats(),
        Transaction_1.TransactionModel.getAll(1, 10),
        Commission_1.CommissionModel.getAllPending(1, 10)
    ]);
    res.json({
        stats: totalStats,
        recentTransactions: recentTransactions.transactions,
        pendingCommissions: pendingCommissions.commissions
    });
});
exports.getAffiliates = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await User_1.UserModel.getAllAffiliates(page, limit);
    res.json(result);
});
exports.getTransactions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await Transaction_1.TransactionModel.getAll(page, limit);
    res.json(result);
});
exports.getPendingCommissions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await Commission_1.CommissionModel.getAllPending(page, limit);
    res.json(result);
});
exports.approveCommissions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { commission_ids } = req.body;
    if (!Array.isArray(commission_ids) || commission_ids.length === 0) {
        return res.status(400).json({ error: 'Commission IDs array is required' });
    }
    await Commission_1.CommissionModel.bulkUpdateStatus(commission_ids, 'approved');
    res.json({ message: `${commission_ids.length} commissions approved successfully` });
});
exports.payCommissions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { commission_ids } = req.body;
    if (!Array.isArray(commission_ids) || commission_ids.length === 0) {
        return res.status(400).json({ error: 'Commission IDs array is required' });
    }
    await Commission_1.CommissionModel.bulkUpdateStatus(commission_ids, 'paid');
    res.json({ message: `${commission_ids.length} commissions marked as paid successfully` });
});
exports.getAffiliateDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { affiliateId } = req.params;
    const [affiliate, commissionStats, referralTree, recentCommissions] = await Promise.all([
        User_1.UserModel.findById(affiliateId),
        Commission_1.CommissionModel.getStats(affiliateId),
        User_1.UserModel.getReferralTree(affiliateId),
        Commission_1.CommissionModel.getByAffiliateId(affiliateId, 20)
    ]);
    if (!affiliate) {
        return res.status(404).json({ error: 'Affiliate not found' });
    }
    res.json({
        affiliate: {
            id: affiliate.id,
            name: affiliate.name,
            email: affiliate.email,
            tier: affiliate.tier,
            referral_code: affiliate.referral_code,
            created_at: affiliate.created_at
        },
        stats: commissionStats,
        referralTree,
        recentCommissions
    });
});
exports.updateCommissionStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { commissionId } = req.params;
    const { status } = req.body;
    if (!['pending', 'approved', 'paid', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    await Commission_1.CommissionModel.updateStatus(commissionId, status);
    res.json({ message: 'Commission status updated successfully' });
});
//# sourceMappingURL=adminController.js.map