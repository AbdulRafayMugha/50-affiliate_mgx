import { Router } from 'express';
import { 
  createTransaction, 
  getTransactionsByAffiliate,
  processPublicTransaction 
} from '../controllers/transactionController';
import { authenticateToken, requireAffiliate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Public route for processing transactions (webhook/API)
router.post('/record', validate(schemas.transaction), processPublicTransaction);

// Protected routes
router.post('/', authenticateToken, requireAffiliate, validate(schemas.transaction), createTransaction);
router.get('/affiliate', authenticateToken, requireAffiliate, getTransactionsByAffiliate);

export { router as transactionRoutes };