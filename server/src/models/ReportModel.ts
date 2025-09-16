// src/models/ReportModel.ts
import { pool } from '../database/init';
import * as ExcelJS from 'exceljs';
import { RowDataPacket } from 'mysql2';
import { UserModel } from './User';

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

type DBRow = RowDataPacket & Record<string, any>;
type CountsRow = RowDataPacket & {
  total?: number | string;
  sent?: number | string;
  opened?: number | string;
  clicked?: number | string;
  converted?: number | string;
  pending?: number | string;
  approved?: number | string;
  paid?: number | string;
};


export class ReportModel {
  /**
   * Return all affiliate summary data used by the reports.
   */
  static async getAllAffiliateData(): Promise<AffiliateReportData[]> {
    // Fetch affiliates
    const [affiliatesRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, email, referral_code, is_active, created_at
       FROM users
       WHERE role = ?
       ORDER BY created_at DESC`,
      ['affiliate']
    );

    const reportData: AffiliateReportData[] = [];

    for (const affiliate of affiliatesRows) {
      try {
        const affiliateId = String(affiliate.id);

        // Level 1 referrals (direct)
        const [directRefRows] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM users WHERE referrer_id = ?`,
          [affiliateId]
        );
        const level1Count = directRefRows.length;

        // Level 2 referrals (those referred by level1)
        let level2Count = 0;
        let level3Count = 0;

        if (directRefRows.length > 0) {
          const directIds = directRefRows.map(r => String(r.id));
          // build placeholders
          const placeholders1 = directIds.map(() => '?').join(',');
          const [level2Rows] = await pool.query<RowDataPacket[]>(
            `SELECT id FROM users WHERE referrer_id IN (${placeholders1})`,
            directIds
          );
          level2Count = level2Rows.length;

          if (level2Rows.length > 0) {
            const level2Ids = level2Rows.map(r => String(r.id));
            const placeholders2 = level2Ids.map(() => '?').join(',');
            const [level3Rows] = await pool.query<RowDataPacket[]>(
              `SELECT id FROM users WHERE referrer_id IN (${placeholders2})`,
              level2Ids
            );
            level3Count = level3Rows.length;
          }
        }

        // Email invite counts (email_invites table)
        const [emailCountsRows] = await pool.query<RowDataPacket[]>(
  `SELECT
     COUNT(*) AS total,
     SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
     SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) AS opened,
     SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) AS clicked,
     SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) AS converted
   FROM email_invites
   WHERE affiliate_id = ?`,
  [affiliateId]
);
        const emailCounts = (emailCountsRows[0] ?? {}) as CountsRow;

        // Commission counts
       const [commissionCountsRows] = await pool.query<RowDataPacket[]>(
  `SELECT
     COUNT(*) AS total,
     SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
     SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
     SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid
   FROM commissions
   WHERE affiliate_id = ?`,
  [affiliateId]
);
        const commissionCounts = (commissionCountsRows[0] ?? {}) as CountsRow;

        const toNum = (v: any) => (v === undefined || v === null ? 0 : Number(v));

        // Determine tier (simple heuristic shown in your original code)
        const totalReferrals = level1Count + level2Count + level3Count;
        let tier = 'Starter';
        if (totalReferrals >= 50) tier = 'Gold';
        else if (totalReferrals >= 20) tier = 'Silver';
        else if (totalReferrals >= 5) tier = 'Bronze';

        reportData.push({
          affiliate: {
            id: affiliateId,
            name: affiliate.name || 'N/A',
            email: affiliate.email || '',
            referral_code: affiliate.referral_code || '',
            tier,
            status: (affiliate.is_active === 1 || affiliate.is_active === true) ? 'Active' : 'Inactive',
            created_at: affiliate.created_at ? new Date(affiliate.created_at).toISOString() : new Date().toISOString()
          },
          referrals: {
            level1: level1Count,
            level2: level2Count,
            level3: level3Count,
            total: totalReferrals
          },
          emailInvites: {
            total: toNum(emailCounts.total),
            sent: toNum(emailCounts.sent),
            opened: toNum(emailCounts.opened),
            clicked: toNum(emailCounts.clicked),
            converted: toNum(emailCounts.converted)
          },
          commissions: {
            total: toNum(commissionCounts.total),
            pending: toNum(commissionCounts.pending),
            approved: toNum(commissionCounts.approved),
            paid: toNum(commissionCounts.paid)
          }
        });
      } catch (err) {
        // Log and continue — a single affiliate failing shouldn't break the whole report
        console.error(`Error preparing report entry for affiliate ${affiliate.id}:`, err);
        continue;
      }
    }

    return reportData;
  }

  /**
   * Generate a general affiliate Excel report and return as Buffer.
   */
  static async generateExcelReport(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Affiliate Report');

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

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '366092' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    const data = await this.getAllAffiliateData();

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

      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' }
        };
      }
      row.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Summary row
    const summaryRow = worksheet.addRow({
      id: 'TOTAL',
      name: '',
      email: '',
      referral_code: '',
      tier: '',
      status: '',
      created_at: '',
      level1: data.reduce((s, it) => s + it.referrals.level1, 0),
      level2: data.reduce((s, it) => s + it.referrals.level2, 0),
      level3: data.reduce((s, it) => s + it.referrals.level3, 0),
      total_referrals: data.reduce((s, it) => s + it.referrals.total, 0),
      total_emails: data.reduce((s, it) => s + it.emailInvites.total, 0),
      sent_emails: data.reduce((s, it) => s + it.emailInvites.sent, 0),
      opened_emails: data.reduce((s, it) => s + it.emailInvites.opened, 0),
      clicked_emails: data.reduce((s, it) => s + it.emailInvites.clicked, 0),
      converted_emails: data.reduce((s, it) => s + it.emailInvites.converted, 0),
      total_commissions: data.reduce((s, it) => s + it.commissions.total, 0),
      pending_commissions: data.reduce((s, it) => s + it.commissions.pending, 0),
      approved_commissions: data.reduce((s, it) => s + it.commissions.approved, 0),
      paid_commissions: data.reduce((s, it) => s + it.commissions.paid, 0)
    });

    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9E1F2' }
    };
    summaryRow.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.eachRow((r) => {
      r.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  /**
   * Generate coordinator-level report (summary + coordinator details sheet).
   * Uses UserModel.getAllCoordinators() and UserModel.getAffiliatesByCoordinator().
   */
  static async generateCoordinatorExcelReport(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const summarySheet = workbook.addWorksheet('Summary');
    const coordinatorReportSheet = workbook.addWorksheet('Coordinator Report');

    // Summary sheet columns
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 20 },
      { header: 'Description', key: 'description', width: 40 }
    ];
    const summaryHeader = summarySheet.getRow(1);
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
    summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
    summaryHeader.alignment = { horizontal: 'center', vertical: 'middle' };

    // Fetch coordinators via UserModel (assumed implemented)
    const coordinators = await UserModel.getAllCoordinators();

    const totalCoordinators = coordinators.length;
    const activeCoordinators = coordinators.filter(c => c.is_active === 1 || c.is_active === true).length;
    const totalAffiliates = coordinators.reduce((s, c) => s + Number(c.affiliate_count || 0), 0);
    const activeAffiliates = coordinators.reduce((s, c) => s + Number(c.active_affiliate_count || 0), 0);
    const totalCommissions = coordinators.reduce((s, c) => s + Number(c.total_commissions || 0), 0);
    const totalReferrals = coordinators.reduce((s, c) => s + Number(c.total_referrals || 0), 0);

    const summaryData = [
      { metric: 'Total Coordinators', value: totalCoordinators, description: 'Number of registered coordinators' },
      { metric: 'Active Coordinators', value: activeCoordinators, description: 'Number of active coordinators' },
      { metric: 'Total Affiliates', value: totalAffiliates, description: 'Total affiliates across all networks' },
      { metric: 'Active Affiliates', value: activeAffiliates, description: 'Active affiliates across all networks' },
      { metric: 'Total Commissions', value: `AED ${totalCommissions.toFixed(2)}`, description: 'Total commissions generated' },
      { metric: 'Total Referrals', value: totalReferrals, description: 'Total referrals from all networks' },
      { metric: 'Average Affiliates per Coordinator', value: totalCoordinators > 0 ? (totalAffiliates / totalCoordinators).toFixed(1) : '0', description: 'Average network size' },
      { metric: 'Report Generated', value: new Date().toLocaleDateString(), description: 'Date this report was generated' }
    ];

    summaryData.forEach((item, i) => {
      const row = summarySheet.addRow(item);
      if (i % 2 === 1) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
      }
      row.alignment = { horizontal: 'left', vertical: 'middle' };
    });

    // Coordinator report columns
    coordinatorReportSheet.columns = [
      { header: 'Coordinator Name', key: 'coordinator_name', width: 25 },
      { header: 'Coordinator Email', key: 'coordinator_email', width: 30 },
      { header: 'Coordinator Status', key: 'coordinator_status', width: 15 },
      { header: 'Affiliate Name', key: 'affiliate_name', width: 25 },
      { header: 'Affiliate Email', key: 'affiliate_email', width: 30 },
      { header: 'Affiliate Status', key: 'affiliate_status', width: 15 },
      { header: 'Affiliate Tier', key: 'affiliate_tier', width: 12 },
      { header: 'Referral Count', key: 'referral_count', width: 15 },
      { header: 'Commission Earned', key: 'commission_earned', width: 18 },
      { header: 'Pending Commissions', key: 'pending_commissions', width: 18 },
      { header: 'Joined Date', key: 'joined_date', width: 15 }
    ];
    const coordinatorReportHeader = coordinatorReportSheet.getRow(1);
    coordinatorReportHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
    coordinatorReportHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
    coordinatorReportHeader.alignment = { horizontal: 'center', vertical: 'middle' };

    // Fill coordinator report
    let rowIndex = 0;
    for (const coordinator of coordinators) {
      try {
        const networkData = await UserModel.getAffiliatesByCoordinator(coordinator.id, 1, 1000);

        if (!networkData || !Array.isArray(networkData.affiliates) || networkData.affiliates.length === 0) {
          const row = coordinatorReportSheet.addRow({
            coordinator_name: coordinator.name,
            coordinator_email: coordinator.email,
            coordinator_status: coordinator.is_active ? 'Active' : 'Inactive',
            affiliate_name: 'No Affiliates',
            affiliate_email: 'N/A',
            affiliate_status: 'N/A',
            affiliate_tier: 'N/A',
            referral_count: 0,
            commission_earned: 'AED 0.00',
            pending_commissions: 'AED 0.00',
            joined_date: 'N/A'
          });
          if (rowIndex % 2 === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
          row.alignment = { horizontal: 'center', vertical: 'middle' };
          rowIndex++;
          continue;
        }

        for (const affiliateItem of networkData.affiliates) {
          const user = affiliateItem.user || {};
          const row = coordinatorReportSheet.addRow({
            coordinator_name: coordinator.name,
            coordinator_email: coordinator.email,
            coordinator_status: coordinator.is_active ? 'Active' : 'Inactive',
            affiliate_name: user.name || 'N/A',
            affiliate_email: user.email || 'N/A',
            affiliate_status: (user.status || 'N/A'),
            affiliate_tier: (affiliateItem.tier && affiliateItem.tier.name) ? affiliateItem.tier.name : 'N/A',
            referral_count: Number(affiliateItem.totalReferrals || 0),
            commission_earned: `AED ${Number(affiliateItem.totalEarnings || 0).toFixed(2)}`,
            pending_commissions: `AED ${Number(affiliateItem.pendingEarnings || 0).toFixed(2)}`,
            joined_date: affiliateItem.createdAt ? new Date(affiliateItem.createdAt).toLocaleDateString() : 'N/A'
          });

          if (rowIndex % 2 === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
          row.alignment = { horizontal: 'center', vertical: 'middle' };
          rowIndex++;
        }
      } catch (err) {
        console.error(`Error fetching network data for coordinator ${coordinator.id}:`, err);
      }
    }

    // Add borders
    [summarySheet, coordinatorReportSheet].forEach(sheet => {
      sheet.eachRow((r) => {
        r.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }
}
