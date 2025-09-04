import { initDatabase, pool } from './init';

const fixRafayAssignment = async () => {
  try {
    await initDatabase({ isMigration: true });
    
    console.log('Checking and fixing Rafay assignment...');
    
    // Check if Rafay exists
    const { rows: rafayRows } = await pool.query(
      'SELECT id, name, email, coordinator_id FROM users WHERE email = $1 AND role = $2',
      ['rafay@example.com', 'affiliate']
    );
    
    if (rafayRows.length === 0) {
      console.log('❌ Rafay (rafay@example.com) not found in database');
      return;
    }
    
    const rafay = rafayRows[0];
    console.log(`✅ Found Rafay: ${rafay.name} (${rafay.email})`);
    console.log(`   Current coordinator_id: ${rafay.coordinator_id}`);
    
    // Find Naveed
    const { rows: naveedRows } = await pool.query(
      'SELECT id, name FROM users WHERE name = $1 AND role = $2',
      ['Naveed', 'coordinator']
    );
    
    if (naveedRows.length === 0) {
      console.log('❌ Naveed coordinator not found');
      return;
    }
    
    const naveed = naveedRows[0];
    console.log(`✅ Found Naveed: ${naveed.name} (${naveed.id})`);
    
    // Assign Rafay to Naveed
    await pool.query(
      'UPDATE users SET coordinator_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [naveed.id, rafay.id]
    );
    
    console.log(`✅ Assigned Rafay to Naveed successfully`);
    
    // Show all current assignments
    console.log('\n📋 All Current Assignments:');
    const { rows: assignments } = await pool.query(`
      SELECT 
        a.name as affiliate_name,
        a.email as affiliate_email,
        c.name as coordinator_name,
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
    
  } catch (error) {
    console.error('❌ Error fixing Rafay assignment:', error);
    throw error;
  } finally {
    await pool.end();
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
