import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  DollarSign, 
  Users, 
  Award,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { DataService } from '../../services/mockData';

interface AffiliatesListProps {
  onNavigate?: (page: string) => void;
}

const AffiliatesList: React.FC<AffiliatesListProps> = ({ onNavigate }) => {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [filteredAffiliates, setFilteredAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');

  useEffect(() => {
    loadAffiliates();
  }, []);

  useEffect(() => {
    filterAffiliates();
  }, [affiliates, searchTerm, selectedTier]);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      const affiliatesData = await DataService.getAllAffiliates();
      setAffiliates(affiliatesData);
    } catch (error) {
      console.error('Error loading affiliates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAffiliates = () => {
    let filtered = affiliates;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(affiliate => 
        affiliate.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.referralCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tier
    // if (selectedTier !== 'all') {
    //   filtered = filtered.filter(affiliate => 
    //     affiliate.tier?.name?.toLowerCase() === selectedTier.toLowerCase()
    //   );
    // }

    setFilteredAffiliates(filtered);
  };

  // const getTierColor = (tier: string) => {
  //   switch (tier?.toLowerCase()) {
  //     case 'bronze': return 'bg-orange-100 text-orange-800';
  //     case 'silver': return 'bg-gray-100 text-gray-800';
  //     case 'gold': return 'bg-yellow-100 text-yellow-800';
  //     case 'platinum': return 'bg-purple-100 text-purple-800';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting affiliates data...');
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
          <h1 className="text-3xl font-bold text-gray-900">All Affiliates</h1>
          <p className="text-gray-600 mt-1">Complete list of registered affiliates</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => onNavigate?.('affiliates')}>
            <Eye className="h-4 w-4 mr-2" />
            Manage Affiliates
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Affiliates</p>
                <p className="text-2xl font-bold text-gray-900">{affiliates.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Affiliates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {affiliates.filter(a => a.isActive).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  AED {affiliates.reduce((sum, a) => sum + (a.totalEarnings || 0), 0).toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Avg Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {affiliates.length > 0 
                    ? Math.round(affiliates.reduce((sum, a) => sum + (a.conversionRate || 0), 0) / affiliates.length * 10) / 10
                    : 0}%
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, code, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {/* <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select> */}
              <Button variant="outline" onClick={loadAffiliates}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Affiliates List</CardTitle>
          <CardDescription>
            Showing {filteredAffiliates.length} of {affiliates.length} affiliates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Affiliate</th>
                  {/* <th className="text-left py-3 px-4 font-medium text-gray-900">Tier</th> */}
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Referrals</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Earnings</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Conversion</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {affiliate.user?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {affiliate.referralCode} • {affiliate.user?.email}
                        </p>
                      </div>
                    </td>
                    {/* <td className="py-3 px-4">
                      <Badge className={getTierColor(affiliate.tier?.name)}>
                        {affiliate.tier?.name || 'N/A'}
                      </Badge>
                    </td> */}
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(affiliate.isActive)}>
                        {affiliate.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {affiliate.totalReferrals || 0}
                        </p>
                        <p className="text-sm text-gray-600">
                          {affiliate.activeReferrals || 0} active
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          AED {(affiliate.totalEarnings || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          AED {(affiliate.pendingEarnings || 0).toLocaleString()} pending
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          {(affiliate.conversionRate || 0).toFixed(1)}%
                        </span>
                        {(affiliate.conversionRate || 0) > 15 ? (
                          <TrendingUp className="h-4 w-4 text-green-600 ml-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 ml-1" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600">
                        {new Date(affiliate.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliatesList;
