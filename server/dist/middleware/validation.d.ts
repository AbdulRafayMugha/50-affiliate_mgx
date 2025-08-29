import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const schemas: {
    register: Joi.ObjectSchema<any>;
    login: Joi.ObjectSchema<any>;
    transaction: Joi.ObjectSchema<any>;
    emailInvite: Joi.ObjectSchema<any>;
    affiliateLink: Joi.ObjectSchema<any>;
};
