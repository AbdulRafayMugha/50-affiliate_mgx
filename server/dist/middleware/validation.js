"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validate = void 0;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
const validate = (schema) => {
    return (req, res, next) => {
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
exports.validate = validate;
// Validation schemas
exports.schemas = {
    register: joi_1.default.object({
        email: joi_1.default.string().email().required(),
        password: joi_1.default.string().min(8).required(),
        name: joi_1.default.string().min(2).max(100).required(),
        role: joi_1.default.string().valid('admin', 'affiliate', 'client', 'coordinator').optional(),
        referrer_code: joi_1.default.string().optional()
    }),
    login: joi_1.default.object({
        email: joi_1.default.string().email().required(),
        password: joi_1.default.string().required()
    }),
    transaction: joi_1.default.object({
        customer_email: joi_1.default.string().email().required(),
        amount: joi_1.default.number().positive().required(),
        referral_code: joi_1.default.string().optional(),
        transaction_type: joi_1.default.string().valid('purchase', 'subscription', 'upgrade').optional()
    }),
    emailInvite: joi_1.default.object({
        email: joi_1.default.string().email().required(),
        name: joi_1.default.string().max(100).optional()
    }),
    affiliateLink: joi_1.default.object({
        custom_code: joi_1.default.string().alphanum().min(6).max(20).optional()
    }),
    emailReferral: joi_1.default.object({
        email: joi_1.default.string().email().required(),
        name: joi_1.default.string().max(100).optional(),
        message: joi_1.default.string().max(500).optional()
    })
};
//# sourceMappingURL=validation.js.map