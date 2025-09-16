// import { initDatabase, pool } from './init';

// const COORDINATOR_MIGRATIONS_SQL = `
// -- Add coordinator role to users table
// ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
// ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'affiliate', 'client', 'coordinator'));

// -- Add coordinator_id column to users table (for affiliates assigned to coordinators)
// ALTER TABLE users ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL;

// -- Add index for coordinator_id for better performance
// CREATE INDEX IF NOT EXISTS idx_users_coordinator_id ON users(coordinator_id);

// -- Add index for role-based queries
// CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
// `;

// const runCoordinatorMigrations = async () => {
//   try {
//     await initDatabase({ isMigration: true });
    
//     console.log('Running coordinator migrations...');
//     await pool.query(COORDINATOR_MIGRATIONS_SQL);
    
//     console.log('✅ Coordinator migrations completed successfully');
//   } catch (error) {
//     console.error('❌ Error running coordinator migrations:', error);
//     throw error;
//   } finally {
//     await pool.end();
//   }
// };

// // Run migrations if this file is executed directly
// if (require.main === module) {
//   runCoordinatorMigrations()
//     .then(() => {
//       console.log('Migration completed');
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('Migration failed:', error);
//       process.exit(1);
//     });
// }

// export { runCoordinatorMigrations };


// test-db-conn.ts
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  if (!process.env.DATABASE_URL) {
    throw new Error("❌ DATABASE_URL not found in .env file");
  }

  const pool = mysql.createPool(process.env.DATABASE_URL);

  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    console.log("✅ DB OK:", rows);
  } catch (err: any) {
    console.error("❌ DB connection error:", err.message);
  } finally {
    await pool.end();
  }
}

test();
// To run: npx ts-node src/database/migrate-coordinator.ts

