import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { BankDetailsModel } from '../models/BankDetails';
import { EmailService } from '../services/emailService';
import { asyncHandler } from '../middleware/errorHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role, referral_code } = req.body;
  
  // Check if user already exists
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists with this email' });
  }
  
  // Validate referral code if provided
  if (referral_code) {
    const referrer = await UserModel.findByReferralCode(referral_code);
    if (!referrer) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }
  }
  
  // Create user with email verification
  const emailService = EmailService.getInstance();
  const verificationToken = emailService.generateToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  const user = await UserModel.create({
    email,
    password,
    name,
    role,
    referrer_code: referral_code,
    email_verification_token: verificationToken,
    email_verification_expires: verificationExpires
  });
  
  // Send verification email
  try {
    // Test SMTP connection first
    const isConnected = await emailService.testConnection();
    if (isConnected) {
      await emailService.sendEmailVerification(email, name, verificationToken);
      console.log(`Verification email sent to ${email}`);
    } else {
      console.warn('SMTP connection failed, skipping email verification');
    }
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't fail registration if email fails, but log the error
  }
  
  res.status(201).json({
    message: 'Registration successful! Please check your email to verify your account.',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      email_verified: user.email_verified
    },
    requires_verification: true
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // Verify user credentials
  const user = await UserModel.verifyPassword(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // Check if email is verified (temporarily disabled for testing)
  // TODO: Re-enable this after SMTP is properly configured
  /*
  if (!user.email_verified) {
    return res.status(403).json({ 
      error: 'Email not verified. Please check your email and click the verification link.',
      requires_verification: true,
      email: user.email
    });
  }
  */
  
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
      tier: user.tier,
      coordinator_id: user.coordinator_id,
      email_verified: user.email_verified
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
      coordinator_id: user.coordinator_id,
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
      tier: updatedUser.tier,
      coordinator_id: updatedUser.coordinator_id
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

// Email verification endpoint
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required' });
  }
  
  try {
    // Find user by verification token
    const user = await UserModel.findByVerificationToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    
    // Check if token is expired
    if (user.email_verification_expires && new Date() > user.email_verification_expires) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }
    
    // Verify the user
    await UserModel.verifyEmail(user.id);
    
    // Send welcome email with referral code and terms
    const emailService = EmailService.getInstance();
    try {
      await emailService.sendWelcomeEmail(user.email, user.name, user.referral_code);
      console.log(`Welcome email sent to ${user.email}`);
      
      // Also send terms and conditions email
      await emailService.sendTermsAndConditionsEmail(user.email, user.name);
      console.log(`Terms and conditions email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send welcome email or terms:', error);
      // Don't fail verification if emails fail
    }
    
    res.json({
      message: 'Email verified successfully! Welcome to ReffalPlan!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        referral_code: user.referral_code,
        email_verified: true
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification email
export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }
    
    // Generate new verification token
    const emailService = EmailService.getInstance();
    const verificationToken = emailService.generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Update user with new token
    await UserModel.updateVerificationToken(user.id, verificationToken, verificationExpires);
    
    // Send verification email
    await emailService.sendEmailVerification(email, user.name, verificationToken);
    
    res.json({
      message: 'Verification email sent successfully. Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Request password reset
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
    
    // Generate reset token
    const emailService = EmailService.getInstance();
    const resetToken = emailService.generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Update user with reset token
    await UserModel.updatePasswordResetToken(user.id, resetToken, resetExpires);
    
    // Send reset email
    await emailService.sendPasswordResetEmail(email, user.name, resetToken);
    
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  try {
    // Find user by reset token
    const user = await UserModel.findByPasswordResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Check if token is expired
    if (user.password_reset_expires && new Date() > user.password_reset_expires) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }
    
    // Update password
    await UserModel.updatePassword(user.id, newPassword);
    
    // Clear reset token
    await UserModel.clearPasswordResetToken(user.id);
    
    res.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
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