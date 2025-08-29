import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TransactionModel } from '../models/Transaction';
import { asyncHandler } from '../middleware/errorHandler';

export const createTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { customer_email, amount, referral_code, transaction_type } = req.body;
  
  const transaction = await TransactionModel.create({
    customer_email,
    amount,
    referral_code,
    transaction_type
  });
  
  res.status(201).json({
    message: 'Transaction created successfully',
    transaction: {
      id: transaction.id,
      customer_email: transaction.customer_email,
      amount: transaction.amount,
      status: transaction.status,
      transaction_type: transaction.transaction_type,
      created_at: transaction.created_at
    }
  });
});

export const getTransactionsByAffiliate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const transactions = await TransactionModel.getByAffiliateId(req.user.id);
  
  res.json({ transactions });
});

// Public endpoint for processing purchases with referral codes
export const processPublicTransaction = asyncHandler(async (req: any, res: Response) => {
  const { customer_email, amount, referral_code, transaction_type } = req.body;
  
  // Validate required fields
  if (!customer_email || !amount) {
    return res.status(400).json({ error: 'Customer email and amount are required' });
  }
  
  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  
  const transaction = await TransactionModel.create({
    customer_email,
    amount,
    referral_code,
    transaction_type
  });
  
  res.status(201).json({
    message: 'Purchase processed successfully',
    transaction_id: transaction.id,
    amount: transaction.amount,
    status: transaction.status
  });
});