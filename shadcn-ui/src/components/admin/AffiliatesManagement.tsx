import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Users, 
  Search, 
  Eye, 
  TrendingUp, 
  DollarSign,
  UserCheck,
  Clock,
  Filter
} from 'lucide-react';
import { Affiliate } from '../../types';
import { adminAPI } from '../../services/api';
import AffiliateDetailsModal from './AffiliateDetailsModal';
import { toast } from '../../hooks/use-toast';

const AffiliatesManagement = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);
  const [showAffiliateDetails, setShowAffiliateDetails] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAffiliates();
  }, [currentPage]);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAffiliates(currentPage, 20);
      setAffiliates(response.data.affiliates || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error loading affiliates:', error);
      // Set empty arrays on error
      setAffiliates([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredAffiliates = affiliates.filter(affiliate =>
    affiliate.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    affiliate.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    affiliate.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Affiliates</h1>
          <p className="text-gray-600 mt-2">
            View and manage all registered affiliates in your system
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button 
            onClick={handleExportReport}
            disabled={exporting}
          >
            <Users className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export List'}
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Affiliates</p>
                <p className="text-2xl font-bold">{affiliates.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Affiliates</p>
                <p className="text-2xl font-bold">
                  {affiliates.filter(a => a.user?.status === 'active').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">
                  ${affiliates.reduce((sum, a) => sum + (a.totalEarnings || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold">
                  ${affiliates.reduce((sum, a) => sum + (a.pendingEarnings || 0), 0).toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search affiliates by name, email, or referral code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Affiliates
          </CardTitle>
          <CardDescription>
            {filteredAffiliates.length} affiliates found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Affiliate</th>
                  {/* <th className="text-left py-3 px-4 font-medium text-gray-600">Tier</th> */}
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Referrals</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Total Earnings</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Pending</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Joined</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {affiliate.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{affiliate.user?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{affiliate.user?.email}</p>
                          <p className="text-xs text-gray-400">Code: {affiliate.referralCode}</p>
                        </div>
                      </div>
                    </td>
                   {/* <td className="py-4 px-4">
                      <Badge className={getTierColor(affiliate.tier?.name || '')}>
                        {affiliate.tier?.name || 'Bronze'}
                      </Badge>
                    </td> */}
                    <td className="py-4 px-4">
                      <Badge className={getStatusColor(affiliate.user?.status === 'active')}>
                        {affiliate.user?.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{affiliate.totalReferrals || 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-green-600">
                        ${(affiliate.totalEarnings || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-yellow-600">
                        ${(affiliate.pendingEarnings || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-500">
                        {new Date(affiliate.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAffiliateId(affiliate.id);
                          setShowAffiliateDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
          onAffiliateUpdated={loadAffiliates}
        />
      )}
    </div>
  );
};

export default AffiliatesManagement;
