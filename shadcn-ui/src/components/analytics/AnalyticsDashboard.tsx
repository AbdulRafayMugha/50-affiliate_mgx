import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  MapPin, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent
} from '../ui/chart';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { AnalyticsData, DashboardStats } from '../../types';
import { DataService } from '../../services/mockData';
import { toast } from '../../hooks/use-toast';

interface AnalyticsDashboardProps {
  onNavigate?: (page: string) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onNavigate }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [analyticsData, statsData] = await Promise.all([
        DataService.getAnalyticsData(),
        DataService.getDashboardStats()
      ]);
      setAnalytics(analyticsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportAnalytics = async () => {
    setExporting(true);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Success",
        description: "Analytics report exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export analytics report",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const getMetricData = () => {
    if (!analytics) return { labels: [], datasets: [] };
    
    switch (selectedMetric) {
      case 'revenue':
        return analytics.sales;
      case 'commissions':
        return analytics.commissions;
      case 'registrations':
        return analytics.registrations;
      default:
        return analytics.sales;
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'revenue': return 'Revenue';
      case 'commissions': return 'Commissions';
      case 'registrations': return 'Registrations';
      default: return 'Revenue';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your affiliate program performance</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={loadAnalyticsData}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleExportAnalytics}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Primary Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="commissions">Commissions</SelectItem>
                  <SelectItem value="registrations">Registrations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  AED {stats?.totalSales.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{stats?.revenueGrowth || 0}% from last month
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
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.activeAffiliates || 0}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Users className="h-4 w-4 mr-1" />
                  {stats?.totalAffiliates || 0} total affiliates
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
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.conversionRate || 0}%
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <Target className="h-4 w-4 mr-1" />
                  Industry avg: 15%
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
                <p className="text-2xl font-bold text-gray-900">
                  AED {stats?.pendingPayouts.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Activity className="h-4 w-4 mr-1" />
                  Ready for processing
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            {getMetricLabel()} Over Time
          </CardTitle>
          <CardDescription>
            Performance trends for the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              [getMetricLabel()]: {
                label: getMetricLabel(),
                color: selectedMetric === 'revenue' ? '#10b981' : 
                       selectedMetric === 'commissions' ? '#3b82f6' : '#8b5cf6'
              }
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getMetricData().labels.map((label, index) => ({
                  name: label,
                  [getMetricLabel()]: getMetricData().datasets[0]?.data[index] || 0
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload) return null;
                    return (
                      <ChartTooltipContent
                        payload={payload}
                        label={payload[0]?.payload?.name}
                        formatter={(value) => [`AED ${value}`, getMetricLabel()]}
                      />
                    );
                  }}
                />
                <Bar 
                  dataKey={getMetricLabel()} 
                  fill={selectedMetric === 'revenue' ? '#10b981' : 
                        selectedMetric === 'commissions' ? '#3b82f6' : '#8b5cf6'}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Conversion Rate</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.conversionRate || 0}%</span>
                </div>
                <Progress value={stats?.conversionRate || 0} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Revenue Growth</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.revenueGrowth || 0}%</span>
                </div>
                <Progress value={Math.min(stats?.revenueGrowth || 0, 100)} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">New Signups Today</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.newSignupsToday || 0}</span>
                </div>
                <Progress value={Math.min((stats?.newSignupsToday || 0) * 10, 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Geographic Distribution
          </CardTitle>
          <CardDescription>
            Affiliate performance by region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { region: 'North America', revenue: 45000, affiliates: 45, color: '#3b82f6' },
              { region: 'Europe', revenue: 32000, affiliates: 38, color: '#10b981' },
              { region: 'Asia Pacific', revenue: 28000, affiliates: 32, color: '#f59e0b' },
              { region: 'Latin America', revenue: 15000, affiliates: 18, color: '#ef4444' },
              { region: 'Africa', revenue: 8000, affiliates: 12, color: '#8b5cf6' },
              { region: 'Other', revenue: 5000, affiliates: 8, color: '#6b7280' }
            ].map((item) => (
              <div key={item.region} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{item.region}</h4>
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                </div>
                <p className="text-2xl font-bold text-gray-900">AED {item.revenue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{item.affiliates} affiliates</p>
                <Progress 
                  value={(item.revenue / 135000) * 100} 
                  className="mt-2 h-1"
                  style={{ backgroundColor: item.color + '20' }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
