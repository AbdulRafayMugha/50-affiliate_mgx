"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordLinkClick = exports.getCommissions = exports.getReferralTree = exports.getEmailInvites = exports.sendEmailInvite = exports.getReferralLinks = exports.generateReferralLink = exports.getDashboard = void 0;
const User_1 = require("../models/User");
const Commission_1 = require("../models/Commission");
const AffiliateLink_1 = require("../models/AffiliateLink");
const EmailInvite_1 = require("../models/EmailInvite");
const errorHandler_1 = require("../middleware/errorHandler");
exports.getDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    // Get affiliate stats
    const [commissionStats, linkStats, emailStats, referralTree, recentCommissions] = await Promise.all([
        Commission_1.CommissionModel.getStats(userId),
        AffiliateLink_1.AffiliateLinkModel.getStats(userId),
        EmailInvite_1.EmailInviteModel.getStats(userId),
        User_1.UserModel.getReferralTree(userId),
        Commission_1.CommissionModel.getByAffiliateId(userId, 10)
    ]);
    // Calculate tier progress
    const totalEarnings = commissionStats.totalEarnings;
    let currentTier = 'Bronze';
    let nextTier = 'Silver';
    let progress = 0;
    let requirement = 'Earn $500 to reach Silver';
    if (totalEarnings >= 5000) {
        currentTier = 'Platinum';
        nextTier = null;
        progress = 100;
        requirement = 'Maximum tier reached';
    }
    else if (totalEarnings >= 2000) {
        currentTier = 'Gold';
        nextTier = 'Platinum';
        progress = ((totalEarnings - 2000) / 3000) * 100;
        requirement = 'Earn $5,000 total to reach Platinum';
    }
    else if (totalEarnings >= 500) {
        currentTier = 'Silver';
        nextTier = 'Gold';
        progress = ((totalEarnings - 500) / 1500) * 100;
        requirement = 'Earn $2,000 total to reach Gold';
    }
    else {
        progress = (totalEarnings / 500) * 100;
    }
    // Update user tier if changed
    if (req.user.tier !== currentTier) {
        await User_1.UserModel.updateTier(userId, currentTier);
    }
    res.json({
        stats: {
            totalEarnings: commissionStats.totalEarnings,
            pendingEarnings: commissionStats.pendingEarnings,
            thisMonthEarnings: commissionStats.thisMonthEarnings,
            totalReferrals: referralTree.totals.total,
            directReferrals: referralTree.totals.level1,
            level2Referrals: referralTree.totals.level2,
            level3Referrals: referralTree.totals.level3,
            conversionRate: linkStats.conversionRate,
            tierProgress: {
                currentTier,
                nextTier,
                progress: Math.round(progress),
                requirement
            }
        },
        recentCommissions: recentCommissions.slice(0, 5),
        linkStats,
        emailStats
    });
});
exports.generateReferralLink = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { custom_code } = req.body;
    try {
        const link = await AffiliateLink_1.AffiliateLinkModel.create(req.user.id, custom_code);
        const referralUrl = AffiliateLink_1.AffiliateLinkModel.generateReferralUrl(link.link_code);
        res.json({
            link: {
                id: link.id,
                code: link.link_code,
                url: referralUrl,
                clicks: link.clicks,
                conversions: link.conversions,
                created_at: link.created_at
            }
        });
    }
    catch (error) {
        if (error.message?.includes('duplicate')) {
            return res.status(409).json({ error: 'Link code already exists' });
        }
        throw error;
    }
});
exports.getReferralLinks = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const links = await AffiliateLink_1.AffiliateLinkModel.getByAffiliateId(req.user.id);
    const linksWithUrls = links.map(link => ({
        id: link.id,
        code: link.link_code,
        url: AffiliateLink_1.AffiliateLinkModel.generateReferralUrl(link.link_code),
        clicks: link.clicks,
        conversions: link.conversions,
        is_active: link.is_active,
        created_at: link.created_at
    }));
    res.json({ links: linksWithUrls });
});
exports.sendEmailInvite = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, name } = req.body;
    // Check if email already invited
    const existingInvites = await EmailInvite_1.EmailInviteModel.getByAffiliateId(req.user.id);
    const alreadyInvited = existingInvites.some(invite => invite.email === email);
    if (alreadyInvited) {
        return res.status(409).json({ error: 'Email already invited' });
    }
    const invite = await EmailInvite_1.EmailInviteModel.create(req.user.id, email, name);
    // Here you would integrate with an email service like SendGrid, Mailgun, etc.
    // For now, we'll just log it
    console.log(`Email referral invite sent to ${email} from ${req.user.email}`);
    res.json({
        message: 'Email referral invite sent successfully',
        invite: {
            id: invite.id,
            email: invite.email,
            name: invite.name,
            status: invite.status,
            invited_at: invite.invited_at,
            expires_at: invite.expires_at
        }
    });
});
exports.getEmailInvites = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const invites = await EmailInvite_1.EmailInviteModel.getByAffiliateId(req.user.id);
    res.json({ invites });
});
exports.getReferralTree = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tree = await User_1.UserModel.getReferralTree(req.user.id);
    res.json({ tree });
});
exports.getCommissions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const commissions = await Commission_1.CommissionModel.getByAffiliateId(req.user.id);
    res.json({ commissions });
});
exports.recordLinkClick = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { linkCode } = req.params;
    await AffiliateLink_1.AffiliateLinkModel.recordClick(linkCode);
    res.json({ message: 'Click recorded successfully' });
});
//# sourceMappingURL=affiliateController.js.map