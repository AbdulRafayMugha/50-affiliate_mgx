import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { CommissionModel } from '../models/Commission';
import { TransactionModel } from '../models/Transaction';
import { EmailReferralModel } from '../models/EmailReferral';
import { asyncHandler } from '../middleware/errorHandler';

// Dashboard overview
export const getDashboard = asyncHandler(async (req: any, res: Response) => {
  const coordinatorId = req.user.id;
  
  const stats = await UserModel.getCoordinatorStats(coordinatorId);
  
  res.json({
    stats: {
      totalAffiliates: parseInt(stats.total_affiliates),
      activeAffiliates: parseInt(stats.active_affiliates),
      totalCommissions: parseFloat(stats.total_commissions),
      pendingCommissions: parseFloat(stats.pending_commissions),
      totalReferrals: parseInt(stats.total_referrals)
    }
  });
});

// Get affiliates assigned to this coordinator
export const getAffiliates = asyncHandler(async (req: any, res: Response) => {
  const coordinatorId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await UserModel.getAffiliatesByCoordinator(coordinatorId, page, limit);
  
  res.json(result);
});

// Get affiliate details (only for affiliates assigned to this coordinator)
export const getAffiliateDetails = asyncHandler(async (req: any, res: Response) => {
  const coordinatorId = req.user.id;
  const { affiliateId } = req.params;
  
  // Verify the affiliate is assigned to this coordinator
  const affiliate = await UserModel.findById(affiliateId);
  if (!affiliate || affiliate.role !== 'affiliate' || affiliate.coordinator_id !== coordinatorId) {
    return res.status(404).json({ error: 'Affiliate not found or not assigned to you' });
  }
  
  // Get affiliate details with stats
  const referralTree = await UserModel.getReferralTree(affiliateId);
  
  res.json({
    affiliate: {
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email,
      // tier: affiliate.tier,
      isActive: affiliate.is_active,
      referralCode: affiliate.referral_code,
      createdAt: affiliate.created_at
    },
    referralTree
  });
});

// Update affiliate status (only for affiliates assigned to this coordinator)
export const updateAffiliateStatus = asyncHandler(async (req: any, res: Response) => {
  const coordinatorId = req.user.id;
  const { affiliateId } = req.params;
  const { isActive } = req.body;
  
  // Verify the affiliate is assigned to this coordinator
  const affiliate = await UserModel.findById(affiliateId);
  if (!affiliate || affiliate.role !== 'affiliate' || affiliate.coordinator_id !== coordinatorId) {
    return res.status(404).json({ error: 'Affiliate not found or not assigned to you' });
  }
  
  await UserModel.updateStatus(affiliateId, isActive);
  
  res.json({ message: 'Affiliate status updated successfully' });
});

// Get referrals made by affiliates assigned to this coordinator
export const getReferrals = asyncHandler(async (req: any, res: Response) => {
  const coordinatorId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await UserModel.getCoordinatorReferrals(coordinatorId, page, limit);
  
  res.json(result);
});

// Get payments related to coordinator's affiliates
export const getPayments = asyncHandler(async (req: any, res: Response) => {
  const coordinatorId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  // Get commissions for affiliates assigned to this coordinator
  const result = await CommissionModel.getCommissionsByCoordinator(coordinatorId, page, limit);
  
  res.json(result);
});

// Get commissions for coordinator's network
export const getCommissions = asyncHandler(async (req: any, res: Response) => {
  const coordinatorId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await CommissionModel.getCommissionsByCoordinator(coordinatorId, page, limit);
  
  res.json(result);
});

// Send email referrals to coordinator's affiliates/clients
export const sendEmailReferral = asyncHandler(async (req: any, res: Response) => {
  const coordinatorId = req.user.id;
  const { email, name, message } = req.body;
  
  // Create email referral record
  const emailReferral = await EmailReferralModel.create({
    affiliate_id: coordinatorId, // Coordinator's own referral
    email,
    name,
    message,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  });
  
  res.status(201).json({
    message: 'Email referral sent successfully',
    emailReferral
  });
});

// Get email referrals sent by coordinator
export const getEmailReferrals = asyncHandler(async (req: any, res: Response) => {
  const coordinatorId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await EmailReferralModel.getByAffiliateId(coordinatorId, page, limit);
  
  res.json(result);
});

// Get coordinator's own referral key
export const getReferralKey = asyncHandler(async (req: any, res: Response) => {
  const coordinatorId = req.user.id;
  
  const user = await UserModel.findById(coordinatorId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    referralCode: user.referral_code
  });
});

// Assign affiliate to coordinator (admin only, but included for completeness)
export const assignAffiliate = asyncHandler(async (req: any, res: Response) => {
  const { affiliateId } = req.params;
  const coordinatorId = req.user.id;
  
  // Verify the affiliate exists and is not already assigned
  const affiliate = await UserModel.findById(affiliateId);
  if (!affiliate || affiliate.role !== 'affiliate') {
    return res.status(404).json({ error: 'Affiliate not found' });
  }
  
  if (affiliate.coordinator_id) {
    return res.status(400).json({ error: 'Affiliate is already assigned to a coordinator' });
  }
  
  await UserModel.assignAffiliateToCoordinator(affiliateId, coordinatorId);
  
  res.json({ message: 'Affiliate assigned successfully' });
});

// Remove affiliate from coordinator (admin only)
export const removeAffiliate = asyncHandler(async (req: any, res: Response) => {
  const { affiliateId } = req.params;
  
  await UserModel.removeAffiliateFromCoordinator(affiliateId);
  
  res.json({ message: 'Affiliate removed from coordinator successfully' });
});

// Register new affiliate (coordinator can add affiliates to their network)
export const registerAffiliate = asyncHandler(async (req: any, res: Response) => {
  const coordinatorId = req.user.id;
  const { name, email, password } = req.body;
  
  // Check if user already exists
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists with this email' });
  }
  
  // Create affiliate and assign to coordinator
  const affiliate = await UserModel.create({
    email,
    password,
    name,
    role: 'affiliate',
    created_by_coordinator: coordinatorId
  });
  
  res.status(201).json({
    message: 'Affiliate registered successfully and assigned to your network',
    affiliate: {
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email,
      referral_code: affiliate.referral_code,
      // tier: affiliate.tier
    }
  });
});
