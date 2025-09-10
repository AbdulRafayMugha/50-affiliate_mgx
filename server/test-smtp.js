const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTP() {
  console.log('🔧 Testing SMTP Configuration...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
  console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'NOT SET');
  console.log('FROM_NAME:', process.env.FROM_NAME || 'NOT SET');
  console.log('');

  // Check if required variables are set
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('\n📝 Please add these to your .env file:');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=info@reffalplan.com');
    console.log('SMTP_PASS=your_app_password_here');
    console.log('FROM_EMAIL=info@reffalplan.com');
    console.log('FROM_NAME=ReffalPlan Affiliate System');
    return;
  }

  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
    
    console.log('📧 Sending test email...');
    const result = await transporter.sendMail({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: 'test@example.com', // Change this to your email for testing
      subject: 'ReffalPlan SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">SMTP Test Successful!</h2>
          <p>This is a test email from your ReffalPlan affiliate system.</p>
          <p>If you receive this email, your SMTP configuration is working correctly.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The ReffalPlan Team
            </p>
          </div>
        </div>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('\n🎉 SMTP configuration is working correctly!');
    
  } catch (error) {
    console.error('❌ SMTP test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔐 Authentication failed. This usually means:');
      console.log('1. Wrong email or password');
      console.log('2. Need to use App Password instead of regular password');
      console.log('3. 2-Factor Authentication not enabled');
      console.log('\n📝 For Gmail, you need to:');
      console.log('1. Enable 2-Factor Authentication');
      console.log('2. Generate an App Password');
      console.log('3. Use the App Password in SMTP_PASS');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Connection failed. Check:');
      console.log('1. SMTP_HOST is correct');
      console.log('2. SMTP_PORT is correct');
      console.log('3. Internet connection is working');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n⏰ Connection timeout. Check:');
      console.log('1. Firewall settings');
      console.log('2. Network connectivity');
      console.log('3. SMTP server status');
    }
  }
}

testSMTP().catch(console.error);
