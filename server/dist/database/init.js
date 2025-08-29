"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.initDatabase = exports.pool = void 0;
const tslib_1 = require("tslib");
const pg_1 = require("pg");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL environment variable is not set. Please check your .env file.');
}
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const initDatabase = async (options = {}) => {
    try {
        await exports.pool.query('SELECT NOW()'); // Test the connection
        console.log('🚀 Initializing PostgreSQL database...');
        console.log('✅ PostgreSQL connection established successfully.');
        // When running the main app, check if migrations have been applied.
        // Skip this check when running the migration script itself.
        if (!options.isMigration) {
            const migrationCheck = await exports.pool.query("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'users');");
            if (!migrationCheck.rows[0].exists) {
                console.error('❌ Critical Error: The "users" table was not found in the database.');
                console.error('👉 Please run the database migrations first with: npm run migrate');
                throw new Error('Database is not migrated.');
            }
            console.log('✅ Database migrations appear to be applied.');
        }
    }
    catch (error) {
        // Avoid logging the error twice if it's our custom migration error
        if (error.message !== 'Database is not migrated.') {
            console.error('❌ PostgreSQL database initialization failed:', error);
        }
        throw error;
    }
};
exports.initDatabase = initDatabase;
exports.db = exports.pool;
exports.default = exports.db;
//# sourceMappingURL=init.js.map