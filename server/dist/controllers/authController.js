"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultBankDetails = exports.deleteBankDetails = exports.updateBankDetails = exports.createBankDetails = exports.getBankDetails = exports.updatePassword = exports.updateProfile = exports.verifyToken = exports.getProfile = exports.login = exports.register = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const BankDetails_1 = require("../models/BankDetails");
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
    // Create user
    const user = await User_1.UserModel.create({
        email,
        password,
        name,
        role,
        referrer_code: referral_code
    });
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '7d' });
    res.status(201).json({
        message: 'User registered successfully',
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            referral_code: user.referral_code,
            tier: user.tier,
            coordinator_id: user.coordinator_id
        },
        token
    });
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Verify user credentials
    const user = await User_1.UserModel.verifyPassword(email, password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
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
            coordinator_id: user.coordinator_id
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