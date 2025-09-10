import { Router } from 'express';
import {
  getCommissionLevels,
  getCommissionLevel,
  getCommissionSettings,
  calculateCommissions,
  getCurrentCommissionRates
} from '../controllers/commissionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public route for terms and conditions (no authentication required)
router.get('/current-rates', getCurrentCommissionRates);

// Commission routes - accessible to all authenticated users
router.use(authenticateToken);

// Commission Level Routes (Read-only for all users)
router.get('/levels', getCommissionLevels);
router.get('/levels/:id', getCommissionLevel);

// Commission Settings Routes (Read-only for all users)
router.get('/settings', getCommissionSettings);

// Commission Utility Routes (Read-only for all users)
router.post('/calculator', calculateCommissions);

export { router as commissionRoutes };
