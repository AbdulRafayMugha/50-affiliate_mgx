import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL environment variable is not set. Please check your .env file.');
}

export const pool = mysql.createPool(process.env.DATABASE_URL);

export const initDatabase = async (options: { isMigration?: boolean } = {}) => {
  try {
    await pool.query('SELECT 1 + 1'); // Test the connection
    console.log('🚀 Initializing MySQL database...');
    console.log('✅ MySQL connection established successfully.');

    // When running the main app, check if migrations have been applied.
    // Skip this check when running the migration script itself.
    if (!options.isMigration) {
      const [rows] = await pool.query(
        "SHOW TABLES LIKE 'users';"
      );

      // @ts-ignore - rows is an array of RowDataPacket, check if it's empty
      if (rows.length === 0) {
        console.error('❌ Critical Error: The "users" table was not found in the database.');
        console.error('👉 Please run the database migrations first with: npm run migrate');
        throw new Error('Database is not migrated.');
      }
      console.log('✅ Database migrations appear to be applied.');
    }
  } catch (error) {
    // Avoid logging the error twice if it's our custom migration error
    if (error.message !== 'Database is not migrated.') {
      console.error('❌ MySQL database initialization failed:', error);
    }
    throw error;
  }
};

export const db = pool;
export default db;
