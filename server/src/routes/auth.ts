import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  verifyToken, 
  updateProfile, 
  updatePassword,
  getBankDetails,
  createBankDetails,
  updateBankDetails,
  deleteBankDetails,
  setDefaultBankDetails,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);

// Email verification routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Password reset routes
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.get('/verify', authenticateToken, verifyToken);

// Profile management
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, updatePassword);

// Bank details management
router.get('/bank-details', authenticateToken, getBankDetails);
router.post('/bank-details', authenticateToken, createBankDetails);
router.put('/bank-details/:id', authenticateToken, updateBankDetails);
router.delete('/bank-details/:id', authenticateToken, deleteBankDetails);
router.put('/bank-details/:id/default', authenticateToken, setDefaultBankDetails);

export { router as authRoutes };