"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./routes/auth");
const affiliate_1 = require("./routes/affiliate");
const transaction_1 = require("./routes/transaction");
const admin_1 = require("./routes/admin");
const commission_1 = require("./routes/commission");
const coordinator_1 = require("./routes/coordinator");
const init_1 = require("./database/init");
const seed_commission_levels_1 = tslib_1.__importDefault(require("./database/seed-commission-levels"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
// Rate limiting - disabled for development
if (process.env.NODE_ENV === 'production') {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    });
    app.use(limiter);
}
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/affiliate', affiliate_1.affiliateRoutes);
app.use('/api/transaction', transaction_1.transactionRoutes);
app.use('/api/admin', admin_1.adminRoutes);
app.use('/api/commission', commission_1.commissionRoutes);
app.use('/api/coordinator', coordinator_1.coordinatorRoutes);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Initialize database and start server
const startServer = async () => {
    try {
        await (0, init_1.initDatabase)();
        console.log('✅ PostgreSQL database initialized successfully');
        // Seed commission levels
        await (0, seed_commission_levels_1.default)();
        console.log('✅ Commission levels seeded successfully');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map