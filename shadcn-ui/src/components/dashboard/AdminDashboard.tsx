import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  UserCheck, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { DashboardStats, AnalyticsData, Affiliate, Commission } from '../../types';
import { DataService } from '../../services/mockData';
import AffiliateDetailsModal from '../admin/AffiliateDetailsModal';
import { adminAPI } from '../../services/api';
import { toast } from '../../hooks/use-toast';

interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [topAffiliates, setTopAffiliates] = useState<Affiliate[]>([]);
  const [pendingCommissions, setPendingCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);
  const [showAffiliateDetails, setShowAffiliateDetails] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, analyticsData, affiliatesData, commissionsData] = await Promise.all([
          DataService.getDashboardStats(),
          DataService.getAnalyticsData(),
          DataService.getAffiliateStats(''),
          DataService.getCommissions('')
        ]);

        setStats(statsData);
        setAnalytics(analyticsData);
        // setTopAffiliates(affiliatesData.slice(0, 5));
        setTopAffiliates(analyticsData.topAffiliates.map(a => a.affiliate).slice(0, 5));
        setPendingCommissions(commissionsData.filter(c => c.status === 'pending'));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const response = await adminAPI.exportReport();
      
      // Create a blob from the response data
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `affiliate-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Affiliate report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export affiliate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend = 'up' 
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down';
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? '↗' : '↘'} {change}
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleExportReport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export Report'}
          </Button>
          <Button>Bulk Actions</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Affiliates"
          value={stats.totalAffiliates}
          change="+12% from last month"
          icon={Users}
        />
        <StatCard
          title="Active Affiliates"
          value={stats.activeAffiliates}
          change="+8% from last month"
          icon={UserCheck}
        />
        <StatCard
          title="Total Sales"
          value={`$${stats.totalSales.toLocaleString()}`}
          change="+15.8% from last month"
          icon={DollarSign}
        />
        <StatCard
          title="Pending Payouts"
          value={`$${stats.pendingPayouts.toLocaleString()}`}
          change={`${pendingCommissions.length} transactions`}
          icon={CreditCard}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Affiliates */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Performing Affiliates</CardTitle>
            <CardDescription>Highest earning affiliates this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAffiliates.map((affiliate, index) => (
                <div key={affiliate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{affiliate.user?.name}</p>
                      <p className="text-sm text-gray-500">
                        {affiliate.totalReferrals} referrals • {affiliate.tier.name} tier
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-semibold">${affiliate.totalEarnings.toLocaleString()}</p>
                      <p className="text-sm text-green-600">
                        {affiliate.conversionRate}% conversion
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAffiliateId(affiliate.id);
                        setShowAffiliateDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onNavigate?.('affiliates')}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Affiliates
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <CreditCard className="w-4 h-4 mr-2" />
              Process Payouts
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <AlertCircle className="w-4 h-4 mr-2" />
              Review Pending
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Commissions */}
      {pendingCommissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Commission Approvals
            </CardTitle>
            <CardDescription>
              {pendingCommissions.length} commissions awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingCommissions.slice(0, 5).map((commission) => {
                const affiliate = topAffiliates.find(a => a.id === commission.affiliateId);
                return (
                  <div key={commission.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="bg-yellow-100">
                        Level {commission.level}
                      </Badge>
                      <div>
                        <p className="font-medium">{affiliate?.user?.name || 'Unknown Affiliate'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(commission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <p className="font-semibold">${commission.amount.toFixed(2)}</p>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {pendingCommissions.length > 5 && (
              <div className="mt-4 text-center">
                <Button variant="outline">View All Pending ({pendingCommissions.length})</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.conversionRate}%</p>
              <p className="text-sm text-gray-600">Overall Conversion Rate</p>
              <Progress value={stats.conversionRate} className="mt-2" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.revenueGrowth}%</p>
              <p className="text-sm text-gray-600">Revenue Growth</p>
              <Progress value={stats.revenueGrowth} className="mt-2" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.newSignupsToday}</p>
              <p className="text-sm text-gray-600">New Signups Today</p>
              <Progress value={(stats.newSignupsToday / 10) * 100} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Affiliate Details Modal */}
      {selectedAffiliateId && (
        <AffiliateDetailsModal
          isOpen={showAffiliateDetails}
          onClose={() => {
            setShowAffiliateDetails(false);
            setSelectedAffiliateId(null);
          }}
          affiliateId={selectedAffiliateId}
        />
      )}
    </div>
  );
};

export default AdminDashboard;