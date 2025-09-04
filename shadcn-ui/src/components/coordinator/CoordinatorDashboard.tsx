import React, { useState, useEffect } from 'react';
import { coordinatorAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Users, DollarSign, TrendingUp, UserCheck } from 'lucide-react';

interface DashboardStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalCommissions: number;
  pendingCommissions: number;
  totalReferrals: number;
}

const CoordinatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    totalReferrals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await coordinatorAPI.getDashboard();
      setStats(response.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      // You could add a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Coordinator Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome, {user?.name}! Manage your assigned affiliates.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <Button onClick={fetchDashboardData} className="mt-2" variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
              <p className="text-xs text-muted-foreground">
                Assigned to you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Affiliates</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeAffiliates}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalCommissions.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From your network
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">
                From your affiliates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>
              Share this code to refer new affiliates to your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <code className="bg-gray-100 px-4 py-2 rounded font-mono text-lg">
                {user?.referral_code}
              </code>
              <Button onClick={copyReferralCode} variant="outline">
                Copy Code
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              When someone uses this code during registration, they'll be assigned to your network.
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for managing your affiliate network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                View All Affiliates
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Referrals
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                View Commissions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network Status</CardTitle>
              <CardDescription>
                Overview of your affiliate network performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Network Health</span>
                  <span className="text-sm font-medium text-green-600">
                    {stats.totalAffiliates > 0 ? 'Active' : 'No Affiliates'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Rate</span>
                  <span className="text-sm font-medium">
                    {stats.totalAffiliates > 0 
                      ? `${((stats.activeAffiliates / stats.totalAffiliates) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Earnings per Affiliate</span>
                  <span className="text-sm font-medium">
                    ${stats.totalAffiliates > 0 
                      ? (stats.totalCommissions / stats.totalAffiliates).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Coordinator Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Your Role as Coordinator</h3>
              <p className="text-blue-700 mb-3">
                As a coordinator, you can manage affiliates assigned to you, view their performance, 
                and send email referrals. You have access to detailed analytics for your network.
              </p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• View and manage your assigned affiliates</li>
                <li>• Activate/deactivate affiliates in your network</li>
                <li>• Track referrals and commissions from your network</li>
                <li>• Send email referrals to potential clients</li>
                <li>• Access detailed performance metrics</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
