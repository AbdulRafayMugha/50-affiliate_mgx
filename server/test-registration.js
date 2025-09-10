const axios = require('axios');
require('dotenv').config();

async function testRegistration() {
  console.log('🧪 Testing Registration Endpoint...\n');
  
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    role: 'affiliate'
  };

  try {
    console.log('📝 Attempting registration...');
    console.log('User data:', { ...testUser, password: '***' });
    
    const response = await axios.post('http://localhost:3001/api/auth/register', testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
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

testRegistration().catch(console.error);
