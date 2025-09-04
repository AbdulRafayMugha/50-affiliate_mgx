import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Users, TrendingUp, DollarSign, UserCheck, UserX, Eye, Mail, Download } from 'lucide-react';
import { adminAPI } from '../../services/api';

interface Coordinator {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  affiliate_count: number;
  active_affiliate_count: number;
  total_commissions: number;
  total_referrals: number;
}

interface CoordinatorNetwork {
  coordinator: Coordinator;
  affiliates: Array<{
    id: string;
    name: string;
    email: string;
    is_active: boolean;
    tier: string;
    referral_count: number;
    commission_earned: number;
    created_at: string;
  }>;
}

const CoordinatorManagement: React.FC = () => {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState<CoordinatorNetwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const fetchCoordinators = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getCoordinators();
      setCoordinators(response.data.coordinators);
    } catch (err: any) {
      setError('Failed to fetch coordinators');
      console.error('Error fetching coordinators:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinatorNetwork = async (coordinatorId: string) => {
    try {
      const response = await adminAPI.getCoordinatorNetwork(coordinatorId);
      setSelectedCoordinator(response.data);
      setActiveTab("networks"); // Automatically switch to networks tab
    } catch (err: any) {
      setError('Failed to fetch coordinator network');
      console.error('Error fetching coordinator network:', err);
    }
  };

  const toggleCoordinatorStatus = async (coordinatorId: string, currentStatus: boolean) => {
    try {
      await adminAPI.updateCoordinatorStatus(coordinatorId, !currentStatus);
      await fetchCoordinators();
      if (selectedCoordinator?.coordinator.id === coordinatorId) {
        await fetchCoordinatorNetwork(coordinatorId);
      }
    } catch (err: any) {
      setError('Failed to update coordinator status');
      console.error('Error updating coordinator status:', err);
    }
  };

  const handleExportReport = async () => {
    try {
      setExporting(true);
      const response = await adminAPI.exportCoordinatorReport();
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `coordinator-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to export coordinator report');
      console.error('Error exporting coordinator report:', err);
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const tierColors = {
      'Bronze': 'bg-orange-100 text-orange-800',
      'Silver': 'bg-gray-100 text-gray-800',
      'Gold': 'bg-yellow-100 text-yellow-800',
      'Platinum': 'bg-purple-100 text-purple-800',
      'Diamond': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={tierColors[tier as keyof typeof tierColors] || 'bg-gray-100 text-gray-800'}>
        {tier}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading coordinators...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coordinator Management</h1>
          <p className="mt-2 text-gray-600">
            Manage coordinators and view their affiliate networks
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleExportReport}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="networks">Networks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Coordinators</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{coordinators.length}</div>
                <p className="text-xs text-muted-foreground">
                  {coordinators.filter(c => c.is_active).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {coordinators.reduce((sum, c) => sum + c.affiliate_count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {coordinators.reduce((sum, c) => sum + c.active_affiliate_count, 0)} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${coordinators.reduce((sum, c) => sum + c.total_commissions, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all networks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {coordinators.reduce((sum, c) => sum + c.total_referrals, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From all networks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Coordinators Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Coordinators</CardTitle>
              <CardDescription>
                View and manage all registered coordinators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Affiliates</TableHead>
                    <TableHead>Commissions</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coordinators.map((coordinator) => (
                    <TableRow key={coordinator.id}>
                      <TableCell className="font-medium">{coordinator.name}</TableCell>
                      <TableCell>{coordinator.email}</TableCell>
                      <TableCell>{getStatusBadge(coordinator.is_active)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{coordinator.affiliate_count} total</div>
                          <div className="text-green-600">{coordinator.active_affiliate_count} active</div>
                        </div>
                      </TableCell>
                      <TableCell>${coordinator.total_commissions.toFixed(2)}</TableCell>
                      <TableCell>{coordinator.total_referrals}</TableCell>
                      <TableCell>
                        {new Date(coordinator.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchCoordinatorNetwork(coordinator.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={coordinator.is_active ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleCoordinatorStatus(coordinator.id, coordinator.is_active)}
                          >
                            {coordinator.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="networks" className="space-y-6">
          {selectedCoordinator ? (
            <div className="space-y-6">
              {/* Coordinator Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedCoordinator.coordinator.name}'s Network</span>
                    {getStatusBadge(selectedCoordinator.coordinator.is_active)}
                  </CardTitle>
                  <CardDescription>
                    {selectedCoordinator.coordinator.email} • {selectedCoordinator.affiliates.length} affiliates
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Network Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedCoordinator.affiliates.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedCoordinator.affiliates.filter(a => a.is_active).length} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${selectedCoordinator.affiliates.reduce((sum, a) => sum + a.commission_earned, 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From network affiliates
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedCoordinator.affiliates.reduce((sum, a) => sum + a.referral_count, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From network affiliates
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Affiliates Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Network Affiliates</CardTitle>
                  <CardDescription>
                    Affiliates assigned to {selectedCoordinator.coordinator.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Referrals</TableHead>
                        <TableHead>Commissions</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCoordinator.affiliates.map((affiliate) => (
                        <TableRow key={affiliate.id}>
                          <TableCell className="font-medium">{affiliate.name}</TableCell>
                          <TableCell>{affiliate.email}</TableCell>
                          <TableCell>{getStatusBadge(affiliate.is_active)}</TableCell>
                          <TableCell>{getTierBadge(affiliate.tier)}</TableCell>
                          <TableCell>{affiliate.referral_count}</TableCell>
                          <TableCell>${affiliate.commission_earned.toFixed(2)}</TableCell>
                          <TableCell>
                            {new Date(affiliate.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Coordinator</h3>
                  <p className="text-gray-600">
                    Click the eye icon next to a coordinator to view their network details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoordinatorManagement;
