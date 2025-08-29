"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAffiliate = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.UserModel.findById(decoded.userId);
        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'Invalid or inactive user' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Token verification failed:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireAffiliate = (0, exports.requireRole)(['affiliate', 'admin']);
//# sourceMappingURL=auth.js.map