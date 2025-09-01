import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Settings, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import CommissionCalculator from './CommissionCalculator';
import { commissionAPI } from '../../services/commissionAPI';
import { useCommission } from '../../contexts/CommissionContext';

interface CommissionLevel {
  id: string;
  level: number;
  percentage: number;
  description: string;
  isActive: boolean;
  minReferrals?: number;
  maxReferrals?: number;
  createdAt: string;
  updatedAt: string;
}

interface CommissionSettings {
  globalCommissionEnabled: boolean;
  defaultLevel1Commission: number;
  defaultLevel2Commission: number;
  defaultLevel3Commission: number;
  maxCommissionLevels: number;
  autoAdjustEnabled: boolean;
  minimumCommission: number;
  maximumCommission: number;
}

const CommissionManagement: React.FC = () => {
  const { 
    commissionLevels, 
    commissionSettings, 
    loading: contextLoading, 
    updateCommissionLevel: contextUpdateLevel 
  } = useCommission();

  const [settings, setSettings] = useState<CommissionSettings>({
    globalCommissionEnabled: true,
    defaultLevel1Commission: 15,
    defaultLevel2Commission: 5,
    defaultLevel3Commission: 2.5,
    maxCommissionLevels: 5,
    autoAdjustEnabled: false,
    minimumCommission: 0.1,
    maximumCommission: 50
  });

  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [newLevel, setNewLevel] = useState<Partial<CommissionLevel>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Calculate total commission percentage
  const totalCommissionPercentage = commissionLevels
    .filter(level => level.isActive)
    .reduce((sum, level) => sum + level.percentage, 0);

  // Calculate potential earnings for different scenarios
  const calculatePotentialEarnings = (saleAmount: number) => {
    return commissionLevels
      .filter(level => level.isActive)
      .map(level => ({
        level: level.level,
        commission: (saleAmount * level.percentage) / 100,
        percentage: level.percentage
      }));
  };

  const handleSaveLevel = async (levelId: string) => {
    setLoading(true);
    try {
      // Update in backend via context (which handles both API and local state)
      await contextUpdateLevel(levelId, newLevel);
      
      setEditingLevel(null);
      setNewLevel({});
      toast({
        title: "Success",
        description: "Commission level updated successfully in backend and all components",
      });
    } catch (error) {
      console.error('Error updating commission level:', error);
      toast({
        title: "Error",
        description: "Failed to update commission level in backend",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLevel = async () => {
    if (!newLevel.level || !newLevel.percentage) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCommissionLevel: CommissionLevel = {
        id: Date.now().toString(),
        level: newLevel.level!,
        percentage: newLevel.percentage!,
        description: newLevel.description || `Level ${newLevel.level} commission`,
        isActive: true,
        minReferrals: newLevel.minReferrals || 0,
        maxReferrals: newLevel.maxReferrals || 999,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCommissionLevels(prev => [...prev, newCommissionLevel]);
      setShowAddForm(false);
      setNewLevel({});
      toast({
        title: "Success",
        description: "New commission level added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add commission level",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLevel = async (levelId: string) => {
    if (commissionLevels.length <= 1) {
      toast({
        title: "Error",
        description: "Cannot delete the last commission level",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCommissionLevels(prev => prev.filter(level => level.id !== levelId));
      toast({
        title: "Success",
        description: "Commission level deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete commission level",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLevel = async (levelId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCommissionLevels(prev => 
        prev.map(level => 
          level.id === levelId 
            ? { ...level, isActive: !level.isActive, updatedAt: new Date().toISOString() }
            : level
        )
      );
      
      toast({
        title: "Success",
        description: "Commission level status updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update commission level status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save settings to backend
      await commissionAPI.updateCommissionSettings(settings);
      
      toast({
        title: "Success",
        description: "Commission settings saved successfully in backend",
      });
    } catch (error) {
      console.error('Error saving commission settings:', error);
      toast({
        title: "Error",
        description: "Failed to save commission settings in backend",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaults = () => {
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
        updatedAt: new Date().toISOString()
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
        updatedAt: new Date().toISOString()
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
        updatedAt: new Date().toISOString()
      }
    ]);
    
    toast({
      title: "Success",
      description: "Commission levels reset to defaults",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-gray-600 mt-1">Control commission percentages and levels for your affiliate program</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsLocked(!isLocked)}
            disabled={loading}
          >
            {isLocked ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
            {isLocked ? 'Unlock' : 'Lock'} Changes
          </Button>
          <Button 
            variant="outline" 
            onClick={handleResetToDefaults}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={loading || isLocked}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCommissionPercentage.toFixed(1)}%
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {commissionLevels.filter(l => l.isActive).length} active levels
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Levels</p>
                <p className="text-2xl font-bold text-gray-900">
                  {commissionLevels.filter(l => l.isActive).length}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {commissionLevels.length} total levels
                </p>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Max Commission</p>
                <p className="text-2xl font-bold text-gray-900">
                  {settings.maximumCommission}%
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  System limit
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {settings.globalCommissionEnabled ? 'Active' : 'Disabled'}
                </p>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Global settings
                </p>
              </div>
              <div className={`h-8 w-8 rounded-full ${settings.globalCommissionEnabled ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className={`h-4 w-4 rounded-full mx-auto mt-2 ${settings.globalCommissionEnabled ? 'bg-green-600' : 'bg-red-600'}`}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Levels Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Levels List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Commission Levels
                </CardTitle>
                <CardDescription>
                  Manage commission percentages for each level
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowAddForm(true)}
                disabled={loading || isLocked}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Level
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commissionLevels.map((level) => (
                <div key={level.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant={level.isActive ? "default" : "secondary"}>
                        Level {level.level}
                      </Badge>
                      <span className="text-lg font-bold text-gray-900">
                        {level.percentage}%
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleLevel(level.id)}
                        disabled={loading || isLocked}
                      >
                        {level.isActive ? 'Active' : 'Inactive'}
                      </Button>
                      {editingLevel === level.id ? (
                        <Button
                          size="sm"
                          onClick={() => handleSaveLevel(level.id)}
                          disabled={loading}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingLevel(level.id)}
                          disabled={loading || isLocked}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLevel(level.id)}
                        disabled={loading || isLocked || commissionLevels.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {editingLevel === level.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Percentage (%)</label>
                          <Input
                            type="number"
                            value={newLevel.percentage || level.percentage}
                            onChange={(e) => setNewLevel({...newLevel, percentage: parseFloat(e.target.value)})}
                            min={0}
                            max={settings.maximumCommission}
                            step={0.1}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Level</label>
                          <Input
                            type="number"
                            value={newLevel.level || level.level}
                            onChange={(e) => setNewLevel({...newLevel, level: parseInt(e.target.value)})}
                            min={1}
                            max={settings.maxCommissionLevels}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <Input
                          value={newLevel.description || level.description}
                          onChange={(e) => setNewLevel({...newLevel, description: e.target.value})}
                          placeholder="Enter description"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{level.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Referrals: {level.minReferrals} - {level.maxReferrals}</span>
                        <span>Updated: {new Date(level.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

                 {/* Commission Calculator & Settings */}
         <div className="space-y-6">
           {/* Commission Calculator */}
           <CommissionCalculator commissionLevels={commissionLevels} />

          {/* Global Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Global Settings
              </CardTitle>
              <CardDescription>
                Configure global commission settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Enable Global Commissions</label>
                    <p className="text-xs text-gray-500">Allow commission calculations</p>
                  </div>
                  <Button
                    variant={settings.globalCommissionEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings({...settings, globalCommissionEnabled: !settings.globalCommissionEnabled})}
                    disabled={isLocked}
                  >
                    {settings.globalCommissionEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Min Commission (%)</label>
                    <Input
                      type="number"
                      value={settings.minimumCommission}
                      onChange={(e) => setSettings({...settings, minimumCommission: parseFloat(e.target.value)})}
                      min={0}
                      max={settings.maximumCommission}
                      step={0.1}
                      disabled={isLocked}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Max Commission (%)</label>
                    <Input
                      type="number"
                      value={settings.maximumCommission}
                      onChange={(e) => setSettings({...settings, maximumCommission: parseFloat(e.target.value)})}
                      min={settings.minimumCommission}
                      max={100}
                      step={0.1}
                      disabled={isLocked}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Max Commission Levels</label>
                  <Input
                    type="number"
                    value={settings.maxCommissionLevels}
                    onChange={(e) => setSettings({...settings, maxCommissionLevels: parseInt(e.target.value)})}
                    min={1}
                    max={10}
                    disabled={isLocked}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add New Level Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Commission Level</CardTitle>
            <CardDescription>Create a new commission level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Level</label>
                <Input
                  type="number"
                  value={newLevel.level || ''}
                  onChange={(e) => setNewLevel({...newLevel, level: parseInt(e.target.value)})}
                  placeholder="Enter level number"
                  min={1}
                  max={settings.maxCommissionLevels}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Percentage (%)</label>
                <Input
                  type="number"
                  value={newLevel.percentage || ''}
                  onChange={(e) => setNewLevel({...newLevel, percentage: parseFloat(e.target.value)})}
                  placeholder="Enter percentage"
                  min={settings.minimumCommission}
                  max={settings.maximumCommission}
                  step={0.1}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={newLevel.description || ''}
                  onChange={(e) => setNewLevel({...newLevel, description: e.target.value})}
                  placeholder="Enter description"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button onClick={handleAddLevel} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add Level
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommissionManagement;