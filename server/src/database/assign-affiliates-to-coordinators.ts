// src/database/assignAffiliatesToCoordinators.ts
import { initDatabase, pool } from './init';
import { RowDataPacket } from 'mysql2';

const ASSIGNMENTS = [
  { affiliateEmail: 'mike@example.com', coordinatorName: 'Hadi' },
  { affiliateEmail: 'john@example.com', coordinatorName: 'Nouman' },
  { affiliateEmail: 'rafay@example.com', coordinatorName: 'Naveed' }
];

const assignAffiliatesToCoordinators = async () => {
  try {
    await initDatabase({ isMigration: true });

    console.log('Assigning affiliates to coordinators...');

    for (const assignment of ASSIGNMENTS) {
      // Find the coordinator (MySQL ? placeholders)
      const [coordinatorRows] = await pool.query<RowDataPacket[]>(
        'SELECT id, name FROM users WHERE name = ? AND role = ? LIMIT 1',
        [assignment.coordinatorName, 'coordinator']
      );

      if (!coordinatorRows || coordinatorRows.length === 0) {
        console.log(`❌ Coordinator ${assignment.coordinatorName} not found`);
        continue;
      }

      const coordinator = coordinatorRows[0];

      // Find the affiliate by email
      const [affiliateRows] = await pool.query<RowDataPacket[]>(
        'SELECT id, name FROM users WHERE email = ? AND role = ? LIMIT 1',
        [assignment.affiliateEmail, 'affiliate']
      );

      if (!affiliateRows || affiliateRows.length === 0) {
        console.log(`❌ Affiliate ${assignment.affiliateEmail} not found`);
        continue;
      }

      const affiliate = affiliateRows[0];

      // Check if affiliate is already assigned to a coordinator
      const [existingAssignmentRows] = await pool.query<RowDataPacket[]>(
        'SELECT coordinator_id FROM users WHERE id = ? LIMIT 1',
        [affiliate.id]
      );

      const existingCoordinatorId = existingAssignmentRows && existingAssignmentRows[0]
        ? existingAssignmentRows[0].coordinator_id
        : null;

      if (existingCoordinatorId) {
        console.log(`⚠️  Affiliate ${assignment.affiliateEmail} is already assigned to a coordinator (id: ${existingCoordinatorId})`);
        continue;
      }

      // Assign affiliate to coordinator (use NOW() for MySQL)
      await pool.query(
        'UPDATE users SET coordinator_id = ?, updated_at = NOW() WHERE id = ?',
        [coordinator.id, affiliate.id]
      );

      console.log(`✅ Assigned ${affiliate.name} (${assignment.affiliateEmail}) to ${assignment.coordinatorName}`);
    }

    // Show final assignments (use COALESCE for columns that might not exist / be null)
    console.log('\n📋 Final Assignments:');
    const [assignmentsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         a.name AS affiliate_name,
         c.name AS coordinator_name,
         a.email AS affiliate_email,
         COALESCE(a.referral_code, '') AS referral_code,
        //  COALESCE(a.tier, '') AS tier,
         a.is_active
       FROM users a
       JOIN users c ON a.coordinator_id = c.id
       WHERE a.role = 'affiliate' AND c.role = 'coordinator'
       ORDER BY c.name, a.name`
    );

    if (!assignmentsRows || assignmentsRows.length === 0) {
      console.log('No affiliate → coordinator assignments found.');
    } else {
      assignmentsRows.forEach((row: any) => {
        const affiliateName = row.affiliate_name || 'Unknown';
        const affiliateEmail = row.affiliate_email || 'Unknown';
        const coordinatorName = row.coordinator_name || 'Unknown';
        const referralCode = row.referral_code || 'N/A';
        // const tier = row.tier || 'N/A';
        // MySQL bool is usually 1/0, or true/false depending on driver config:
        const isActive = row.is_active === 1 || row.is_active === true;

        console.log(`  ${affiliateName} (${affiliateEmail}) → ${coordinatorName}`);
        console.log(`    Referral Code: ${referralCode},  Active: ${isActive}`);
      });
    }

    console.log('\n✅ Affiliate assignments completed successfully');
  } catch (error) {
    console.error('❌ Error assigning affiliates:', error);
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
  assignAffiliatesToCoordinators()
    .then(() => {
      console.log('Assignment completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Assignment failed:', error);
      process.exit(1);
    });
}

export default assignAffiliatesToCoordinators;
