"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const tslib_1 = require("tslib");
const sqlite_init_1 = require("./sqlite-init");
const bcryptjs_1 = tslib_1.__importDefault(require("bcryptjs"));
const seedDatabase = async () => {
    try {
        console.log('🌱 Seeding SQLite database...');
        // Create admin user
        const adminPasswordHash = await bcryptjs_1.default.hash('admin123', 12);
        await sqlite_init_1.db.run(`
      INSERT OR IGNORE INTO users (email, password_hash, name, role, referral_code)
      VALUES (?, ?, ?, ?, ?)
    `, ['admin@affiliate.com', adminPasswordHash, 'Admin User', 'admin', 'ADMIN001']);
        // Create test affiliates
        const affiliatePasswordHash = await bcryptjs_1.default.hash('password123', 12);
        // Level 1 affiliate (no referrer)
        const level1Result = await sqlite_init_1.db.run(`
      INSERT OR IGNORE INTO users (email, password_hash, name, role, referral_code)
      VALUES (?, ?, ?, ?, ?)
    `, ['john@example.com', affiliatePasswordHash, 'John Smith', 'affiliate', 'JOHN2024']);
        const level1User = await sqlite_init_1.db.get('SELECT id FROM users WHERE email = ?', ['john@example.com']);
        const level1Id = level1User?.id;
        if (level1Id) {
            // Create affiliate link for John
            await sqlite_init_1.db.run(`
        INSERT OR IGNORE INTO affiliate_links (affiliate_id, link_code)
        VALUES (?, ?)
      `, [level1Id, 'JOHN2024']);
        }
        // Level 2 affiliate (referred by John)
        await sqlite_init_1.db.run(`
      INSERT OR IGNORE INTO users (email, password_hash, name, role, referrer_id, referral_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['sarah@example.com', affiliatePasswordHash, 'Sarah Johnson', 'affiliate', level1Id, 'SARAH2024']);
        const level2User = await sqlite_init_1.db.get('SELECT id FROM users WHERE email = ?', ['sarah@example.com']);
        const level2Id = level2User?.id;
        if (level2Id) {
            // Create affiliate link for Sarah
            await sqlite_init_1.db.run(`
        INSERT OR IGNORE INTO affiliate_links (affiliate_id, link_code)
        VALUES (?, ?)
      `, [level2Id, 'SARAH2024']);
        }
        // Level 3 affiliate (referred by Sarah)
        await sqlite_init_1.db.run(`
      INSERT OR IGNORE INTO users (email, password_hash, name, role, referrer_id, referral_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['mike@example.com', affiliatePasswordHash, 'Mike Wilson', 'affiliate', level2Id, 'MIKE2024']);
        const level3User = await sqlite_init_1.db.get('SELECT id FROM users WHERE email = ?', ['mike@example.com']);
        const level3Id = level3User?.id;
        if (level3Id) {
            // Create affiliate link for Mike
            await sqlite_init_1.db.run(`
        INSERT OR IGNORE INTO affiliate_links (affiliate_id, link_code)
        VALUES (?, ?)
      `, [level3Id, 'MIKE2024']);
        }
        // Create sample transactions and commissions
        if (level1Id) {
            const linkResult = await sqlite_init_1.db.get('SELECT id FROM affiliate_links WHERE affiliate_id = ? LIMIT 1', [level1Id]);
            const linkId = linkResult?.id;
            if (linkId) {
                // Create sample transactions
                for (let i = 1; i <= 5; i++) {
                    const transactionResult = await sqlite_init_1.db.run(`
            INSERT OR IGNORE INTO transactions (customer_email, amount, affiliate_link_id, referrer_id, status)
            VALUES (?, ?, ?, ?, 'completed')
          `, [`customer${i}@example.com`, 100 + (i * 50), linkId, level1Id]);
                    if (transactionResult.lastID) {
                        const transactionId = transactionResult.lastID;
                        const amount = 100 + (i * 50);
                        // Create Level 1 commission (15%)
                        await sqlite_init_1.db.run(`
              INSERT OR IGNORE INTO commissions (affiliate_id, transaction_id, level, amount, rate, status)
              VALUES (?, ?, 1, ?, 15.0, 'paid')
            `, [level1Id, transactionId, amount * 0.15]);
                        // Create Level 2 commission if Sarah exists (5%)
                        if (level2Id) {
                            await sqlite_init_1.db.run(`
                INSERT OR IGNORE INTO commissions (affiliate_id, transaction_id, level, amount, rate, status)
                VALUES (?, ?, 2, ?, 5.0, 'paid')
              `, [level2Id, transactionId, amount * 0.05]);
                        }
                        // Create Level 3 commission if Mike exists (2.5%)
                        if (level3Id) {
                            await sqlite_init_1.db.run(`
                INSERT OR IGNORE INTO commissions (affiliate_id, transaction_id, level, amount, rate, status)
                VALUES (?, ?, 3, ?, 2.5, 'pending')
              `, [level3Id, transactionId, amount * 0.025]);
                        }
                    }
                }
                // Update affiliate link stats
                await sqlite_init_1.db.run('UPDATE affiliate_links SET clicks = 25, conversions = 5 WHERE id = ?', [linkId]);
            }
        }
        // Create sample email invites
        if (level1Id) {
            await sqlite_init_1.db.run(`
        INSERT OR IGNORE INTO email_invites (affiliate_id, email, message, status)
        VALUES (?, 'friend1@example.com', 'Check out this great opportunity!', 'sent')
      `, [level1Id]);
            await sqlite_init_1.db.run(`
        INSERT OR IGNORE INTO email_invites (affiliate_id, email, message, status)
        VALUES (?, 'friend2@example.com', 'I thought you might be interested in this.', 'opened')
      `, [level1Id]);
            await sqlite_init_1.db.run(`
        INSERT OR IGNORE INTO email_invites (affiliate_id, email, message, status)
        VALUES (?, 'friend3@example.com', 'Join me in this amazing program!', 'clicked')
      `, [level1Id]);
        }
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
        console.error('❌ Seeding failed:', error);
        throw error;
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
//# sourceMappingURL=seed-sqlite.js.map