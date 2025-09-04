import { initDatabase, pool } from './init';

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
      // Find the coordinator
      const { rows: coordinatorRows } = await pool.query(
        'SELECT id, name FROM users WHERE name = $1 AND role = $2',
        [assignment.coordinatorName, 'coordinator']
      );
      
      if (coordinatorRows.length === 0) {
        console.log(`❌ Coordinator ${assignment.coordinatorName} not found`);
        continue;
      }
      
      const coordinator = coordinatorRows[0];
      
      // Find the affiliate
      const { rows: affiliateRows } = await pool.query(
        'SELECT id, name FROM users WHERE email = $1 AND role = $2',
        [assignment.affiliateEmail, 'affiliate']
      );
      
      if (affiliateRows.length === 0) {
        console.log(`❌ Affiliate ${assignment.affiliateEmail} not found`);
        continue;
      }
      
      const affiliate = affiliateRows[0];
      
      // Check if affiliate is already assigned
      const { rows: existingAssignment } = await pool.query(
        'SELECT coordinator_id FROM users WHERE id = $1',
        [affiliate.id]
      );
      
      if (existingAssignment[0].coordinator_id) {
        console.log(`⚠️  Affiliate ${assignment.affiliateEmail} is already assigned to another coordinator`);
        continue;
      }
      
      // Assign affiliate to coordinator
      await pool.query(
        'UPDATE users SET coordinator_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [coordinator.id, affiliate.id]
      );
      
      console.log(`✅ Assigned ${affiliate.name} (${assignment.affiliateEmail}) to ${assignment.coordinatorName}`);
    }
    
    // Show final assignments
    console.log('\n📋 Final Assignments:');
    const { rows: assignments } = await pool.query(`
      SELECT 
        a.name as affiliate_name,
        c.name as coordinator_name,
        a.email as affiliate_email,
        a.referral_code,
        a.tier,
        a.is_active
      FROM users a
      JOIN users c ON a.coordinator_id = c.id
      WHERE a.role = 'affiliate' AND c.role = 'coordinator'
      ORDER BY c.name, a.name
    `);
    
    assignments.forEach(assignment => {
      console.log(`  ${assignment.affiliate_name} (${assignment.affiliate_email}) → ${assignment.coordinator_name}`);
      console.log(`    Referral Code: ${assignment.referral_code}, Tier: ${assignment.tier}, Active: ${assignment.is_active}`);
    });
    
    console.log('\n✅ Affiliate assignments completed successfully');
    
  } catch (error) {
    console.error('❌ Error assigning affiliates:', error);
    throw error;
  } finally {
    await pool.end();
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
