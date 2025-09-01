import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Validation schemas
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('admin', 'affiliate', 'client').optional(),
    referrer_code: Joi.string().optional()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  transaction: Joi.object({
    customer_email: Joi.string().email().required(),
    amount: Joi.number().positive().required(),
    referral_code: Joi.string().optional(),
    transaction_type: Joi.string().valid('purchase', 'subscription', 'upgrade').optional()
  }),
  
  emailInvite: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().max(100).optional()
  }),
  
  affiliateLink: Joi.object({
    custom_code: Joi.string().alphanum().min(6).max(20).optional()
  })
};