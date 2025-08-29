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
  setDefaultBankDetails
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);

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