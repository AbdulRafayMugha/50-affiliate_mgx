"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultBankDetails = exports.resetPassword = exports.requestPasswordReset = exports.resendVerification = exports.verifyEmail = exports.deleteBankDetails = exports.updateBankDetails = exports.createBankDetails = exports.getBankDetails = exports.updatePassword = exports.updateProfile = exports.verifyToken = exports.getProfile = exports.login = exports.register = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const BankDetails_1 = require("../models/BankDetails");
const emailService_1 = require("../services/emailService");
const errorHandler_1 = require("../middleware/errorHandler");
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, name, role, referral_code } = req.body;
    // Check if user already exists
    const existingUser = await User_1.UserModel.findByEmail(email);
    if (existingUser) {
        return res.status(409).json({ error: 'User already exists with this email' });
    }
    // Validate referral code if provided
    if (referral_code) {
        const referrer = await User_1.UserModel.findByReferralCode(referral_code);
        if (!referrer) {
            return res.status(400).json({ error: 'Invalid referral code' });
        }
    }
    // Create user with email verification
    const emailService = emailService_1.EmailService.getInstance();
    const verificationToken = emailService.generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const user = await User_1.UserModel.create({
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
        }
        else {
            console.warn('SMTP connection failed, skipping email verification');
        }
    }
    catch (error) {
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
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Verify user credentials
    const user = await User_1.UserModel.verifyPassword(email, password);
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
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '7d' });
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
exports.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await User_1.UserModel.findById(req.user.id);
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
exports.verifyToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
exports.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, email } = req.body;
    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
        const existingUser = await User_1.UserModel.findByEmail(email);
        if (existingUser && existingUser.id !== req.user.id) {
            return res.status(409).json({ error: 'Email already in use' });
        }
    }
    const updatedUser = await User_1.UserModel.updateProfile(req.user.id, { name, email });
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
exports.updatePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    // Verify current password
    const user = await User_1.UserModel.verifyPassword(req.user.email, currentPassword);
    if (!user) {
        return res.status(401).json({ error: 'Current password is incorrect' });
    }
    // Update password
    await User_1.UserModel.updatePassword(req.user.id, newPassword);
    res.json({ message: 'Password updated successfully' });
});
// Bank Details Routes
exports.getBankDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const bankDetails = await BankDetails_1.BankDetailsModel.getByUserId(req.user.id);
    res.json(bankDetails);
});
exports.createBankDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const bankDetails = await BankDetails_1.BankDetailsModel.create({
        ...req.body,
        user_id: req.user.id
    });
    res.status(201).json({
        message: 'Bank details created successfully',
        bankDetails
    });
});
exports.updateBankDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Verify ownership
    const existingBank = await BankDetails_1.BankDetailsModel.getById(id);
    if (!existingBank || existingBank.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Bank details not found' });
    }
    const updatedBank = await BankDetails_1.BankDetailsModel.update(id, req.body);
    res.json({
        message: 'Bank details updated successfully',
        bankDetails: updatedBank
    });
});
exports.deleteBankDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Verify ownership
    const existingBank = await BankDetails_1.BankDetailsModel.getById(id);
    if (!existingBank || existingBank.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Bank details not found' });
    }
    await BankDetails_1.BankDetailsModel.delete(id);
    res.json({ message: 'Bank details deleted successfully' });
});
// Email verification endpoint
exports.verifyEmail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
    }
    try {
        // Find user by verification token
        const user = await User_1.UserModel.findByVerificationToken(token);
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }
        // Check if token is expired
        if (user.email_verification_expires && new Date() > user.email_verification_expires) {
            return res.status(400).json({ error: 'Verification token has expired' });
        }
        // Verify the user
        await User_1.UserModel.verifyEmail(user.id);
        // Send welcome email with referral code and terms
        const emailService = emailService_1.EmailService.getInstance();
        try {
            await emailService.sendWelcomeEmail(user.email, user.name, user.referral_code);
            console.log(`Welcome email sent to ${user.email}`);
            // Also send terms and conditions email
            await emailService.sendTermsAndConditionsEmail(user.email, user.name);
            console.log(`Terms and conditions email sent to ${user.email}`);
        }
        catch (error) {
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
    }
    catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
});
// Resend verification email
exports.resendVerification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    try {
        const user = await User_1.UserModel.findByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.email_verified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }
        // Generate new verification token
        const emailService = emailService_1.EmailService.getInstance();
        const verificationToken = emailService.generateToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Update user with new token
        await User_1.UserModel.updateVerificationToken(user.id, verificationToken, verificationExpires);
        // Send verification email
        await emailService.sendEmailVerification(email, user.name, verificationToken);
        res.json({
            message: 'Verification email sent successfully. Please check your inbox.'
        });
    }
    catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});
// Request password reset
exports.requestPasswordReset = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    try {
        const user = await User_1.UserModel.findByEmail(email);
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.json({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }
        // Generate reset token
        const emailService = emailService_1.EmailService.getInstance();
        const resetToken = emailService.generateToken();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        // Update user with reset token
        await User_1.UserModel.updatePasswordResetToken(user.id, resetToken, resetExpires);
        // Send reset email
        await emailService.sendPasswordResetEmail(email, user.name, resetToken);
        res.json({
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    }
    catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});
// Reset password
exports.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    try {
        // Find user by reset token
        const user = await User_1.UserModel.findByPasswordResetToken(token);
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        // Check if token is expired
        if (user.password_reset_expires && new Date() > user.password_reset_expires) {
            return res.status(400).json({ error: 'Reset token has expired' });
        }
        // Update password
        await User_1.UserModel.updatePassword(user.id, newPassword);
        // Clear reset token
        await User_1.UserModel.clearPasswordResetToken(user.id);
        res.json({
            message: 'Password reset successfully. You can now login with your new password.'
        });
    }
    catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});
exports.setDefaultBankDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Verify ownership
    const existingBank = await BankDetails_1.BankDetailsModel.getById(id);
    if (!existingBank || existingBank.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Bank details not found' });
    }
    await BankDetails_1.BankDetailsModel.setDefault(id);
    res.json({ message: 'Default payment method updated successfully' });
});
//# sourceMappingURL=authController.js.map