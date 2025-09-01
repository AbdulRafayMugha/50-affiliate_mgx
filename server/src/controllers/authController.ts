import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { BankDetailsModel } from '../models/BankDetails';
import { asyncHandler } from '../middleware/errorHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role, referrer_code } = req.body;
  
  // Check if user already exists
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists with this email' });
  }
  
  // Validate referrer code if provided
  if (referrer_code) {
    const referrer = await UserModel.findByReferralCode(referrer_code);
    if (!referrer) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }
  }
  
  // Create user
  const user = await UserModel.create({
    email,
    password,
    name,
    role,
    referrer_code
  });
  
  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    jwtSecret as string,
    { expiresIn: '7d' }
  );
  
  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      referral_code: user.referral_code,
      tier: user.tier
    },
    token
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // Verify user credentials
  const user = await UserModel.verifyPassword(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    jwtSecret as string,
    { expiresIn: '7d' }
  );
  
  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      referral_code: user.referral_code,
      tier: user.tier
    },
    token
  });
});

export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const user = await UserModel.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      referral_code: user.referral_code,
      tier: user.tier,
      created_at: user.created_at
    }
  });
});

export const verifyToken = asyncHandler(async (req: any, res: Response) => {
  // Token is already verified by middleware
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      referral_code: req.user.referral_code,
      tier: req.user.tier
    }
  });
});

export const updateProfile = asyncHandler(async (req: any, res: Response) => {
  const { name, email } = req.body;
  
  // Check if email is being changed and if it's already taken
  if (email && email !== req.user.email) {
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(409).json({ error: 'Email already in use' });
    }
  }
  
  const updatedUser = await UserModel.updateProfile(req.user.id, { name, email });
  
  res.json({
    message: 'Profile updated successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      referral_code: updatedUser.referral_code,
      tier: updatedUser.tier
    }
  });
});

export const updatePassword = asyncHandler(async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  
  // Verify current password
  const user = await UserModel.verifyPassword(req.user.email, currentPassword);
  if (!user) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  // Update password
  await UserModel.updatePassword(req.user.id, newPassword);
  
  res.json({ message: 'Password updated successfully' });
});

// Bank Details Routes
export const getBankDetails = asyncHandler(async (req: any, res: Response) => {
  const bankDetails = await BankDetailsModel.getByUserId(req.user.id);
  res.json(bankDetails);
});

export const createBankDetails = asyncHandler(async (req: any, res: Response) => {
  const bankDetails = await BankDetailsModel.create({
    ...req.body,
    user_id: req.user.id
  });
  
  res.status(201).json({
    message: 'Bank details created successfully',
    bankDetails
  });
});

export const updateBankDetails = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  
  // Verify ownership
  const existingBank = await BankDetailsModel.getById(id);
  if (!existingBank || existingBank.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Bank details not found' });
  }
  
  const updatedBank = await BankDetailsModel.update(id, req.body);
  
  res.json({
    message: 'Bank details updated successfully',
    bankDetails: updatedBank
  });
});

export const deleteBankDetails = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  
  // Verify ownership
  const existingBank = await BankDetailsModel.getById(id);
  if (!existingBank || existingBank.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Bank details not found' });
  }
  
  await BankDetailsModel.delete(id);
  
  res.json({ message: 'Bank details deleted successfully' });
});

export const setDefaultBankDetails = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  
  // Verify ownership
  const existingBank = await BankDetailsModel.getById(id);
  if (!existingBank || existingBank.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Bank details not found' });
  }
  
  await BankDetailsModel.setDefault(id);
  
  res.json({ message: 'Default payment method updated successfully' });
});