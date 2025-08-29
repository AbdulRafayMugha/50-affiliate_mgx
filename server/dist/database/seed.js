"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const tslib_1 = require("tslib");
const init_1 = require("./init");
const bcryptjs_1 = tslib_1.__importDefault(require("bcryptjs"));
const seedDatabase = async () => {
    const client = await init_1.pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🌱 Seeding database...');
        // Create admin user
        const adminPasswordHash = await bcryptjs_1.default.hash('admin123', 12);
        const { rows: adminRows } = await client.query(`INSERT INTO users (email, password_hash, name, role, referral_code)
       VALUES ('admin@affiliate.com', $1, 'Admin User', 'admin', 'ADMIN001')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`, [adminPasswordHash]);
        // Create test affiliates
        const affiliatePasswordHash = await bcryptjs_1.default.hash('password123', 12);
        // Level 1 affiliate (no referrer)
        const { rows: level1Rows } = await client.query(`INSERT INTO users (email, password_hash, name, role, referral_code)
       VALUES ('john@example.com', $1, 'John Smith', 'affiliate', 'JOHN2024')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`, [affiliatePasswordHash]);
        let level1Id = null;
        if (level1Rows.length > 0) {
            level1Id = level1Rows[0].id;
            // Create affiliate link for John
            await client.query(`INSERT INTO affiliate_links (affiliate_id, link_code)
         VALUES ($1, 'JOHN2024')
         ON CONFLICT (link_code) DO NOTHING`, [level1Id]);
        }
        else {
            // Get existing user ID
            const { rows } = await client.query('SELECT id FROM users WHERE email = $1', ['john@example.com']);
            level1Id = rows[0]?.id;
        }
        // Level 2 affiliate (referred by John)
        const { rows: level2Rows } = await client.query(`INSERT INTO users (email, password_hash, name, role, referrer_id, referral_code)
       VALUES ('sarah@example.com', $1, 'Sarah Johnson', 'affiliate', $2, 'SARAH2024')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`, [affiliatePasswordHash, level1Id]);
        let level2Id = null;
        if (level2Rows.length > 0) {
            level2Id = level2Rows[0].id;
            // Create affiliate link for Sarah
            await client.query(`INSERT INTO affiliate_links (affiliate_id, link_code)
         VALUES ($1, 'SARAH2024')
         ON CONFLICT (link_code) DO NOTHING`, [level2Id]);
        }
        else {
            const { rows } = await client.query('SELECT id FROM users WHERE email = $1', ['sarah@example.com']);
            level2Id = rows[0]?.id;
        }
        // Level 3 affiliate (referred by Sarah)
        const { rows: level3Rows } = await client.query(`INSERT INTO users (email, password_hash, name, role, referrer_id, referral_code)
       VALUES ('mike@example.com', $1, 'Mike Wilson', 'affiliate', $2, 'MIKE2024')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`, [affiliatePasswordHash, level2Id]);
        let level3Id = null;
        if (level3Rows.length > 0) {
            level3Id = level3Rows[0].id;
            // Create affiliate link for Mike
            await client.query(`INSERT INTO affiliate_links (affiliate_id, link_code)
         VALUES ($1, 'MIKE2024')
         ON CONFLICT (link_code) DO NOTHING`, [level3Id]);
        }
        // Create sample transactions and commissions
        if (level1Id) {
            // Get affiliate link ID for John
            const { rows: linkRows } = await client.query('SELECT id FROM affiliate_links WHERE affiliate_id = $1 LIMIT 1', [level1Id]);
            if (linkRows.length > 0) {
                const linkId = linkRows[0].id;
                // Create sample transactions
                for (let i = 1; i <= 5; i++) {
                    const { rows: transactionRows } = await client.query(`INSERT INTO transactions (customer_email, amount, affiliate_link_id, referrer_id, status)
             VALUES ($1, $2, $3, $4, 'completed')
             ON CONFLICT DO NOTHING
             RETURNING id`, [`customer${i}@example.com`, 100 + (i * 50), linkId, level1Id]);
                    if (transactionRows.length > 0) {
                        const transactionId = transactionRows[0].id;
                        const amount = 100 + (i * 50);
                        // Create Level 1 commission (15%)
                        await client.query(`INSERT INTO commissions (affiliate_id, transaction_id, level, amount, rate, status)
               VALUES ($1, $2, 1, $3, 15.0, 'paid')
               ON CONFLICT DO NOTHING`, [level1Id, transactionId, amount * 0.15]);
                        // Create Level 2 commission if Sarah exists (5%)
                        if (level2Id) {
                            await client.query(`INSERT INTO commissions (affiliate_id, transaction_id, level, amount, rate, status)
                 VALUES ($1, $2, 2, $3, 5.0, 'paid')
                 ON CONFLICT DO NOTHING`, [level2Id, transactionId, amount * 0.05]);
                        }
                        // Create Level 3 commission if Mike exists (2.5%)
                        if (level3Id) {
                            await client.query(`INSERT INTO commissions (affiliate_id, transaction_id, level, amount, rate, status)
                 VALUES ($1, $2, 3, $3, 2.5, 'pending')
                 ON CONFLICT DO NOTHING`, [level3Id, transactionId, amount * 0.025]);
                        }
                    }
                }
                // Update affiliate link stats
                await client.query('UPDATE affiliate_links SET clicks = 25, conversions = 5 WHERE id = $1', [linkId]);
            }
        }
        // Create sample email invites
        if (level1Id) {
            await client.query(`INSERT INTO email_invites (affiliate_id, email, message, status)
         VALUES 
         ($1, 'friend1@example.com', 'Check out this great opportunity!', 'sent'),
         ($1, 'friend2@example.com', 'I thought you might be interested in this.', 'opened'),
         ($1, 'friend3@example.com', 'Join me in this amazing program!', 'clicked')
         ON CONFLICT DO NOTHING`, [level1Id]);
        }
        await client.query('COMMIT');
        console.log('✅ Database seeded successfully!');
        // Log test credentials
        console.log('\n🔑 Test Credentials:');
        console.log('Admin: admin@affiliate.com / admin123');
        console.log('Affiliate 1: john@example.com / password123');
        console.log('Affiliate 2: sarah@example.com / password123');
        console.log('Affiliate 3: mike@example.com / password123');
        console.log('\n🔗 Test Referral Codes:');
        console.log('John: JOHN2024');
        console.log('Sarah: SARAH2024');
        console.log('Mike: MIKE2024');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.seedDatabase = seedDatabase;
// Run seeding if called directly
if (require.main === module) {
    (0, exports.seedDatabase)().then(() => {
        console.log('✅ Seeding completed');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=seed.js.map