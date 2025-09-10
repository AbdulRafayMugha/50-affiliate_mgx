const axios = require('axios');
require('dotenv').config();

async function testDynamicCommissionRates() {
  console.log('🧪 Testing Dynamic Commission Rates API...\n');
  
  try {
    console.log('📊 Fetching current commission rates...');
    
    const response = await axios.get('http://localhost:3001/api/commission/current-rates', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Commission rates fetched successfully!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    const rates = response.data;
    console.log('\n📈 Current Commission Structure:');
    console.log(`Level 1 (Direct Referrals): ${rates.level1}%`);
    console.log(`Level 2 (Sub-affiliates): ${rates.level2}%`);
    console.log(`Level 3 (Sub-sub-affiliates): ${rates.level3}%`);
    console.log(`Last Updated: ${new Date(rates.lastUpdated).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Failed to fetch commission rates:');
    
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

testDynamicCommissionRates().catch(console.error);

