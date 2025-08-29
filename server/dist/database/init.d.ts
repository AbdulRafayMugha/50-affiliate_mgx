import { Pool } from 'pg';
export declare const pool: Pool;
export declare const initDatabase: (options?: {
    isMigration?: boolean;
}) => Promise<void>;
export declare const db: Pool;
export default db;
