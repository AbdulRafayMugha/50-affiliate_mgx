import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Target,
  Users,
  MapPin,
  Calendar,
  Download,
  RefreshCw,
  Settings,
  Eye,
  MousePointer,
  Award,
  Activity
} from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';
import CommissionAnalytics from './CommissionAnalytics';
import ConversionAnalytics from './ConversionAnalytics';
import AffiliatesList from './AffiliatesList';
import { DataService } from '../../services/mockData';
import { adminAPI } from '../../services/api';

interface AnalyticsTabsProps {
  onNavigate?: (page: string) => void;
}

const AnalyticsTabs: React.FC<AnalyticsTabsProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [allAffiliates, setAllAffiliates] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeAffiliates: 0,
    totalAffiliates: 0,
    conversionRate: 0,
    pendingPayouts: 0,
    pendingTransactions: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: dashboardData }, affiliatesData] = await Promise.all([
          adminAPI.getDashboard(),
          DataService.getAllAffiliates()
        ]);

        setAllAffiliates(affiliatesData);
        
        // Set the stats
        setStats({
          totalRevenue: Number(dashboardData.stats.totalRevenue) || 0,
          activeAffiliates: Number(dashboardData.stats.activeAffiliates) || 0,
          totalAffiliates: Number(dashboardData.stats.totalAffiliates) || 0,
          conversionRate: Number(dashboardData.stats.conversionRate) || 0,
          pendingPayouts: Number(dashboardData.stats.pendingCommissions) || 0,
          pendingTransactions: (dashboardData.pendingCommissions || []).length
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    loadData();
  }, []);

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'General performance metrics and trends'
    },
    {
      id: 'commissions',
      label: 'Commissions',
      icon: DollarSign,
      description: 'Commission performance and payout analytics'
    },
    {
      id: 'conversions',
      label: 'Conversions',
      icon: Target,
      description: 'Conversion funnel and optimization insights'
    },
    {
      id: 'affiliates',
      label: 'All Affiliates',
      icon: Users,
      description: 'Complete list of registered affiliates'
    }
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AnalyticsDashboard onNavigate={onNavigate} allAffiliates={allAffiliates} />;
      case 'commissions':
        return <CommissionAnalytics timeRange={timeRange} allAffiliates={allAffiliates} />;
      case 'conversions':
        return <ConversionAnalytics timeRange={timeRange} />;
      case 'affiliates':
        return <AffiliatesList onNavigate={onNavigate} />;
      default:
        return <AnalyticsDashboard onNavigate={onNavigate} allAffiliates={allAffiliates} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Center</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and performance tracking</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">AED {stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Generated this month
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
                <p className="text-sm font-medium text-gray-600">Active Affiliates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeAffiliates}</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Users className="h-4 w-4 mr-1" />
                  {stats.totalAffiliates} total affiliates
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <Target className="h-4 w-4 mr-1" />
                  Overall performance
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-gray-900">AED {stats.pendingPayouts.toLocaleString()}</p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Activity className="h-4 w-4 mr-1" />
                  {stats.pendingTransactions} transactions
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                {tabs.find(tab => tab.id === activeTab)?.description}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 px-6">
              <TabsList className="grid w-full grid-cols-3">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex items-center space-x-2"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value={activeTab} className="mt-0">
                {getTabContent()}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common analytics tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span>Generate Report</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>Performance Review</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Target className="h-6 w-6" />
              <span>Set Goals</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Settings className="h-6 w-6" />
              <span>Configure Alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTabs;
