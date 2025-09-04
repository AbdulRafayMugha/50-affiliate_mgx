import { initDatabase, pool } from './init';
import bcrypt from 'bcryptjs';

const COORDINATORS = [
  {
    name: 'Hadi',
    email: 'hadi@coordinator.com',
    password: 'coordinator123',
    role: 'coordinator'
  },
  {
    name: 'Nouman',
    email: 'nouman@coordinator.com',
    password: 'coordinator123',
    role: 'coordinator'
  },
  {
    name: 'Naveed',
    email: 'naveed@coordinator.com',
    password: 'coordinator123',
    role: 'coordinator'
  }
];

const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const seedCoordinators = async () => {
  try {
    await initDatabase({ isMigration: true });
    
    console.log('Seeding coordinators...');
    
    for (const coordinator of COORDINATORS) {
      // Check if coordinator already exists
      const { rows: existingUser } = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [coordinator.email]
      );
      
      if (existingUser.length > 0) {
        console.log(`✅ Coordinator ${coordinator.name} already exists`);
        continue;
      }
      
      // Hash password
      const password_hash = await bcrypt.hash(coordinator.password, 12);
      
      // Generate unique referral code
      let referral_code: string;
      let isUnique = false;
      
      while (!isUnique) {
        referral_code = generateReferralCode();
        const { rows } = await pool.query(
          'SELECT id FROM users WHERE referral_code = $1',
          [referral_code]
        );
        isUnique = rows.length === 0;
      }
      
      // Create coordinator
      const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, name, role, referral_code, tier, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email, name, role, referral_code`,
        [coordinator.email, password_hash, coordinator.name, coordinator.role, referral_code, 'Gold', true, true]
      );
      
      console.log(`✅ Created coordinator: ${coordinator.name} (${coordinator.email})`);
      console.log(`   Referral Code: ${referral_code}`);
    }
    
    console.log('✅ All coordinators seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding coordinators:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedCoordinators()
    .then(() => {
      console.log('Coordinator seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Coordinator seeding failed:', error);
      process.exit(1);
    });
}

export default seedCoordinators;
