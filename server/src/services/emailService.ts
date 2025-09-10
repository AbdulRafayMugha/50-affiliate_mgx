import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { CommissionLevelModel } from '../models/CommissionLevel';

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

  // Generate secure random token
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send email verification
  async sendEmailVerification(to: string, name: string, verificationToken: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'Verify Your Email - ReffalPlan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Welcome to ReffalPlan!</h1>
            <p style="color: #6b7280; margin: 5px 0;">Affiliate Marketing Platform</p>
          </div>
          
          <p>Dear ${name},</p>
          <p>Thank you for signing up with ReffalPlan! To complete your registration and start earning commissions, please verify your email address.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">What happens next?</h3>
            <ul style="color: #4b5563; line-height: 1.6;">
              <li>Click the verification button above</li>
              <li>Your account will be activated</li>
              <li>You'll receive your unique referral code</li>
              <li>Start sharing and earning commissions!</li>
            </ul>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <p style="color: #6b7280; font-size: 12px;">
            This verification link will expire in 24 hours for security reasons.
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
      console.log('Email verification sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending email verification:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(to: string, name: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'Password Reset - ReffalPlan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0;">Password Reset Request</h1>
            <p style="color: #6b7280; margin: 5px 0;">ReffalPlan Account Security</p>
          </div>
          
          <p>Dear ${name},</p>
          <p>We received a request to reset your password for your ReffalPlan account. If you made this request, click the button below to reset your password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0;">Security Notice</h3>
            <ul style="color: #991b1b; line-height: 1.6;">
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, ignore this email</li>
              <li>Your password won't change until you click the link</li>
              <li>Contact support if you have concerns</li>
            </ul>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #dc2626; word-break: break-all;">${resetUrl}</a>
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

  // Send welcome email after verification
  async sendWelcomeEmail(to: string, affiliateName: string, referralCode: string) {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'Welcome to ReffalPlan Affiliate Program',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">🎉 Welcome to ReffalPlan!</h1>
            <p style="color: #6b7280; margin: 5px 0;">Your account is now active</p>
          </div>
          
          <p>Dear ${affiliateName},</p>
          <p>Congratulations! Your email has been verified and your ReffalPlan affiliate account is now active. You can start earning commissions right away!</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #15803d; margin-top: 0;">Your Referral Information</h3>
            <p><strong>Referral Code:</strong> <code style="background-color: #dcfce7; padding: 8px 12px; border-radius: 6px; font-size: 16px; font-weight: bold; color: #15803d;">${referralCode}</code></p>
            <p><strong>Referral Link:</strong> <a href="${process.env.FRONTEND_URL}/?ref=${referralCode}" style="color: #16a34a; word-break: break-all;">${process.env.FRONTEND_URL}/?ref=${referralCode}</a></p>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">How to Start Earning</h3>
            <ol style="color: #4b5563; line-height: 1.6;">
              <li><strong>Share your referral link</strong> with potential customers</li>
              <li><strong>When they make a purchase</strong> using your link, you earn commission</li>
              <li><strong>Track your earnings</strong> in your affiliate dashboard</li>
              <li><strong>Get paid</strong> according to your commission schedule</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Access Your Dashboard
            </a>
          </div>
          
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

  // Send commission notification
  async sendCommissionNotification(to: string, affiliateName: string, commissionData: any) {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'New Commission Earned - ReffalPlan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">💰 Commission Earned!</h1>
            <p style="color: #6b7280; margin: 5px 0;">Great job, ${affiliateName}!</p>
          </div>
          
          <p>Congratulations! You've earned a new commission from your referral.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #15803d; margin-top: 0;">Commission Details</h3>
            <p><strong>Amount:</strong> ${commissionData.amount} AED</p>
            <p><strong>Level:</strong> Level ${commissionData.level}</p>
            <p><strong>Rate:</strong> ${commissionData.rate}%</p>
            <p><strong>Transaction ID:</strong> ${commissionData.transactionId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p>Keep up the excellent work! Continue sharing your referral link to earn more commissions.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              View Your Earnings
            </a>
          </div>
          
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

  // Send terms and conditions email
  async sendTermsAndConditionsEmail(to: string, name: string) {
    // Get current commission rates
    let commissionRates = { level1: 15, level2: 5, level3: 2.5 };
    try {
      const settings = await CommissionLevelModel.getSettings();
      if (settings) {
        commissionRates = {
          level1: settings.defaultLevel1Commission,
          level2: settings.defaultLevel2Commission,
          level3: settings.defaultLevel3Commission
        };
      }
    } catch (error) {
      console.error('Failed to fetch commission rates for email:', error);
    }

    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'Terms and Conditions - ReffalPlan Affiliate System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">📋 Terms and Conditions</h1>
            <p style="color: #6b7280; margin: 5px 0;">ReffalPlan Affiliate System</p>
          </div>
          
          <p>Dear ${name},</p>
          <p>Thank you for registering with ReffalPlan! As promised, please find attached a copy of our Terms and Conditions that you agreed to during registration.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1e40af; margin-top: 0;">Important Information</h3>
            <ul style="color: #1e3a8a; line-height: 1.6;">
              <li>Your account is now active and ready to use</li>
              <li>Please keep this document for your records</li>
              <li>These terms govern your participation in our affiliate program</li>
              <li>Contact support if you have any questions</li>
            </ul>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Key Points to Remember</h3>
            <div style="color: #4b5563; line-height: 1.6;">
              <p><strong>Commission Structure:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Level 1 (Direct Referrals): ${commissionRates.level1}% commission</li>
                <li>Level 2 (Sub-affiliates): ${commissionRates.level2}% commission</li>
                <li>Level 3 (Sub-sub-affiliates): ${commissionRates.level3}% commission</li>
              </ul>
              <p><strong>Payment Terms:</strong> Monthly payments, 30 days after month-end, $50 minimum payout</p>
              <p><strong>Prohibited Activities:</strong> No fraud, spam, or artificial inflation of transactions</p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Access Your Dashboard
            </a>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">📄 Complete Terms and Conditions</h3>
            <p style="color: #78350f; margin: 0;">
              For the complete terms and conditions document, please visit our website or contact support. 
              This email contains a summary of key points for your convenience.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The ReffalPlan Team<br>
              <a href="mailto:${process.env.COMPANY_EMAIL}">${process.env.COMPANY_EMAIL}</a><br>
              <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a>
            </p>
          </div>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Terms and conditions email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending terms and conditions email:', error);
      throw error;
    }
  }

  // Test email connection
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection successful!');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }
}
