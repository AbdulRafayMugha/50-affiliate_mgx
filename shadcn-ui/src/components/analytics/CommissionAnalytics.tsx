import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { adminAPI } from '../../services/api';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users,
  Calendar,
  PieChart,
  BarChart3,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent
} from '../ui/chart';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CommissionAnalyticsProps {
  timeRange?: string;
  allAffiliates?: any[];
}

const CommissionAnalytics: React.FC<CommissionAnalyticsProps> = ({ timeRange = '30d', allAffiliates = [] }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedTier, setSelectedTier] = useState('all');

  // Mock data - replace with real API calls
  // const commissionData = {
  //   totalCommissions: 125000,
  //   pendingCommissions: 15000,
  //   paidCommissions: 110000,
  //   averageCommission: 125,
  //   commissionGrowth: 12.5,
  //   tierBreakdown: [
  //     { tier: 'Bronze', commissions: 25000, affiliates: 45, avgCommission: 85 },
  //     { tier: 'Silver', commissions: 45000, affiliates: 32, avgCommission: 140 },
  //     { tier: 'Gold', commissions: 35000, affiliates: 18, avgCommission: 195 },
  //     { tier: 'Platinum', commissions: 20000, affiliates: 8, avgCommission: 250 }
  //   ],
  //   monthlyTrend: [
  //     { month: 'Jan', commissions: 8500, growth: 5.2 },
  //     { month: 'Feb', commissions: 9200, growth: 8.2 },
  //     { month: 'Mar', commissions: 10500, growth: 14.1 },
  //     { month: 'Apr', commissions: 11800, growth: 12.4 },
  //     { month: 'May', commissions: 13200, growth: 11.9 },
  //     { month: 'Jun', commissions: 14500, growth: 9.8 }
  //   ],
  //   payoutStatus: [
  //     { status: 'Paid', amount: 110000, count: 880, percentage: 88 },
  //     { status: 'Pending', amount: 15000, count: 120, percentage: 12 }
  //   ]
  // };

  const [commissionData, setCommissionData] = useState({
  totalCommissions: 0,
  pendingCommissions: 0,
  paidCommissions: 0,
  averageCommission: 0,
  commissionGrowth: 0,
  monthlyTrend: [],
  payoutStatus: [
    { status: 'Paid', amount: 0, count: 0, percentage: 0 },
    { status: 'Pending', amount: 0, count: 0, percentage: 0 }
  ],
  tierBreakdown: []
});

useEffect(() => {
  const loadCommissionData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      const dashboardData = response?.data || { stats: {} };
      
      // Calculate payout status
      const pendingAmount = Number(dashboardData?.stats?.pendingCommissions) || 0;
      const paidAmount = Number(dashboardData?.stats?.totalCommissionsPaid) || 0;
      const totalAmount = pendingAmount + paidAmount || 1; // avoid division by zero
      
      // Calculate trends
        // Calculate monthly trends based on recent transactions
        const monthlyTrends = (() => {
          const transactionsByMonth = new Map();
          const now = new Date();
          
          // Initialize last 6 months with 0 values
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleString('default', { month: 'short' });
            transactionsByMonth.set(monthKey, {
              month: monthKey,
              Commissions: 0,
              Growth: 0,
              total: 0
            });
          }
          
          // Group transactions by month
          dashboardData.recentTransactions.forEach(transaction => {
            const date = new Date(transaction.created_at);
            const monthKey = date.toLocaleString('default', { month: 'short' });
            
            if (transactionsByMonth.has(monthKey)) {
              const monthData = transactionsByMonth.get(monthKey);
              const transactionAmount = Number(transaction.amount) || 0;
              monthData.total += transactionAmount;
              // Calculate commission as 10% of transaction amount (adjust this according to your commission structure)
              monthData.Commissions += transactionAmount * 0.1;
            }
          });
          
          // Calculate growth rates
          const monthsArray = Array.from(transactionsByMonth.values());
          monthsArray.forEach((current, index) => {
            if (index > 0) {
              const previous = monthsArray[index - 1];
              current.Growth = previous.total === 0 ? 0 :
                ((current.total - previous.total) / previous.total) * 100;
            }
          });
          
          return monthsArray;
        })();      setCommissionData({
        totalCommissions: totalAmount,
        pendingCommissions: pendingAmount,
        paidCommissions: paidAmount,
        averageCommission: dashboardData.stats.averageCommission || 0,
        commissionGrowth: Number(dashboardData.stats.commissionGrowth) || 0,
        monthlyTrend: monthlyTrends,
        payoutStatus: [
          {
            status: 'Paid',
            amount: paidAmount,
            count: dashboardData.stats.paidTransactionsCount || 0,
            percentage: Math.round((paidAmount / totalAmount) * 100)
          },
          {
            status: 'Pending',
            amount: pendingAmount,
            count: (dashboardData.pendingCommissions || []).length,
            percentage: Math.round((pendingAmount / totalAmount) * 100)
          }
        ],
        tierBreakdown: getRealTierBreakdown()
      });
    } catch (error) {
      console.error('Error loading commission data:', error);
    }
  };

  loadCommissionData();
}, [allAffiliates]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze': return '#cd7f32';
      case 'Silver': return '#c0c0c0';
      case 'Gold': return '#ffd700';
      case 'Platinum': return '#e5e4e2';
      default: return '#6b7280';
    }
  };

  // Calculate real tier breakdown from affiliate data
  const getRealTierBreakdown = () => {
    const tierMap = new Map();
    
    if (!allAffiliates?.length) {
      return [
        { tier: 'Bronze', commissions: 0, affiliates: 0, avgCommission: 0 },
        { tier: 'Silver', commissions: 0, affiliates: 0, avgCommission: 0 },
        { tier: 'Gold', commissions: 0, affiliates: 0, avgCommission: 0 },
        { tier: 'Platinum', commissions: 0, affiliates: 0, avgCommission: 0 }
      ];
    }

    allAffiliates.forEach(affiliate => {
      const tierName = affiliate.tier || 'Bronze';
      if (!tierMap.has(tierName)) {
        tierMap.set(tierName, {
          tier: tierName,
          commissions: 0,
          affiliates: 0,
          avgCommission: 0
        });
      }
      
      const tierData = tierMap.get(tierName);
      tierData.commissions += affiliate.totalEarnings || 0;
      tierData.affiliates += 1;
    });
    
    // Calculate average commission for each tier
    tierMap.forEach(tierData => {
      tierData.avgCommission = tierData.affiliates > 0 
        ? Math.round(tierData.commissions / tierData.affiliates) 
        : 0;
    });
    
    return Array.from(tierMap.values())
      .sort((a, b) => b.commissions - a.commissions);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commission Analytics</h2>
          <p className="text-gray-600">Detailed commission performance and trends</p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${commissionData.totalCommissions.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{commissionData.commissionGrowth}% from last period
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
                <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${commissionData.pendingCommissions.toLocaleString()}
                </p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  {commissionData.payoutStatus[1].count} transactions
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Commission</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${commissionData.averageCommission}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Target className="h-4 w-4 mr-1" />
                  Per transaction
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Commissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${commissionData.paidCommissions.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {commissionData.payoutStatus[0].count} transactions
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Commission Trends
          </CardTitle>
          <CardDescription>
            Monthly commission performance and growth
          </CardDescription>
        </CardHeader>
                <CardContent className="pt-6">
          <div style={{ width: '100%', height: 400, position: 'relative' }}>
            <ResponsiveContainer>
              <BarChart
                data={commissionData.monthlyTrend}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }}
                  formatter={(value, name) => [
                    name === 'Commissions' ? `$${Number(value).toLocaleString()}` : `${value}%`,
                    name === 'Commissions' ? 'Total Commissions' : 'Growth Rate'
                  ]}
                  labelStyle={{ color: '#6b7280' }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => value === 'Commissions' ? 'Total Commissions' : 'Growth Rate'}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="Commissions" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  name="Commissions"
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="Growth" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  name="Growth"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Tier Performance
            </CardTitle>
            <CardDescription>
              Commission breakdown by affiliate tier
            </CardDescription>
          </CardHeader>
          {/* defective code */}
          {/* <CardContent>
            <div className="space-y-4">
              {getRealTierBreakdown().map((tier, index) => (
                <div key={`${tier.tier}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: getTierColor(tier.tier) }}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">{tier.tier} Tier</p>
                      <p className="text-sm text-gray-600">{tier.affiliates} affiliates</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${tier.commissions.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">${tier.avgCommission} avg</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent> */}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Payout Status
            </CardTitle>
            <CardDescription>
              Commission payout distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
                             <ResponsiveContainer width="100%" height="100%">
                 <RechartsPieChart>
                   <Pie
                    data={commissionData.payoutStatus?.filter(item => item?.amount > 0).map(item => ({
                      name: item.status || '',
                      value: Number(item.amount) || 0
                    })) || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    nameKey="name"
                    dataKey="value"
                    label={(entry) => String(entry.name || "")}
                  >
                    {(commissionData.payoutStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.status === 'Paid' ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, '']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {commissionData.payoutStatus.map((item, index) => (
                <div key={`${item.status}-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ 
                        backgroundColor: item.status === 'Paid' ? '#10b981' : '#f59e0b' 
                      }}
                    ></div>
                    <span className="text-sm text-gray-700">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      ${item.amount.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Performance Insights
          </CardTitle>
          <CardDescription>
            Key insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-900">Strong Growth</h4>
              <p className="text-sm text-green-700 mt-1">
                Commissions grew {commissionData.commissionGrowth}% this period
              </p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-900">Tier Performance</h4>
              <p className="text-sm text-blue-700 mt-1">
                {commissionData.tierBreakdown[0] ? 
  `${String(commissionData.tierBreakdown[0].tier)} tier leads with $${commissionData.tierBreakdown[0].commissions.toLocaleString()}` :
  'No tier data available'
}
              </p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-semibold text-orange-900">Pending Payouts</h4>
              <p className="text-sm text-orange-700 mt-1">
                ${commissionData.pendingCommissions.toLocaleString()} ready for processing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionAnalytics;


// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { adminAPI } from '../../services/api';
// import { 
//   TrendingUp, 
//   DollarSign, 
//   Users,
//   PieChart,
//   BarChart3,
//   Target,
//   Award,
//   Clock,
//   CheckCircle,
//   AlertCircle
// } from 'lucide-react';

// interface CommissionAnalyticsProps {
//   timeRange?: string;
//   allAffiliates?: any[];
// }

// const CommissionAnalytics: React.FC<CommissionAnalyticsProps> = ({ timeRange = '30d', allAffiliates = [] }) => {
//   const [selectedPeriod, setSelectedPeriod] = useState('monthly');
//   const [selectedTier, setSelectedTier] = useState('all');
//   const [isLoading, setIsLoading] = useState(true);

//   const [commissionData, setCommissionData] = useState({
//     totalCommissions: 0,
//     pendingCommissions: 0,
//     paidCommissions: 0,
//     averageCommission: 0,
//     commissionGrowth: 0,
//     monthlyTrend: [] as any[],
//     payoutStatus: [
//       { status: 'Paid', amount: 0, count: 0, percentage: 0 },
//       { status: 'Pending', amount: 0, count: 0, percentage: 0 }
//     ],
//     tierBreakdown: [] as any[]
//   });

//   useEffect(() => {
//     const loadCommissionData = async () => {
//       try {
//         setIsLoading(true);
//         const response = await adminAPI.getDashboard();
//         const dashboardData = response?.data || { stats: {} };
        
//         const pendingAmount = Number(dashboardData?.stats?.pendingCommissions) || 0;
//         const paidAmount = Number(dashboardData?.stats?.totalCommissionsPaid) || 0;
//         const totalAmount = pendingAmount + paidAmount || 1;

//         const monthlyTrends = (dashboardData.stats.commissionTrends || []).map((trend: any) => ({
//           month: new Date(trend.date).toLocaleString('default', { month: 'short' }),
//           commissions: Number(trend.amount),
//           growth: Number(trend.growthRate) || 0
//         }));

//         setCommissionData({
//           totalCommissions: totalAmount,
//           pendingCommissions: pendingAmount,
//           paidCommissions: paidAmount,
//           averageCommission: dashboardData.stats.averageCommission || 0,
//           commissionGrowth: Number(dashboardData.stats.commissionGrowth) || 0,
//           monthlyTrend: monthlyTrends,
//           payoutStatus: [
//             {
//               status: 'Paid',
//               amount: paidAmount,
//               count: dashboardData.stats.paidTransactionsCount || 0,
//               percentage: Math.round((paidAmount / totalAmount) * 100)
//             },
//             {
//               status: 'Pending',
//               amount: pendingAmount,
//               count: (dashboardData.pendingCommissions || []).length,
//               percentage: Math.round((pendingAmount / totalAmount) * 100)
//             }
//           ],
//           tierBreakdown: getRealTierBreakdown()
//         });
//       } catch (error) {
//         console.error('Error loading commission data:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadCommissionData();
//   }, [allAffiliates]);

//   const getTierColor = (tier: string) => {
//     switch (tier) {
//       case 'Bronze': return '#cd7f32';
//       case 'Silver': return '#c0c0c0';
//       case 'Gold': return '#ffd700';
//       case 'Platinum': return '#e5e4e2';
//       default: return '#6b7280';
//     }
//   };

//   const getRealTierBreakdown = () => {
//     const tierMap = new Map();
    
//     // Ensure we have valid default tiers
//     const defaultTiers = [
//       { tier: 'Bronze', commissions: 0, affiliates: 0, avgCommission: 0 },
//       { tier: 'Silver', commissions: 0, affiliates: 0, avgCommission: 0 },
//       { tier: 'Gold', commissions: 0, affiliates: 0, avgCommission: 0 },
//       { tier: 'Platinum', commissions: 0, affiliates: 0, avgCommission: 0 }
//     ];

//     if (!allAffiliates?.length) {
//       return defaultTiers;
//     }

//     // Initialize with default tiers
//     defaultTiers.forEach(tier => {
//       tierMap.set(tier.tier, { ...tier });
//     });

//     allAffiliates.forEach(affiliate => {
//       const tierName = affiliate.tier || 'Bronze';
//       if (!tierMap.has(tierName)) {
//         tierMap.set(tierName, {
//           tier: tierName,
//           commissions: 0,
//           affiliates: 0,
//           avgCommission: 0
//         });
//       }
      
//       const tierData = tierMap.get(tierName);
//       tierData.commissions += affiliate.totalEarnings || 0;
//       tierData.affiliates += 1;
//     });
    
//     tierMap.forEach(tierData => {
//       tierData.avgCommission = tierData.affiliates > 0 
//         ? Math.round(tierData.commissions / tierData.affiliates) 
//         : 0;
//     });
    
//     return Array.from(tierMap.values())
//       .sort((a, b) => b.commissions - a.commissions);
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Commission Analytics</h2>
//           <p className="text-gray-600">Detailed commission performance and trends</p>
//         </div>
//         <div className="flex space-x-2">
//           <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
//             <SelectTrigger className="w-32">
//               <SelectValue placeholder="Select period" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="weekly">Weekly</SelectItem>
//               <SelectItem value="monthly">Monthly</SelectItem>
//               <SelectItem value="quarterly">Quarterly</SelectItem>
//             </SelectContent>
//           </Select>
//           <Select value={selectedTier} onValueChange={setSelectedTier}>
//             <SelectTrigger className="w-32">
//               <SelectValue placeholder="Select tier" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Tiers</SelectItem>
//               <SelectItem value="bronze">Bronze</SelectItem>
//               <SelectItem value="silver">Silver</SelectItem>
//               <SelectItem value="gold">Gold</SelectItem>
//               <SelectItem value="platinum">Platinum</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       {/* Key Metrics */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Total Commissions</p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   ${(commissionData.totalCommissions || 0).toLocaleString()}
//                 </p>
//                 <p className="text-sm text-green-600 flex items-center mt-1">
//                   <TrendingUp className="h-4 w-4 mr-1" />
//                   +{(commissionData.commissionGrowth || 0)}% from last period
//                 </p>
//               </div>
//               <DollarSign className="h-8 w-8 text-green-600" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   ${(commissionData.pendingCommissions || 0).toLocaleString()}
//                 </p>
//                 <p className="text-sm text-orange-600 flex items-center mt-1">
//                   <Clock className="h-4 w-4 mr-1" />
//                   {(commissionData.payoutStatus[1]?.count || 0)} transactions
//                 </p>
//               </div>
//               <AlertCircle className="h-8 w-8 text-orange-600" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Average Commission</p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   ${commissionData.averageCommission || 0}
//                 </p>
//                 <p className="text-sm text-blue-600 flex items-center mt-1">
//                   <Target className="h-4 w-4 mr-1" />
//                   Per transaction
//                 </p>
//               </div>
//               <Target className="h-8 w-8 text-blue-600" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Paid Commissions</p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   ${(commissionData.paidCommissions || 0).toLocaleString()}
//                 </p>
//                 <p className="text-sm text-green-600 flex items-center mt-1">
//                   <CheckCircle className="h-4 w-4 mr-1" />
//                   {(commissionData.payoutStatus[0]?.count || 0)} transactions
//                 </p>
//               </div>
//               <CheckCircle className="h-8 w-8 text-green-600" />
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Commission Trends Chart (Commented out) */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center">
//             <BarChart3 className="h-5 w-5 mr-2" />
//             Commission Trends
//           </CardTitle>
//           <CardDescription>
//             Monthly commission performance and growth
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {/* Chart code removed */}
//         </CardContent>
//       </Card>

//       {/* Tier Performance */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center">
//               <Award className="h-5 w-5 mr-2" />
//               Tier Performance
//             </CardTitle>
//             <CardDescription>
//               Commission breakdown by affiliate tier
//             </CardDescription>
//           </CardHeader>
//           {/* <CardContent>
//             <div className="space-y-4">
//               {getRealTierBreakdown().map((tier, index) => (
//                 <div key={`${tier.tier}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                   <div className="flex items-center space-x-3">
//                     <div 
//                       className="w-4 h-4 rounded-full" 
//                       style={{ backgroundColor: getTierColor(tier.tier) }}
//                     ></div>
//                     <div>
//                       <p className="font-medium text-gray-900">{tier.tier} Tier</p>
//                       <p className="text-sm text-gray-600">{tier.affiliates} affiliates</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="font-bold text-gray-900">${(tier.commissions || 0).toLocaleString()}</p>
//                     <p className="text-sm text-gray-600">
//   ${typeof tier.avgCommission === "number" ? tier.avgCommission.toLocaleString() : 0} avg
// </p>

//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent> */}
//         </Card>

//         {/* Payout Status (without chart) */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center">
//               <PieChart className="h-5 w-5 mr-2" />
//               Payout Status
//             </CardTitle>
//             <CardDescription>
//               Commission payout distribution
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="mt-4 space-y-2">
//               {commissionData.payoutStatus.map((item, index) => (
//                 <div key={`${item.status}-${index}`} className="flex items-center justify-between">
//                   <div className="flex items-center space-x-2">
//                     <div 
//                       className="w-3 h-3 rounded-full" 
//                       style={{ 
//                         backgroundColor: item.status === 'Paid' ? '#10b981' : '#f59e0b' 
//                       }}
//                     ></div>
//                     <span className="text-sm text-gray-700">{item.status}</span>
//                   </div>
//                   <div className="text-right">
//                     <span className="text-sm font-medium text-gray-900">
//                       ${(item.amount || 0).toLocaleString()}
//                     </span>
//                     <span className="text-sm text-gray-600 ml-2">
//                       ({(item.percentage || 0)}%)
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Performance Insights */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center">
//             <Target className="h-5 w-5 mr-2" />
//             Performance Insights
//           </CardTitle>
//           <CardDescription>
//             Key insights and recommendations
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="text-center p-4 bg-green-50 rounded-lg">
//               <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
//               <h4 className="font-semibold text-green-900">Strong Growth</h4>
//               <p className="text-sm text-green-700 mt-1">
//                 Commissions grew {(commissionData.commissionGrowth || 0)}% this period
//               </p>
//             </div>
            
//             <div className="text-center p-4 bg-blue-50 rounded-lg">
//               <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
//               <h4 className="font-semibold text-blue-900">Tier Performance</h4>
//               <p className="text-sm text-blue-700 mt-1">
//                 {getRealTierBreakdown().length > 0 
//                   ? `${getRealTierBreakdown()[0].tier} tier leads with $${(getRealTierBreakdown()[0].commissions || 0).toLocaleString()}`
//                   : 'No tier data available'
//                 }
//               </p>
//             </div>
            
//             <div className="text-center p-4 bg-orange-50 rounded-lg">
//               <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
//               <h4 className="font-semibold text-orange-900">Pending Payouts</h4>
//               <p className="text-sm text-orange-700 mt-1">
//                 ${(commissionData.pendingCommissions || 0).toLocaleString()} ready for processing
//               </p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default CommissionAnalytics;