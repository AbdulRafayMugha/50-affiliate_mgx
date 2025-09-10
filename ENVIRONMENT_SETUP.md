# Environment Configuration Guide

## Required Environment Variables

Add these variables to your `.env` file in the server directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/affiliate_system
DB_HOST=localhost
DB_PORT=5432
DB_NAME=affiliate_system
DB_USER=username
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Commission Configuration
LEVEL_1_COMMISSION=15
LEVEL_2_COMMISSION=5
LEVEL_3_COMMISSION=2.5

# Company Email Configuration
COMPANY_EMAIL=info@reffalplan.com
COMPANY_NAME=ReffalPlan

# SMTP Configuration for Email Sending
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@reffalplan.com
SMTP_PASS=your_app_password_here
FROM_EMAIL=info@reffalplan.com
FROM_NAME=ReffalPlan Affiliate System

# Email Templates Configuration
EMAIL_TEMPLATES_PATH=./src/templates/emails

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# Odoo Integration Configuration (Optional)
ODOO_WEBHOOK_URL=https://yourdomain.com/api/odoo/webhook
ODOO_WEBHOOK_SECRET=your_odoo_webhook_secret
```

## SMTP Setup Instructions

### For Gmail (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

3. **Update your .env file**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=info@reffalplan.com
   SMTP_PASS=your_16_character_app_password
   FROM_EMAIL=info@reffalplan.com
   FROM_NAME=ReffalPlan Affiliate System
   ```

### For Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@reffalplan.com
SMTP_PASS=your_password
```

#### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@reffalplan.com
SMTP_PASS=your_password
```

## Email Service Implementation

### 1. Install Email Dependencies

```bash
cd server
npm install nodemailer @types/nodemailer
```

### 2. Create Email Service

Create `server/src/services/emailService.ts`:

```typescript
import nodemailer from 'nodemailer';

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendWelcomeEmail(to: string, affiliateName: string, referralCode: string) {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'Welcome to ReffalPlan Affiliate Program',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to ReffalPlan!</h2>
          <p>Dear ${affiliateName},</p>
          <p>Welcome to the ReffalPlan affiliate program! Your account has been successfully created.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Your Referral Information</h3>
            <p><strong>Referral Code:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${referralCode}</code></p>
            <p><strong>Referral Link:</strong> <a href="${process.env.FRONTEND_URL}/?ref=${referralCode}">${process.env.FRONTEND_URL}/?ref=${referralCode}</a></p>
          </div>

          <p>Start earning commissions by sharing your referral link with potential customers!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The ReffalPlan Team<br>
              <a href="mailto:${process.env.COMPANY_EMAIL}">${process.env.COMPANY_EMAIL}</a>
            </p>
          </div>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  async sendCommissionNotification(to: string, affiliateName: string, commissionData: any) {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'New Commission Earned - ReffalPlan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Congratulations! You've Earned a Commission</h2>
          <p>Dear ${affiliateName},</p>
          <p>Great news! You've earned a new commission from your referral.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #15803d; margin-top: 0;">Commission Details</h3>
            <p><strong>Amount:</strong> ${commissionData.amount} AED</p>
            <p><strong>Level:</strong> Level ${commissionData.level}</p>
            <p><strong>Rate:</strong> ${commissionData.rate}%</p>
            <p><strong>Transaction ID:</strong> ${commissionData.transactionId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p>Keep up the great work! Continue sharing your referral link to earn more commissions.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The ReffalPlan Team<br>
              <a href="mailto:${process.env.COMPANY_EMAIL}">${process.env.COMPANY_EMAIL}</a>
            </p>
          </div>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Commission notification sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending commission notification:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'Password Reset - ReffalPlan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Password Reset Request</h2>
          <p>You requested a password reset for your ReffalPlan account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this password reset, please ignore this email.
          </p>
          
          <p style="color: #6b7280; font-size: 12px;">
            This link will expire in 1 hour for security reasons.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The ReffalPlan Team<br>
              <a href="mailto:${process.env.COMPANY_EMAIL}">${process.env.COMPANY_EMAIL}</a>
            </p>
          </div>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
}
```

## Testing Email Configuration

### 1. Test SMTP Connection

Create a test script `server/test-email.js`:

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    const result = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: 'test@example.com',
      subject: 'Test Email from ReffalPlan',
      text: 'This is a test email to verify SMTP configuration.',
    });
    
    console.log('✅ Test email sent successfully:', result.messageId);
  } catch (error) {
    console.error('❌ SMTP test failed:', error);
  }
}

testEmail();
```

### 2. Run Test

```bash
cd server
node test-email.js
```

## Security Notes

1. **Never commit .env file** to version control
2. **Use app passwords** for Gmail instead of regular passwords
3. **Enable 2FA** on your email account
4. **Use environment-specific** SMTP settings for production
5. **Monitor email sending** to avoid spam issues

## Production Considerations

1. **Use dedicated email service** like SendGrid, Mailgun, or AWS SES
2. **Implement email rate limiting** to prevent abuse
3. **Add email templates** for better formatting
4. **Set up email monitoring** and logging
5. **Configure SPF, DKIM, and DMARC** records for better deliverability
