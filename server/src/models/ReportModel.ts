import { pool } from '../database/init';
import * as ExcelJS from 'exceljs';

export interface AffiliateReportData {
  affiliate: {
    id: string;
    name: string;
    email: string;
    referral_code: string;
    tier: string;
    status: string;
    created_at: string;
  };
  referrals: {
    level1: number;
    level2: number;
    level3: number;
    total: number;
  };
  emailInvites: {
    total: number;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  commissions: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
  };
}

export class ReportModel {
  static async getAllAffiliateData(): Promise<AffiliateReportData[]> {
    const { rows: affiliates } = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.referral_code, u.is_active,
        u.created_at
      FROM users u 
      WHERE u.role = 'affiliate'
      ORDER BY u.created_at DESC
    `);

    const reportData: AffiliateReportData[] = [];

    for (const affiliate of affiliates) {
      // Get referral counts - we need to calculate levels properly
      const { rows: directReferrals } = await pool.query(`
        SELECT id FROM users WHERE referrer_id = $1
      `, [affiliate.id]);
      
      const level1Count = directReferrals.length;
      let level2Count = 0;
      let level3Count = 0;
      
      // Get level 2 referrals
      if (directReferrals.length > 0) {
        const directReferralIds = directReferrals.map(r => r.id);
        if (directReferralIds.length > 0) {
          const { rows: level2Referrals } = await pool.query(`
            SELECT id FROM users WHERE referrer_id = ANY($1)
          `, [directReferralIds]);
          level2Count = level2Referrals.length;
          
          // Get level 3 referrals
          if (level2Referrals.length > 0) {
            const level2ReferralIds = level2Referrals.map(r => r.id);
            if (level2ReferralIds.length > 0) {
              const { rows: level3Referrals } = await pool.query(`
                SELECT id FROM users WHERE referrer_id = ANY($1)
              `, [level2ReferralIds]);
              level3Count = level3Referrals.length;
            }
          }
        }
      }

      // Get email invite counts
      const { rows: emailCounts } = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
          COUNT(CASE WHEN status = 'opened' THEN 1 END) as opened,
          COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked,
          COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted
        FROM email_invites 
        WHERE affiliate_id = $1
      `, [affiliate.id]);

      // Get commission counts
      const { rows: commissionCounts } = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid
        FROM commissions 
        WHERE affiliate_id = $1
      `, [affiliate.id]);

      // Calculate tier based on total referrals
      const totalReferrals = level1Count + level2Count + level3Count;
      let tier = 'Starter';
      if (totalReferrals >= 50) {
        tier = 'Gold';
      } else if (totalReferrals >= 20) {
        tier = 'Silver';
      } else if (totalReferrals >= 5) {
        tier = 'Bronze';
      }

      reportData.push({
        affiliate: {
          id: affiliate.id,
          name: affiliate.name || 'N/A',
          email: affiliate.email,
          referral_code: affiliate.referral_code,
          tier: tier,
          status: affiliate.is_active ? 'Active' : 'Inactive',
          created_at: affiliate.created_at
        },
        referrals: {
          level1: level1Count,
          level2: level2Count,
          level3: level3Count,
          total: level1Count + level2Count + level3Count
        },
        emailInvites: {
          total: parseInt(emailCounts[0]?.total || '0'),
          sent: parseInt(emailCounts[0]?.sent || '0'),
          opened: parseInt(emailCounts[0]?.opened || '0'),
          clicked: parseInt(emailCounts[0]?.clicked || '0'),
          converted: parseInt(emailCounts[0]?.converted || '0')
        },
        commissions: {
          total: parseInt(commissionCounts[0]?.total || '0'),
          pending: parseInt(commissionCounts[0]?.pending || '0'),
          approved: parseInt(commissionCounts[0]?.approved || '0'),
          paid: parseInt(commissionCounts[0]?.paid || '0')
        }
      });
    }

    return reportData;
  }

  static async generateExcelReport(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Affiliate Report');

    // Set up headers
    worksheet.columns = [
      { header: 'Affiliate ID', key: 'id', width: 36 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Referral Code', key: 'referral_code', width: 15 },
      { header: 'Tier', key: 'tier', width: 10 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Joined Date', key: 'created_at', width: 15 },
      { header: 'Level 1 Referrals', key: 'level1', width: 15 },
      { header: 'Level 2 Referrals', key: 'level2', width: 15 },
      { header: 'Level 3 Referrals', key: 'level3', width: 15 },
      { header: 'Total Referrals', key: 'total_referrals', width: 15 },
      { header: 'Total Email Invites', key: 'total_emails', width: 15 },
      { header: 'Sent Emails', key: 'sent_emails', width: 15 },
      { header: 'Opened Emails', key: 'opened_emails', width: 15 },
      { header: 'Clicked Emails', key: 'clicked_emails', width: 15 },
      { header: 'Converted Emails', key: 'converted_emails', width: 15 },
      { header: 'Total Commissions', key: 'total_commissions', width: 15 },
      { header: 'Pending Commissions', key: 'pending_commissions', width: 15 },
      { header: 'Approved Commissions', key: 'approved_commissions', width: 15 },
      { header: 'Paid Commissions', key: 'paid_commissions', width: 15 }
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '366092' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Get data
    const data = await this.getAllAffiliateData();

    // Add data rows
    data.forEach((item, index) => {
      const row = worksheet.addRow({
        id: item.affiliate.id,
        name: item.affiliate.name,
        email: item.affiliate.email,
        referral_code: item.affiliate.referral_code,
        tier: item.affiliate.tier,
        status: item.affiliate.status,
        created_at: new Date(item.affiliate.created_at).toLocaleDateString(),
        level1: item.referrals.level1,
        level2: item.referrals.level2,
        level3: item.referrals.level3,
        total_referrals: item.referrals.total,
        total_emails: item.emailInvites.total,
        sent_emails: item.emailInvites.sent,
        opened_emails: item.emailInvites.opened,
        clicked_emails: item.emailInvites.clicked,
        converted_emails: item.emailInvites.converted,
        total_commissions: item.commissions.total,
        pending_commissions: item.commissions.pending,
        approved_commissions: item.commissions.approved,
        paid_commissions: item.commissions.paid
      });

      // Alternate row colors for better readability
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' }
        };
      }

      // Center align numeric columns
      row.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Add summary row at the bottom
    const summaryRow = worksheet.addRow({
      id: 'TOTAL',
      name: '',
      email: '',
      referral_code: '',
      tier: '',
      status: '',
      created_at: '',
      level1: data.reduce((sum, item) => sum + item.referrals.level1, 0),
      level2: data.reduce((sum, item) => sum + item.referrals.level2, 0),
      level3: data.reduce((sum, item) => sum + item.referrals.level3, 0),
      total_referrals: data.reduce((sum, item) => sum + item.referrals.total, 0),
      total_emails: data.reduce((sum, item) => sum + item.emailInvites.total, 0),
      sent_emails: data.reduce((sum, item) => sum + item.emailInvites.sent, 0),
      opened_emails: data.reduce((sum, item) => sum + item.emailInvites.opened, 0),
      clicked_emails: data.reduce((sum, item) => sum + item.emailInvites.clicked, 0),
      converted_emails: data.reduce((sum, item) => sum + item.emailInvites.converted, 0),
      total_commissions: data.reduce((sum, item) => sum + item.commissions.total, 0),
      pending_commissions: data.reduce((sum, item) => sum + item.commissions.pending, 0),
      approved_commissions: data.reduce((sum, item) => sum + item.commissions.approved, 0),
      paid_commissions: data.reduce((sum, item) => sum + item.commissions.paid, 0)
    });

    // Style the summary row
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9E1F2' }
    };
    summaryRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate the Excel file as buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }
}
