import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL environment variable is not set. Please check your .env file.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const initDatabase = async (options: { isMigration?: boolean } = {}) => {
  try {
    await pool.query('SELECT NOW()'); // Test the connection
    console.log('🚀 Initializing PostgreSQL database...');
    console.log('✅ PostgreSQL connection established successfully.');

    // When running the main app, check if migrations have been applied.
    // Skip this check when running the migration script itself.
    if (!options.isMigration) {
      const migrationCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'users');"
      );

      if (!migrationCheck.rows[0].exists) {
        console.error('❌ Critical Error: The "users" table was not found in the database.');
        console.error('👉 Please run the database migrations first with: npm run migrate');
        throw new Error('Database is not migrated.');
      }
      console.log('✅ Database migrations appear to be applied.');
    }
  } catch (error) {
    // Avoid logging the error twice if it's our custom migration error
    if (error.message !== 'Database is not migrated.') {
      console.error('❌ PostgreSQL database initialization failed:', error);
    }
    throw error;
  }
};

export const db = pool;
export default db;