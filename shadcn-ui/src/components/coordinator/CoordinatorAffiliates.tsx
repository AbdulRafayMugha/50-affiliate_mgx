import React, { useState, useEffect } from 'react';
import { coordinatorAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Users, DollarSign, TrendingUp, UserCheck, UserX } from 'lucide-react';

interface Affiliate {
  id: string;
  userId: string;
  referralCode: string;
  tier: { name: string };
  totalEarnings: number;
  pendingEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  };
}

interface AffiliatesResponse {
  affiliates: Affiliate[];
  total: number;
  totalPages: number;
}

const CoordinatorAffiliates: React.FC = () => {
  const { user } = useAuth();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalEarnings: 0,
    pendingEarnings: 0
  });

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const response = await coordinatorAPI.getAffiliates();
      const data: AffiliatesResponse = response.data;
      
      setAffiliates(data.affiliates);
      
      // Calculate stats
      const totalAffiliates = data.affiliates.length;
      const activeAffiliates = data.affiliates.filter(a => a.user.status === 'active').length;
      const totalEarnings = data.affiliates.reduce((sum, a) => sum + a.totalEarnings, 0);
      const pendingEarnings = data.affiliates.reduce((sum, a) => sum + a.pendingEarnings, 0);
      
      setStats({
        totalAffiliates,
        activeAffiliates,
        totalEarnings,
        pendingEarnings
      });
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch affiliates');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (affiliateId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? false : true;
      await coordinatorAPI.updateAffiliateStatus(affiliateId, newStatus);
      
      // Update local state
      setAffiliates(prev => prev.map(affiliate => 
        affiliate.id === affiliateId 
          ? { 
              ...affiliate, 
              user: { 
                ...affiliate.user, 
                status: newStatus ? 'active' : 'inactive' 
              } 
            }
          : affiliate
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        activeAffiliates: newStatus ? prev.activeAffiliates + 1 : prev.activeAffiliates - 1
      }));
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update affiliate status');
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button onClick={fetchAffiliates} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Affiliates</h1>
          <p className="mt-2 text-gray-600">Manage affiliates assigned to you</p>
        </div>

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
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From your network
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">${stats.pendingEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Affiliates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Affiliate Details</CardTitle>
            <CardDescription>
              Detailed information about your assigned affiliates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {affiliates.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Affiliates Assigned</h3>
                <p className="text-gray-500">
                  You don't have any affiliates assigned to you yet. Contact an admin to assign affiliates to your network.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Earnings</TableHead>
                    <TableHead>Pending Earnings</TableHead>
                    <TableHead>Total Referrals</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{affiliate.user.name}</div>
                          <div className="text-sm text-gray-500">{affiliate.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {affiliate.referralCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTierColor(affiliate.tier.name)}>
                          {affiliate.tier.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={affiliate.user.status === 'active' ? 'default' : 'secondary'}>
                          {affiliate.user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${affiliate.totalEarnings.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        ${affiliate.pendingEarnings.toFixed(2)}
                      </TableCell>
                      <TableCell>{affiliate.totalReferrals}</TableCell>
                      <TableCell>{affiliate.conversionRate.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Button
                          variant={affiliate.user.status === 'active' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleStatusToggle(affiliate.id, affiliate.user.status)}
                        >
                          {affiliate.user.status === 'active' ? (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoordinatorAffiliates;
