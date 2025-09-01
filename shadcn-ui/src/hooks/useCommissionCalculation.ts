import { useState, useEffect, useCallback } from 'react';
import { useCommission } from '../contexts/CommissionContext';
import CommissionService from '../services/commissionService';

export const useCommissionCalculation = () => {
  const { commissionLevels, loading, error } = useCommission();
  const [commissionService] = useState(() => CommissionService.getInstance());

  // Calculate commission for a single level
  const calculateCommission = useCallback((saleAmount: number, level: number) => {
    const commissionLevel = commissionLevels.find(l => l.level === level && l.isActive);
    if (!commissionLevel) return 0;
    
    return (saleAmount * commissionLevel.percentage) / 100;
  }, [commissionLevels]);

  // Calculate multi-level commission
  const calculateMultiLevelCommission = useCallback((saleAmount: number, maxLevels: number = 3) => {
    const activeLevels = commissionLevels
      .filter(level => level.isActive && level.level <= maxLevels)
      .sort((a, b) => a.level - b.level);

    const levelCalculations = activeLevels.map(level => ({
      level: level.level,
      percentage: level.percentage,
      commission: (saleAmount * level.percentage) / 100,
      description: level.description
    }));

    const totalCommission = levelCalculations.reduce((sum, calc) => sum + calc.commission, 0);
    const totalPercentage = activeLevels.reduce((sum, level) => sum + level.percentage, 0);

    return {
      saleAmount,
      levels: levelCalculations,
      totalCommission,
      totalPercentage
    };
  }, [commissionLevels]);

  // Get commission percentage for a level
  const getCommissionPercentage = useCallback((level: number) => {
    const commissionLevel = commissionLevels.find(l => l.level === level && l.isActive);
    return commissionLevel?.percentage || 0;
  }, [commissionLevels]);

  // Get active commission levels
  const getActiveLevels = useCallback(() => {
    return commissionLevels.filter(level => level.isActive);
  }, [commissionLevels]);

  // Calculate commission for affiliate referrals
  const calculateAffiliateCommissions = useCallback((
    saleAmount: number, 
    referralChain: Array<{ affiliateId: string; level: number }>
  ) => {
    return referralChain.map(referral => {
      const commission = calculateCommission(saleAmount, referral.level);
      const percentage = getCommissionPercentage(referral.level);
      
      return {
        affiliateId: referral.affiliateId,
        commission,
        level: referral.level,
        percentage
      };
    });
  }, [commissionLevels, calculateCommission, getCommissionPercentage]);

  // Get commission summary
  const getCommissionSummary = useCallback(() => {
    const activeLevels = commissionLevels.filter(level => level.isActive);
    
    if (activeLevels.length === 0) {
      return {
        totalLevels: commissionLevels.length,
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
      totalLevels: commissionLevels.length,
      activeLevels: activeLevels.length,
      totalPercentage,
      averagePercentage,
      highestPercentage,
      lowestPercentage
    };
  }, [commissionLevels]);

  // Validate commission structure
  const validateCommissionStructure = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate levels
    const levelNumbers = commissionLevels.map(l => l.level);
    const duplicates = levelNumbers.filter((level, index) => levelNumbers.indexOf(level) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate commission levels found: ${duplicates.join(', ')}`);
    }

    // Check percentage ranges
    commissionLevels.forEach(level => {
      if (level.percentage < 0) {
        errors.push(`Level ${level.level}: Commission percentage cannot be negative`);
      }
      if (level.percentage > 100) {
        errors.push(`Level ${level.level}: Commission percentage cannot exceed 100%`);
      }
    });

    // Check total commission percentage
    const activeLevels = commissionLevels.filter(level => level.isActive);
    const totalPercentage = activeLevels.reduce((sum, level) => sum + level.percentage, 0);
    if (totalPercentage > 50) {
      warnings.push(`Total commission percentage (${totalPercentage}%) is quite high`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [commissionLevels]);

  // Calculate commission scenarios
  const calculateScenarios = useCallback((saleAmounts: number[]) => {
    return saleAmounts.map(amount => ({
      saleAmount: amount,
      ...calculateMultiLevelCommission(amount)
    }));
  }, [calculateMultiLevelCommission]);

  // Get commission breakdown for display
  const getCommissionBreakdown = useCallback((saleAmount: number) => {
    const activeLevels = commissionLevels.filter(level => level.isActive);
    
    return activeLevels.map(level => ({
      level: level.level,
      percentage: level.percentage,
      commission: (saleAmount * level.percentage) / 100,
      description: level.description,
      isActive: level.isActive
    }));
  }, [commissionLevels]);

  // Calculate commission for different referral counts
  const calculateReferralCommissions = useCallback((
    saleAmount: number, 
    referralCounts: Array<{ level: number; count: number }>
  ) => {
    return referralCounts.map(({ level, count }) => {
      const commission = calculateCommission(saleAmount, level);
      return {
        level,
        count,
        commission,
        totalCommission: commission * count
      };
    });
  }, [calculateCommission]);

  // Get commission efficiency metrics
  const getCommissionEfficiency = useCallback(() => {
    const summary = getCommissionSummary();
    const activeLevels = commissionLevels.filter(level => level.isActive);
    
    if (activeLevels.length === 0) return null;

    const levelEfficiency = activeLevels.map(level => ({
      level: level.level,
      percentage: level.percentage,
      efficiency: level.percentage / summary.averagePercentage,
      description: level.description
    }));

    return {
      summary,
      levelEfficiency,
      recommendations: []
    };
  }, [commissionLevels, getCommissionSummary]);

  return {
    // Data
    commissionLevels,
    loading,
    error,
    
    // Core functions
    calculateCommission,
    calculateMultiLevelCommission,
    getCommissionPercentage,
    getActiveLevels,
    
    // Advanced functions
    calculateAffiliateCommissions,
    getCommissionSummary,
    validateCommissionStructure,
    calculateScenarios,
    getCommissionBreakdown,
    calculateReferralCommissions,
    getCommissionEfficiency,
    
    // Utility functions
    isLevelActive: (level: number) => commissionLevels.some(l => l.level === level && l.isActive),
    getLevelDescription: (level: number) => commissionLevels.find(l => l.level === level)?.description || '',
    getTotalCommissionPercentage: () => commissionLevels.filter(l => l.isActive).reduce((sum, l) => sum + l.percentage, 0)
  };
};

export default useCommissionCalculation;
