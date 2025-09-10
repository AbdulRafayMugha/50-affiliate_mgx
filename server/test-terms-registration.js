const axios = require('axios');
require('dotenv').config();

async function testTermsRegistration() {
  console.log('🧪 Testing Registration with Terms and Conditions...\n');
  
  const testUser = {
    name: 'Test User',
    email: 'test-terms@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    termsAccepted: true
  };

  try {
    console.log('📝 Attempting registration with terms acceptance...');
    console.log('User data:', { ...testUser, password: '***', confirmPassword: '***' });
    
    const response = await axios.post('http://localhost:3001/api/auth/register', {
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      referralCode: ''
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.requires_verification) {
      console.log('\n📧 Email verification required. Check your email for:');
      console.log('1. Email verification link');
      console.log('2. Terms and conditions email (after verification)');
    }
    
  } catch (error) {
    console.error('❌ Registration failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error('Make sure to start the server with: npm run dev');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testTermsRegistration().catch(console.error);

