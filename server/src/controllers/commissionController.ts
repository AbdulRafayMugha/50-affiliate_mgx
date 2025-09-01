import { Request, Response } from 'express';
import { CommissionLevelModel } from '../models/CommissionLevel';

export const getCommissionLevels = async (req: Request, res: Response) => {
  try {
    const levels = await CommissionLevelModel.getAll();
    res.json(levels);
  } catch (error) {
    console.error('Error fetching commission levels:', error);
    res.status(500).json({ error: 'Failed to fetch commission levels' });
  }
};

export const getCommissionLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const level = await CommissionLevelModel.getById(id);
    
    if (!level) {
      return res.status(404).json({ error: 'Commission level not found' });
    }
    
    res.json(level);
  } catch (error) {
    console.error('Error fetching commission level:', error);
    res.status(500).json({ error: 'Failed to fetch commission level' });
  }
};

export const createCommissionLevel = async (req: Request, res: Response) => {
  try {
    const { level, percentage, description, isActive, minReferrals, maxReferrals } = req.body;
    
    // Validation
    if (!level || !percentage || !description) {
      return res.status(400).json({ error: 'Level, percentage, and description are required' });
    }
    
    if (level < 1 || level > 3) {
      return res.status(400).json({ error: 'Level must be between 1 and 3' });
    }
    
    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
    }
    
    const newLevel = await CommissionLevelModel.create({
      level,
      percentage,
      description,
      isActive: isActive !== undefined ? isActive : true,
      minReferrals,
      maxReferrals
    });
    
    res.status(201).json(newLevel);
  } catch (error) {
    console.error('Error creating commission level:', error);
    res.status(500).json({ error: 'Failed to create commission level' });
  }
};

export const updateCommissionLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validation
    if (updateData.percentage !== undefined && (updateData.percentage < 0 || updateData.percentage > 100)) {
      return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
    }
    
    if (updateData.level !== undefined && (updateData.level < 1 || updateData.level > 3)) {
      return res.status(400).json({ error: 'Level must be between 1 and 3' });
    }
    
    const updatedLevel = await CommissionLevelModel.update(id, updateData);
    
    if (!updatedLevel) {
      return res.status(404).json({ error: 'Commission level not found' });
    }
    
    res.json(updatedLevel);
  } catch (error) {
    console.error('Error updating commission level:', error);
    res.status(500).json({ error: 'Failed to update commission level' });
  }
};

export const deleteCommissionLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await CommissionLevelModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Commission level not found' });
    }
    
    res.json({ message: 'Commission level deleted successfully' });
  } catch (error) {
    console.error('Error deleting commission level:', error);
    res.status(500).json({ error: 'Failed to delete commission level' });
  }
};

export const toggleCommissionLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }
    
    const updatedLevel = await CommissionLevelModel.toggleStatus(id, isActive);
    
    if (!updatedLevel) {
      return res.status(404).json({ error: 'Commission level not found' });
    }
    
    res.json(updatedLevel);
  } catch (error) {
    console.error('Error toggling commission level:', error);
    res.status(500).json({ error: 'Failed to toggle commission level' });
  }
};

export const getCommissionSettings = async (req: Request, res: Response) => {
  try {
    const settings = await CommissionLevelModel.getSettings();
    
    if (!settings) {
      return res.status(404).json({ error: 'Commission settings not found' });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching commission settings:', error);
    res.status(500).json({ error: 'Failed to fetch commission settings' });
  }
};

export const updateCommissionSettings = async (req: Request, res: Response) => {
  try {
    const updateData = req.body;
    
    // Validation
    if (updateData.defaultLevel1Commission !== undefined && 
        (updateData.defaultLevel1Commission < 0 || updateData.defaultLevel1Commission > 100)) {
      return res.status(400).json({ error: 'Default level 1 commission must be between 0 and 100' });
    }
    
    if (updateData.defaultLevel2Commission !== undefined && 
        (updateData.defaultLevel2Commission < 0 || updateData.defaultLevel2Commission > 100)) {
      return res.status(400).json({ error: 'Default level 2 commission must be between 0 and 100' });
    }
    
    if (updateData.defaultLevel3Commission !== undefined && 
        (updateData.defaultLevel3Commission < 0 || updateData.defaultLevel3Commission > 100)) {
      return res.status(400).json({ error: 'Default level 3 commission must be between 0 and 100' });
    }
    
    if (updateData.minimumCommission !== undefined && 
        (updateData.minimumCommission < 0 || updateData.minimumCommission > 100)) {
      return res.status(400).json({ error: 'Minimum commission must be between 0 and 100' });
    }
    
    if (updateData.maximumCommission !== undefined && 
        (updateData.maximumCommission < 0 || updateData.maximumCommission > 100)) {
      return res.status(400).json({ error: 'Maximum commission must be between 0 and 100' });
    }
    
    const updatedSettings = await CommissionLevelModel.updateSettings(updateData);
    
    if (!updatedSettings) {
      return res.status(404).json({ error: 'Commission settings not found' });
    }
    
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating commission settings:', error);
    res.status(500).json({ error: 'Failed to update commission settings' });
  }
};

export const resetToDefaults = async (req: Request, res: Response) => {
  try {
    await CommissionLevelModel.resetToDefaults();
    res.json({ message: 'Commission levels reset to defaults successfully' });
  } catch (error) {
    console.error('Error resetting commission levels:', error);
    res.status(500).json({ error: 'Failed to reset commission levels' });
  }
};

export const calculateCommissions = async (req: Request, res: Response) => {
  try {
    const { saleAmount, numReferrals = 1 } = req.body;
    
    if (!saleAmount || saleAmount <= 0) {
      return res.status(400).json({ error: 'Sale amount must be greater than 0' });
    }
    
    if (numReferrals < 1 || numReferrals > 3) {
      return res.status(400).json({ error: 'Number of referrals must be between 1 and 3' });
    }
    
    const levels = await CommissionLevelModel.getAll();
    const activeLevels = levels.filter(level => level.isActive);
    
    const levelBreakdown = activeLevels.slice(0, numReferrals).map(level => ({
      level: level.level,
      percentage: level.percentage,
      commission: (saleAmount * level.percentage) / 100,
      totalForReferrals: 0
    }));
    
    const totalCommission = levelBreakdown.reduce((sum, level) => sum + level.commission, 0);
    
    res.json({
      saleAmount,
      numReferrals,
      levelBreakdown,
      totalCommission,
      totalCommissionForReferrals: totalCommission
    });
  } catch (error) {
    console.error('Error calculating commissions:', error);
    res.status(500).json({ error: 'Failed to calculate commissions' });
  }
};
