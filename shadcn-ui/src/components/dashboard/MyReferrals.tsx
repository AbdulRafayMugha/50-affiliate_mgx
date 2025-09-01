import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Trophy,
  Star,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { affiliateAPI } from '../../services/api';
import { toast } from '../../hooks/use-toast';

interface ReferralUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: string;
  isActive: boolean;
  createdAt: string;
  totalEarnings?: number;
  totalReferrals?: number;
  conversionRate?: number;
}

interface ReferralTree {
  level1: ReferralUser[];
  level2: ReferralUser[];
  level3: ReferralUser[];
  totals: {
    total: number;
    level1: number;
    level2: number;
    level3: number;
  };
}

const MyReferrals = () => {
  const [referralTree, setReferralTree] = useState<ReferralTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'level1' | 'level2' | 'level3'>('all');

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const response = await affiliateAPI.getReferralTree();
      setReferralTree(response.data.tree);
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReferrals = () => {
    if (!referralTree) return [];
    
    switch (selectedLevel) {
      case 'level1':
        return referralTree.level1;
      case 'level2':
        return referralTree.level2;
      case 'level3':
        return referralTree.level3;
      default:
        return [
          ...referralTree.level1.map(user => ({ ...user, level: 1 })),
          ...referralTree.level2.map(user => ({ ...user, level: 2 })),
          ...referralTree.level3.map(user => ({ ...user, level: 3 }))
        ];
    }
  };

  const getLevelStats = (level: number) => {
    if (!referralTree) return { count: 0, earnings: 0, conversionRate: 0 };
    
    const users = level === 1 ? referralTree.level1 : 
                  level === 2 ? referralTree.level2 : 
                  referralTree.level3;
    
    const totalEarnings = users.reduce((sum, user) => sum + (user.totalEarnings || 0), 0);
    const avgConversionRate = users.length > 0 
      ? users.reduce((sum, user) => sum + (user.conversionRate || 0), 0) / users.length 
      : 0;
    
    return {
      count: users.length,
      earnings: totalEarnings,
      conversionRate: avgConversionRate
    };
  };

  const getStatusBadge = (user: ReferralUser) => {
    if (!user.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    
    // Determine status based on activity
    const daysSinceCreated = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreated <= 7) {
      return <Badge variant="default">New</Badge>;
    } else if (user.totalEarnings && user.totalEarnings > 0) {
      return <Badge variant="default">Active</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return <Trophy className="w-4 h-4 text-purple-600" />;
      case 'gold':
        return <Star className="w-4 h-4 text-yellow-600" />;
      case 'silver':
        return <Star className="w-4 h-4 text-gray-400" />;
      default:
        return <Users className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Referrals</h1>
            <p className="text-gray-600">Loading your referral network...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

  if (!referralTree) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Referrals</h1>
            <p className="text-gray-600">No referral data available</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Referrals Yet</h3>
            <p className="text-gray-600 mb-4">
              Start building your referral network by sharing your referral links and inviting friends.
            </p>
            <Button>Get Started</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Referrals</h1>
          <p className="text-gray-600">Your multi-level referral network</p>
        </div>
        <Button onClick={loadReferralData} variant="outline">
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Level Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {referralTree.totals.total}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Users className="h-4 w-4 mr-1" />
                  Across all levels
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Level 1 (Direct)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {referralTree.totals.level1}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <DollarSign className="h-4 w-4 mr-1" />
                  15% commission
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Level 2</p>
                <p className="text-2xl font-bold text-gray-900">
                  {referralTree.totals.level2}
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <DollarSign className="h-4 w-4 mr-1" />
                  5% commission
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Level 3</p>
                <p className="text-2xl font-bold text-gray-900">
                  {referralTree.totals.level3}
                </p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <DollarSign className="h-4 w-4 mr-1" />
                  2.5% commission
                </p>
              </div>
              <Star className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-2">
            <Button
              variant={selectedLevel === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedLevel('all')}
            >
              All Levels ({referralTree.totals.total})
            </Button>
            <Button
              variant={selectedLevel === 'level1' ? 'default' : 'outline'}
              onClick={() => setSelectedLevel('level1')}
            >
              Level 1 ({referralTree.totals.level1})
            </Button>
            <Button
              variant={selectedLevel === 'level2' ? 'default' : 'outline'}
              onClick={() => setSelectedLevel('level2')}
            >
              Level 2 ({referralTree.totals.level2})
            </Button>
            <Button
              variant={selectedLevel === 'level3' ? 'default' : 'outline'}
              onClick={() => setSelectedLevel('level3')}
            >
              Level 3 ({referralTree.totals.level3})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {selectedLevel === 'all' ? 'All Referrals' : 
             selectedLevel === 'level1' ? 'Direct Referrals (Level 1)' :
             selectedLevel === 'level2' ? 'Level 2 Referrals' : 'Level 3 Referrals'}
          </CardTitle>
          <CardDescription>
            {getFilteredReferrals().length} {selectedLevel === 'all' ? 'total' : 'level'} referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getFilteredReferrals().length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {selectedLevel === 'all' ? '' : selectedLevel === 'level1' ? 'direct ' : 
                    selectedLevel === 'level2' ? 'level 2 ' : 'level 3 '}referrals yet
              </h3>
              <p className="text-gray-600">
                {selectedLevel === 'all' ? 'Start building your network by sharing your referral links.' :
                 selectedLevel === 'level1' ? 'Share your referral links to get direct referrals.' :
                 'Your direct referrals need to refer others to see level 2 and 3 referrals.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredReferrals().map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                                       <Avatar>
                     <AvatarFallback>
                       {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                     </AvatarFallback>
                   </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        {getTierIcon(user.tier)}
                        {getStatusBadge(user)}
                        {'level' in user && (
                          <Badge variant="outline">Level {user.level}</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        {user.totalEarnings !== undefined && (
                          <span className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            ${user.totalEarnings.toLocaleString()}
                          </span>
                        )}
                        {user.totalReferrals !== undefined && (
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {user.totalReferrals} referrals
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {user.conversionRate !== undefined && (
                      <p className="text-sm font-medium text-gray-900">
                        {user.conversionRate.toFixed(1)}% conversion
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Level 1 Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Referrals:</span>
                <span className="font-medium">{getLevelStats(1).count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Earnings:</span>
                <span className="font-medium">${getLevelStats(1).earnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Conversion:</span>
                <span className="font-medium">{getLevelStats(1).conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Level 2 Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Referrals:</span>
                <span className="font-medium">{getLevelStats(2).count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Earnings:</span>
                <span className="font-medium">${getLevelStats(2).earnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Conversion:</span>
                <span className="font-medium">{getLevelStats(2).conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Level 3 Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Referrals:</span>
                <span className="font-medium">{getLevelStats(3).count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Earnings:</span>
                <span className="font-medium">${getLevelStats(3).earnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Conversion:</span>
                <span className="font-medium">{getLevelStats(3).conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyReferrals;
