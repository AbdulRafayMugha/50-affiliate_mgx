// src/database/fixRafayAssignment.ts
import { initDatabase, pool } from './init';
import { RowDataPacket } from 'mysql2';

const fixRafayAssignment = async () => {
  try {
    await initDatabase({ isMigration: true });

    console.log('Checking and fixing Rafay assignment...');

    // Check if Rafay exists
    const [rafayRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, email, coordinator_id FROM users WHERE email = ? AND role = ? LIMIT 1',
      ['rafay@example.com', 'affiliate']
    );

    if (!rafayRows || rafayRows.length === 0) {
      console.log('❌ Rafay (rafay@example.com) not found in database');
      return;
    }

    const rafay = rafayRows[0];
    console.log(`✅ Found Rafay: ${rafay.name} (${rafay.email})`);
    console.log(`   Current coordinator_id: ${rafay.coordinator_id}`);

    // Find Naveed
    const [naveedRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name FROM users WHERE name = ? AND role = ? LIMIT 1',
      ['Naveed', 'coordinator']
    );

    if (!naveedRows || naveedRows.length === 0) {
      console.log('❌ Naveed coordinator not found');
      return;
    }

    const naveed = naveedRows[0];
    console.log(`✅ Found Naveed: ${naveed.name} (${naveed.id})`);

    // Assign Rafay to Naveed
    await pool.query(
      'UPDATE users SET coordinator_id = ?, updated_at = NOW() WHERE id = ?',
      [naveed.id, rafay.id]
    );

    console.log(`✅ Assigned Rafay to Naveed successfully`);

    // Show all current assignments (safe select: only fields likely present)
    console.log('\n📋 All Current Assignments:');
    const [assignments] = await pool.query<RowDataPacket[]>(
      `SELECT 
         a.name as affiliate_name,
         a.email as affiliate_email,
         COALESCE(c.name, '') as coordinator_name,
         COALESCE(a.referral_code, '') as referral_code,
         ${/* some installs may not have tier column - use COALESCE */''}
        //  COALESCE(a.tier, '') as tier,
         a.is_active
       FROM users a
       JOIN users c ON a.coordinator_id = c.id
       WHERE a.role = 'affiliate' AND c.role = 'coordinator'
       ORDER BY c.name, a.name`
    );

    if (!assignments || assignments.length === 0) {
      console.log('No affiliate → coordinator assignments found.');
    } else {
      assignments.forEach((assignment: any) => {
        const affiliateName = assignment.affiliate_name || 'Unknown';
        const affiliateEmail = assignment.affiliate_email || 'Unknown';
        const coordinatorName = assignment.coordinator_name || 'Unknown';
        const referralCode = assignment.referral_code || 'N/A';
        // const tier = assignment.tier || 'N/A';
        const isActive = assignment.is_active === 1 || assignment.is_active === true;

        console.log(`  ${affiliateName} (${affiliateEmail}) → ${coordinatorName}`);
        console.log(`    Referral Code: ${referralCode}, Active: ${isActive}`);
      });
    }
  } catch (error) {
    console.error('❌ Error fixing Rafay assignment:', error);
    throw error;
  } finally {
    try {
      await pool.end();
      console.log('DB connection closed.');
    } catch (err) {
      console.warn('Error closing DB pool:', err);
    }
  }
};

// Run if this file is executed directly
if (require.main === module) {
  fixRafayAssignment()
    .then(() => {
      console.log('Fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

export default fixRafayAssignment;
