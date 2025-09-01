"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAffiliateReport = exports.getAffiliateEmailStats = exports.getAffiliateEmailReferrals = exports.deleteAffiliate = exports.updateAffiliateStatus = exports.processAffiliatePayment = exports.getAffiliateCommissions = exports.getAffiliateBankDetails = exports.updateCommissionStatus = exports.getAffiliateDetails = exports.payCommissions = exports.approveCommissions = exports.getPendingCommissions = exports.getTransactions = exports.getAffiliates = exports.getTopAffiliates = exports.getDashboard = void 0;
const User_1 = require("../models/User");
const Transaction_1 = require("../models/Transaction");
const Commission_1 = require("../models/Commission");
const BankDetails_1 = require("../models/BankDetails");
const EmailInvite_1 = require("../models/EmailInvite");
const ReportModel_1 = require("../models/ReportModel");
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
exports.getTopAffiliates = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const topAffiliates = await User_1.UserModel.getTopAffiliates(limit);
    res.json(topAffiliates);
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
    try {
        const [affiliate, commissionStats, referralTree, recentCommissions] = await Promise.all([
            User_1.UserModel.findById(affiliateId),
            Commission_1.CommissionModel.getStats(affiliateId).catch(() => ({ total: 0, pending: 0, paid: 0 })),
            User_1.UserModel.getReferralTree(affiliateId).catch(() => ({ level1: [], level2: [], level3: [], totals: { level1: 0, level2: 0, level3: 0, total: 0 } })),
            Commission_1.CommissionModel.getByAffiliateId(affiliateId, 20).catch(() => [])
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
                created_at: affiliate.created_at,
                is_active: affiliate.is_active
            },
            stats: commissionStats,
            referralTree,
            recentCommissions
        });
    }
    catch (error) {
        console.error('Error fetching affiliate details:', error);
        res.status(500).json({ error: 'Failed to fetch affiliate details' });
    }
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
exports.getAffiliateBankDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { affiliateId } = req.params;
    const bankDetails = await BankDetails_1.BankDetailsModel.getByUserId(affiliateId);
    res.json(bankDetails);
});
exports.getAffiliateCommissions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { affiliateId } = req.params;
    const commissions = await Commission_1.CommissionModel.getByAffiliateId(affiliateId, 50);
    res.json(commissions);
});
exports.processAffiliatePayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { affiliateId } = req.params;
    const { amount, bank_detail_id } = req.body;
    // Verify affiliate exists
    const affiliate = await User_1.UserModel.findById(affiliateId);
    if (!affiliate) {
        return res.status(404).json({ error: 'Affiliate not found' });
    }
    // Verify bank details exist and belong to affiliate
    const bankDetails = await BankDetails_1.BankDetailsModel.getById(bank_detail_id);
    if (!bankDetails || bankDetails.user_id !== affiliateId) {
        return res.status(404).json({ error: 'Bank details not found' });
    }
    // Get pending commissions for this affiliate
    const pendingCommissions = await Commission_1.CommissionModel.getByAffiliateId(affiliateId, 1000);
    const pendingAmount = pendingCommissions
        .filter(c => c.status === 'pending' || c.status === 'approved')
        .reduce((sum, c) => sum + c.amount, 0);
    if (amount > pendingAmount) {
        return res.status(400).json({ error: 'Payment amount exceeds pending commissions' });
    }
    // Mark commissions as paid (this is a simplified version - in production you'd want more sophisticated logic)
    const commissionsToPay = pendingCommissions
        .filter(c => c.status === 'pending' || c.status === 'approved')
        .slice(0, Math.ceil(amount / 10)); // Approximate number of commissions to mark as paid
    const commissionIds = commissionsToPay.map(c => c.id);
    if (commissionIds.length > 0) {
        await Commission_1.CommissionModel.bulkUpdateStatus(commissionIds, 'paid');
    }
    res.json({
        message: 'Payment processed successfully',
        amount_paid: amount,
        commissions_updated: commissionIds.length
    });
});
exports.updateAffiliateStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { affiliateId } = req.params;
    const { isActive } = req.body;
    // Verify affiliate exists
    const affiliate = await User_1.UserModel.findById(affiliateId);
    if (!affiliate) {
        return res.status(404).json({ error: 'Affiliate not found' });
    }
    await User_1.UserModel.updateStatus(affiliateId, isActive);
    res.json({
        message: `Affiliate ${isActive ? 'activated' : 'deactivated'} successfully`,
        isActive
    });
});
exports.deleteAffiliate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { affiliateId } = req.params;
    // Verify affiliate exists
    const affiliate = await User_1.UserModel.findById(affiliateId);
    if (!affiliate) {
        return res.status(404).json({ error: 'Affiliate not found' });
    }
    await User_1.UserModel.deleteUser(affiliateId);
    res.json({
        message: 'Affiliate deleted successfully'
    });
});
exports.getAffiliateEmailReferrals = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { affiliateId } = req.params;
    // Verify affiliate exists
    const affiliate = await User_1.UserModel.findById(affiliateId);
    if (!affiliate) {
        return res.status(404).json({ error: 'Affiliate not found' });
    }
    const emailReferrals = await EmailInvite_1.EmailInviteModel.getByAffiliateId(affiliateId, 100);
    res.json(emailReferrals);
});
exports.getAffiliateEmailStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { affiliateId } = req.params;
    // Verify affiliate exists
    const affiliate = await User_1.UserModel.findById(affiliateId);
    if (!affiliate) {
        return res.status(404).json({ error: 'Affiliate not found' });
    }
    const emailStats = await EmailInvite_1.EmailInviteModel.getStats(affiliateId);
    res.json(emailStats);
});
exports.exportAffiliateReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const buffer = await ReportModel_1.ReportModel.generateExcelReport();
        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="affiliate-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    }
    catch (error) {
        console.error('Error generating Excel report:', error);
        res.status(500).json({ message: 'Failed to generate Excel report' });
    }
});
//# sourceMappingURL=adminController.js.map