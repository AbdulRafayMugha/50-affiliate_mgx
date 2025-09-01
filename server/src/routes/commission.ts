import { Router } from 'express';
import {
  getCommissionLevels,
  getCommissionLevel,
  getCommissionSettings,
  calculateCommissions
} from '../controllers/commissionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public commission routes - accessible to all authenticated users
router.use(authenticateToken);

// Commission Level Routes (Read-only for all users)
router.get('/levels', getCommissionLevels);
router.get('/levels/:id', getCommissionLevel);

// Commission Settings Routes (Read-only for all users)
router.get('/settings', getCommissionSettings);

// Commission Utility Routes (Read-only for all users)
router.post('/calculator', calculateCommissions);

export { router as commissionRoutes };
