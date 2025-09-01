import { commissionAPI, CommissionLevel } from './commissionAPI';

export interface CommissionCalculation {
  saleAmount: number;
  level: number;
  percentage: number;
  commission: number;
  description: string;
}

export interface MultiLevelCommission {
  saleAmount: number;
  levels: CommissionCalculation[];
  totalCommission: number;
  totalPercentage: number;
}

export class CommissionService {
  private static instance: CommissionService;
  private commissionLevels: CommissionLevel[] = [];
  private lastUpdated: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): CommissionService {
    if (!CommissionService.instance) {
      CommissionService.instance = new CommissionService();
    }
    return CommissionService.instance;
  }

  /**
   * Get commission levels with caching
   */
  public async getCommissionLevels(): Promise<CommissionLevel[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.commissionLevels.length > 0 && (now - this.lastUpdated) < this.CACHE_DURATION) {
      return this.commissionLevels;
    }

    try {
      const response = await commissionAPI.getCommissionLevels();
      this.commissionLevels = response.data || [];
      this.lastUpdated = now;
      return this.commissionLevels;
    } catch (error) {
      console.error('Error fetching commission levels:', error);
      // Return cached data if available, otherwise return defaults
      if (this.commissionLevels.length > 0) {
        return this.commissionLevels;
      }
      return this.getDefaultCommissionLevels();
    }
  }

  /**
   * Get commission percentage for a specific level
   */
  public async getCommissionPercentage(level: number): Promise<number> {
    const levels = await this.getCommissionLevels();
    const commissionLevel = levels.find(l => l.level === level && l.isActive);
    return commissionLevel?.percentage || 0;
  }

  /**
   * Calculate commission for a single level
   */
  public async calculateCommission(saleAmount: number, level: number): Promise<CommissionCalculation> {
    const percentage = await this.getCommissionPercentage(level);
    const levels = await this.getCommissionLevels();
    const levelInfo = levels.find(l => l.level === level);
    
    return {
      saleAmount,
      level,
      percentage,
      commission: (saleAmount * percentage) / 100,
      description: levelInfo?.description || `Level ${level} commission`
    };
  }

  /**
   * Calculate multi-level commission for a sale
   */
  public async calculateMultiLevelCommission(saleAmount: number, maxLevels: number = 3): Promise<MultiLevelCommission> {
    const levels = await this.getCommissionLevels();
    const activeLevels = levels
      .filter(level => level.isActive && level.level <= maxLevels)
      .sort((a, b) => a.level - b.level);

    const levelCalculations = await Promise.all(
      activeLevels.map(level => this.calculateCommission(saleAmount, level.level))
    );

    const totalCommission = levelCalculations.reduce((sum, calc) => sum + calc.commission, 0);
    const totalPercentage = levelCalculations.reduce((sum, calc) => sum + calc.percentage, 0);

    return {
      saleAmount,
      levels: levelCalculations,
      totalCommission,
      totalPercentage
    };
  }

  /**
   * Calculate commission for multiple sales
   */
  public async calculateBulkCommissions(sales: Array<{ amount: number; level: number }>): Promise<CommissionCalculation[]> {
    return Promise.all(
      sales.map(sale => this.calculateCommission(sale.amount, sale.level))
    );
  }

  /**
   * Calculate commission for affiliate referrals
   */
  public async calculateAffiliateCommissions(
    saleAmount: number, 
    referralChain: Array<{ affiliateId: string; level: number }>
  ): Promise<Array<{ affiliateId: string; commission: number; level: number; percentage: number }>> {
    const results = [];
    
    for (const referral of referralChain) {
      const calculation = await this.calculateCommission(saleAmount, referral.level);
      results.push({
        affiliateId: referral.affiliateId,
        commission: calculation.commission,
        level: referral.level,
        percentage: calculation.percentage
      });
    }

    return results;
  }

  /**
   * Get commission summary for dashboard
   */
  public async getCommissionSummary(): Promise<{
    totalLevels: number;
    activeLevels: number;
    totalPercentage: number;
    averagePercentage: number;
    highestPercentage: number;
    lowestPercentage: number;
  }> {
    const levels = await this.getCommissionLevels();
    const activeLevels = levels.filter(level => level.isActive);
    
    if (activeLevels.length === 0) {
      return {
        totalLevels: levels.length,
        activeLevels: 0,
        totalPercentage: 0,
        averagePercentage: 0,
        highestPercentage: 0,
        lowestPercentage: 0
      };
    }

    const percentages = activeLevels.map(level => level.percentage);
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
    const averagePercentage = totalPercentage / activeLevels.length;
    const highestPercentage = Math.max(...percentages);
    const lowestPercentage = Math.min(...percentages);

    return {
      totalLevels: levels.length,
      activeLevels: activeLevels.length,
      totalPercentage,
      averagePercentage,
      highestPercentage,
      lowestPercentage
    };
  }

  /**
   * Validate commission structure
   */
  public async validateCommissionStructure(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const levels = await this.getCommissionLevels();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate levels
    const levelNumbers = levels.map(l => l.level);
    const duplicates = levelNumbers.filter((level, index) => levelNumbers.indexOf(level) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate commission levels found: ${duplicates.join(', ')}`);
    }

    // Check for gaps in levels
    const sortedLevels = levels.sort((a, b) => a.level - b.level);
    for (let i = 0; i < sortedLevels.length - 1; i++) {
      if (sortedLevels[i + 1].level - sortedLevels[i].level > 1) {
        warnings.push(`Gap in commission levels: ${sortedLevels[i].level} to ${sortedLevels[i + 1].level}`);
      }
    }

    // Check percentage ranges
    levels.forEach(level => {
      if (level.percentage < 0) {
        errors.push(`Level ${level.level}: Commission percentage cannot be negative`);
      }
      if (level.percentage > 100) {
        errors.push(`Level ${level.level}: Commission percentage cannot exceed 100%`);
      }
    });

    // Check total commission percentage
    const activeLevels = levels.filter(level => level.isActive);
    const totalPercentage = activeLevels.reduce((sum, level) => sum + level.percentage, 0);
    if (totalPercentage > 50) {
      warnings.push(`Total commission percentage (${totalPercentage}%) is quite high`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get commission impact analysis
   */
  public async getCommissionImpactAnalysis(
    currentLevels: CommissionLevel[],
    proposedLevels: CommissionLevel[]
  ): Promise<{
    totalCostChange: number;
    levelChanges: Array<{
      level: number;
      oldPercentage: number;
      newPercentage: number;
      change: number;
      impact: string;
    }>;
    recommendations: string[];
  }> {
    const levelChanges = [];
    let totalCostChange = 0;

    for (const proposed of proposedLevels) {
      const current = currentLevels.find(l => l.level === proposed.level);
      if (current) {
        const change = proposed.percentage - current.percentage;
        const impact = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'no change';
        
        levelChanges.push({
          level: proposed.level,
          oldPercentage: current.percentage,
          newPercentage: proposed.percentage,
          change,
          impact
        });

        // Calculate cost impact (assuming $1000 average sale)
        const costImpact = (change / 100) * 1000;
        totalCostChange += costImpact;
      }
    }

    const recommendations = [];
    if (totalCostChange > 0) {
      recommendations.push('Consider reducing commission rates to maintain profitability');
    } else if (totalCostChange < 0) {
      recommendations.push('Commission reduction may improve margins but could affect affiliate motivation');
    }

    if (levelChanges.some(change => Math.abs(change.change) > 5)) {
      recommendations.push('Large commission changes may affect affiliate retention');
    }

    return {
      totalCostChange,
      levelChanges,
      recommendations
    };
  }

  /**
   * Refresh commission data
   */
  public async refreshCommissions(): Promise<void> {
    this.lastUpdated = 0;
    await this.getCommissionLevels();
  }

  /**
   * Get default commission levels
   */
  private getDefaultCommissionLevels(): CommissionLevel[] {
    return [
      {
        id: '1',
        level: 1,
        percentage: 15,
        description: 'Direct referrals commission',
        isActive: true,
        minReferrals: 0,
        maxReferrals: 999,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        level: 2,
        percentage: 5,
        description: 'Second level referrals commission',
        isActive: true,
        minReferrals: 0,
        maxReferrals: 999,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        level: 3,
        percentage: 2.5,
        description: 'Third level referrals commission',
        isActive: true,
        minReferrals: 0,
        maxReferrals: 999,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  }
}

export default CommissionService;
