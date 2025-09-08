import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { CommissionModel } from '../models/Commission';
import { AffiliateLinkModel } from '../models/AffiliateLink';
import { EmailInviteModel } from '../models/EmailInvite';
import { TransactionModel } from '../models/Transaction';
import { asyncHandler } from '../middleware/errorHandler';

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  
  // Get affiliate stats
  const [
    commissionStats,
    linkStats,
    emailStats,
    referralTree,
    recentCommissions
  ] = await Promise.all([
    CommissionModel.getStats(userId),
    AffiliateLinkModel.getStats(userId),
    EmailInviteModel.getStats(userId),
    UserModel.getReferralTree(userId),
    CommissionModel.getByAffiliateId(userId, 10)
  ]);
  
  // Calculate tier progress
  const totalEarnings = commissionStats.totalEarnings;
  let currentTier = 'Bronze';
  let nextTier = 'Silver';
  let progress = 0;
  let requirement = 'Earn AED 500 to reach Silver';
  
  if (totalEarnings >= 5000) {
    currentTier = 'Platinum';
    nextTier = null;
    progress = 100;
    requirement = 'Maximum tier reached';
  } else if (totalEarnings >= 2000) {
    currentTier = 'Gold';
    nextTier = 'Platinum';
    progress = ((totalEarnings - 2000) / 3000) * 100;
    requirement = 'Earn AED 5,000 total to reach Platinum';
  } else if (totalEarnings >= 500) {
    currentTier = 'Silver';
    nextTier = 'Gold';
    progress = ((totalEarnings - 500) / 1500) * 100;
    requirement = 'Earn AED 2,000 total to reach Gold';
  } else {
    progress = (totalEarnings / 500) * 100;
  }
  
  // Update user tier if changed
  if (req.user.tier !== currentTier) {
    await UserModel.updateTier(userId, currentTier as any);
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

export const generateReferralLink = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { custom_code } = req.body;
  
  try {
    const link = await AffiliateLinkModel.create(req.user.id, custom_code);
    const referralUrl = AffiliateLinkModel.generateReferralUrl(link.link_code);
    
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
  } catch (error: any) {
    if (error.message?.includes('duplicate')) {
      return res.status(409).json({ error: 'Link code already exists' });
    }
    throw error;
  }
});

export const getReferralLinks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const links = await AffiliateLinkModel.getByAffiliateId(req.user.id);
  
  const linksWithUrls = links.map(link => ({
    id: link.id,
    code: link.link_code,
    url: AffiliateLinkModel.generateReferralUrl(link.link_code),
    clicks: link.clicks,
    conversions: link.conversions,
    is_active: link.is_active,
    created_at: link.created_at
  }));
  
  res.json({ links: linksWithUrls });
});

export const sendEmailInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, name } = req.body;
  
  // Check if email already invited
  const existingInvites = await EmailInviteModel.getByAffiliateId(req.user.id);
  const alreadyInvited = existingInvites.some(invite => invite.email === email);
  
  if (alreadyInvited) {
    return res.status(409).json({ error: 'Email already invited' });
  }
  
  const invite = await EmailInviteModel.create(req.user.id, email, name);
  
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

export const getEmailInvites = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invites = await EmailInviteModel.getByAffiliateId(req.user.id);
  
  res.json({ invites });
});

export const getReferralTree = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tree = await UserModel.getReferralTree(req.user.id);
  
  res.json({ tree });
});

export const getCommissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const commissions = await CommissionModel.getByAffiliateId(req.user.id);
  
  res.json({ commissions });
});

export const recordLinkClick = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { linkCode } = req.params;
  
  await AffiliateLinkModel.recordClick(linkCode);
  
  res.json({ message: 'Click recorded successfully' });
});