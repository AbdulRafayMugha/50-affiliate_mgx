import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Target, 
  Users,
  MousePointer,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Filter,
  Zap,
  Eye,
  ArrowRight
} from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent
} from '../ui/chart';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ConversionAnalyticsProps {
  timeRange?: string;
}

const ConversionAnalytics: React.FC<ConversionAnalyticsProps> = ({ timeRange = '30d' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedSource, setSelectedSource] = useState('all');

  // Mock data - replace with real API calls
  const conversionData = {
    overallConversionRate: 18.5,
    conversionGrowth: 2.3,
    totalVisitors: 15000,
    totalConversions: 2775,
    funnelData: [
      { stage: 'Visitors', count: 15000, percentage: 100, dropoff: 0 },
      { stage: 'Link Clicks', count: 12000, percentage: 80, dropoff: 20 },
      { stage: 'Landing Page Views', count: 9000, percentage: 60, dropoff: 20 },
      { stage: 'Add to Cart', count: 4500, percentage: 30, dropoff: 30 },
      { stage: 'Checkout Started', count: 3600, percentage: 24, dropoff: 6 },
      { stage: 'Purchase Completed', count: 2775, percentage: 18.5, dropoff: 5.5 }
    ],
    sourceBreakdown: [
      { source: 'Social Media', visitors: 6000, conversions: 1200, rate: 20.0 },
      { source: 'Email Marketing', visitors: 4500, conversions: 945, rate: 21.0 },
      { source: 'Direct Traffic', visitors: 3000, conversions: 540, rate: 18.0 },
      { source: 'Search Engines', visitors: 1500, conversions: 90, rate: 6.0 }
    ],
    monthlyTrend: [
      { month: 'Jan', rate: 15.2, visitors: 12000, conversions: 1824 },
      { month: 'Feb', rate: 16.1, visitors: 12500, conversions: 2013 },
      { month: 'Mar', rate: 17.3, visitors: 13000, conversions: 2249 },
      { month: 'Apr', rate: 16.8, visitors: 13500, conversions: 2268 },
      { month: 'May', rate: 18.1, visitors: 14000, conversions: 2534 },
      { month: 'Jun', rate: 18.5, visitors: 15000, conversions: 2775 }
    ],
    topPerformingPages: [
      { page: '/product-page-1', visitors: 3000, conversions: 600, rate: 20.0 },
      { page: '/product-page-2', visitors: 2500, conversions: 450, rate: 18.0 },
      { page: '/landing-page-1', visitors: 2000, conversions: 400, rate: 20.0 },
      { page: '/product-page-3', visitors: 1800, conversions: 270, rate: 15.0 }
    ],
    deviceBreakdown: [
      { device: 'Desktop', visitors: 9000, conversions: 1800, rate: 20.0 },
      { device: 'Mobile', visitors: 4500, conversions: 675, rate: 15.0 },
      { device: 'Tablet', visitors: 1500, conversions: 300, rate: 20.0 }
    ]
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 15) return 'text-blue-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConversionBadgeColor = (rate: number) => {
    if (rate >= 20) return 'bg-green-100 text-green-800';
    if (rate >= 15) return 'bg-blue-100 text-blue-800';
    if (rate >= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conversion Analytics</h2>
          <p className="text-gray-600">Track and optimize your conversion funnel performance</p>
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
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="social">Social Media</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="search">Search</SelectItem>
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
                <p className="text-sm font-medium text-gray-600">Overall Conversion Rate</p>
                <p className={`text-2xl font-bold ${getConversionColor(conversionData.overallConversionRate)}`}>
                  {conversionData.overallConversionRate}%
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{conversionData.conversionGrowth}% from last period
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
                <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {conversionData.totalVisitors.toLocaleString()}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Unique visitors this period
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
                <p className="text-sm font-medium text-gray-600">Total Conversions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {conversionData.totalConversions.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Successful purchases
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Industry Average</p>
                <p className="text-2xl font-bold text-gray-900">15.0%</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <Zap className="h-4 w-4 mr-1" />
                  +3.5% above average
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
                     <CardTitle className="flex items-center">
             <Filter className="h-5 w-5 mr-2" />
             Conversion Funnel
           </CardTitle>
          <CardDescription>
            Track visitor journey through your conversion funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversionData.funnelData.map((stage, index) => (
              <div key={stage.stage} className="flex items-center space-x-4">
                <div className="w-24 text-sm font-medium text-gray-700">
                  {stage.stage}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">
                      {stage.count.toLocaleString()} visitors
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {stage.percentage}%
                    </span>
                  </div>
                  <Progress value={stage.percentage} className="h-2" />
                </div>
                {index < conversionData.funnelData.length - 1 && (
                  <div className="flex items-center text-red-500">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    <span className="text-sm">-{stage.dropoff}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Conversion Rate Trends
          </CardTitle>
          <CardDescription>
            Monthly conversion rate performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              "Conversion Rate": {
                label: "Conversion Rate",
                color: "#10b981"
              },
              "Visitors": {
                label: "Visitors",
                color: "#3b82f6"
              }
            }}
            className="h-[400px]"
          >
            <BarChart
              width={800}
              height={400}
              data={conversionData.monthlyTrend.map(item => ({
                name: item.month,
                "Conversion Rate": item.rate,
                "Visitors": item.visitors / 1000 // Scale down for better visualization
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
                        formatter={(value, name) => [
                          name === 'Conversion Rate' ? `${value}%` : `${value * 1000}`,
                          name
                        ]}
                      />
                    );
                  }}
                />
                <Bar dataKey="Conversion Rate" fill="#10b981" />
                <Bar dataKey="Visitors" fill="#3b82f6" />
              </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Source Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MousePointer className="h-5 w-5 mr-2" />
              Traffic Source Performance
            </CardTitle>
            <CardDescription>
              Conversion rates by traffic source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversionData.sourceBreakdown.map((source) => (
                <div key={source.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{source.source}</p>
                    <p className="text-sm text-gray-600">
                      {source.visitors.toLocaleString()} visitors
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getConversionBadgeColor(source.rate)}>
                      {source.rate}%
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      {source.conversions.toLocaleString()} conversions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Top Performing Pages
            </CardTitle>
            <CardDescription>
              Pages with highest conversion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversionData.topPerformingPages.map((page) => (
                <div key={page.page} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{page.page}</p>
                    <p className="text-sm text-gray-600">
                      {page.visitors.toLocaleString()} visitors
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getConversionBadgeColor(page.rate)}>
                      {page.rate}%
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      {page.conversions.toLocaleString()} conversions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Device Performance
          </CardTitle>
          <CardDescription>
            Conversion rates by device type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {conversionData.deviceBreakdown.map((device) => (
              <div key={device.device} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {device.device}
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {device.rate}%
                </div>
                <div className="text-sm text-gray-600">
                  {device.visitors.toLocaleString()} visitors
                </div>
                <div className="text-sm text-gray-600">
                  {device.conversions.toLocaleString()} conversions
                </div>
                <Progress 
                  value={device.rate} 
                  className="mt-3 h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Optimization Recommendations
          </CardTitle>
          <CardDescription>
            Actionable insights to improve conversion rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mb-2" />
              <h4 className="font-semibold text-yellow-900">Mobile Optimization</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Mobile conversion rate is 25% lower than desktop. Consider improving mobile UX.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
              <TrendingUp className="h-6 w-6 text-green-600 mb-2" />
              <h4 className="font-semibold text-green-900">Email Marketing Success</h4>
              <p className="text-sm text-green-700 mt-1">
                Email campaigns show 21% conversion rate. Consider increasing email marketing budget.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <Target className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-semibold text-blue-900">Checkout Optimization</h4>
              <p className="text-sm text-blue-700 mt-1">
                5.5% dropoff at checkout. Review checkout process and reduce friction.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionAnalytics;
