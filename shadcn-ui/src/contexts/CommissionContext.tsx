import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { commissionAPI, CommissionLevel, CommissionSettings } from '../services/commissionAPI';

interface CommissionContextType {
  commissionLevels: CommissionLevel[];
  commissionSettings: CommissionSettings | null;
  loading: boolean;
  error: string | null;
  refreshCommissions: () => Promise<void>;
  updateCommissionLevel: (levelId: string, data: Partial<CommissionLevel>) => Promise<void>;
  getCommissionPercentage: (level: number) => number;
  calculateCommission: (amount: number, level: number) => number;
  getActiveLevels: () => CommissionLevel[];
}

const CommissionContext = createContext<CommissionContextType | undefined>(undefined);

export const useCommission = () => {
  const context = useContext(CommissionContext);
  if (context === undefined) {
    throw new Error('useCommission must be used within a CommissionProvider');
  }
  return context;
};

interface CommissionProviderProps {
  children: ReactNode;
}

export const CommissionProvider: React.FC<CommissionProviderProps> = ({ children }) => {
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([]);
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load commission data for all users (commission rules affect everyone)
  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load commission levels and settings in parallel
      const [levelsResponse, settingsResponse] = await Promise.all([
        commissionAPI.getCommissionLevels(),
        commissionAPI.getCommissionSettings()
      ]);

      setCommissionLevels(levelsResponse.data || []);
      setCommissionSettings(settingsResponse.data || null);
    } catch (err) {
      console.error('Error loading commission data:', err);
      setError('Failed to load commission data');
      
      // Set default commission levels if API fails
      setCommissionLevels([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refreshCommissions = async () => {
    await loadCommissionData();
  };

  const updateCommissionLevel = async (levelId: string, data: Partial<CommissionLevel>) => {
    try {
      // Update in backend
      await commissionAPI.updateCommissionLevel(levelId, data);
      
      // Update local state
      setCommissionLevels(prev => 
        prev.map(level => 
          level.id === levelId 
            ? { ...level, ...data, updatedAt: new Date().toISOString() }
            : level
        )
      );
    } catch (error) {
      console.error('Error updating commission level:', error);
      throw error;
    }
  };

  const getCommissionPercentage = (level: number): number => {
    const commissionLevel = commissionLevels.find(l => l.level === level && l.isActive);
    return commissionLevel?.percentage || 0;
  };

  const calculateCommission = (amount: number, level: number): number => {
    const percentage = getCommissionPercentage(level);
    return (amount * percentage) / 100;
  };

  const getActiveLevels = (): CommissionLevel[] => {
    return commissionLevels.filter(level => level.isActive);
  };

  const value: CommissionContextType = {
    commissionLevels,
    commissionSettings,
    loading,
    error,
    refreshCommissions,
    updateCommissionLevel,
    getCommissionPercentage,
    calculateCommission,
    getActiveLevels
  };

  return (
    <CommissionContext.Provider value={value}>
      {children}
    </CommissionContext.Provider>
  );
};

export default CommissionContext;
