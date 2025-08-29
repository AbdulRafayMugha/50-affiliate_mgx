import api from './api';

export interface AnalyticsFilters {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  startDate?: string;
  endDate?: string;
  affiliateId?: string;
  tier?: string;
  source?: string;
}

export interface AnalyticsMetrics {
  totalRevenue: number;
  totalCommissions: number;
  totalAffiliates: number;
  activeAffiliates: number;
  conversionRate: number;
  averageOrderValue: number;
  revenueGrowth: number;
  commissionGrowth: number;
  newSignups: number;
  pendingPayouts: number;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
  dropoff: number;
}

export interface GeographicData {
  region: string;
  revenue: number;
  affiliates: number;
  conversionRate: number;
}

export interface DeviceAnalytics {
  device: string;
  visitors: number;
  conversions: number;
  rate: number;
}

export interface SourceAnalytics {
  source: string;
  visitors: number;
  conversions: number;
  rate: number;
  revenue: number;
}

export interface TierPerformance {
  tier: string;
  affiliates: number;
  totalRevenue: number;
  averageCommission: number;
  conversionRate: number;
}

export interface CommissionAnalytics {
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  averageCommission: number;
  commissionGrowth: number;
  tierBreakdown: TierPerformance[];
  monthlyTrend: {
    month: string;
    commissions: number;
    growth: number;
  }[];
  payoutStatus: {
    status: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
}

export interface ConversionAnalytics {
  overallConversionRate: number;
  conversionGrowth: number;
  totalVisitors: number;
  totalConversions: number;
  funnelData: ConversionFunnel[];
  sourceBreakdown: SourceAnalytics[];
  monthlyTrend: {
    month: string;
    rate: number;
    visitors: number;
    conversions: number;
  }[];
  topPerformingPages: {
    page: string;
    visitors: number;
    conversions: number;
    rate: number;
  }[];
  deviceBreakdown: DeviceAnalytics[];
}

export const analyticsAPI = {
  // Get overall analytics metrics
  getMetrics: (filters?: AnalyticsFilters) =>
    api.get('/analytics/metrics', { params: filters }),

  // Get conversion analytics
  getConversionAnalytics: (filters?: AnalyticsFilters) =>
    api.get('/analytics/conversions', { params: filters }),

  // Get commission analytics
  getCommissionAnalytics: (filters?: AnalyticsFilters) =>
    api.get('/analytics/commissions', { params: filters }),

  // Get geographic distribution
  getGeographicData: (filters?: AnalyticsFilters) =>
    api.get('/analytics/geographic', { params: filters }),

  // Get device analytics
  getDeviceAnalytics: (filters?: AnalyticsFilters) =>
    api.get('/analytics/devices', { params: filters }),

  // Get source analytics
  getSourceAnalytics: (filters?: AnalyticsFilters) =>
    api.get('/analytics/sources', { params: filters }),

  // Get tier performance
  getTierPerformance: (filters?: AnalyticsFilters) =>
    api.get('/analytics/tiers', { params: filters }),

  // Get top performing affiliates
  getTopAffiliates: (limit: number = 10, filters?: AnalyticsFilters) =>
    api.get('/analytics/top-affiliates', { params: { limit, ...filters } }),

  // Get revenue trends
  getRevenueTrends: (filters?: AnalyticsFilters) =>
    api.get('/analytics/revenue-trends', { params: filters }),

  // Get commission trends
  getCommissionTrends: (filters?: AnalyticsFilters) =>
    api.get('/analytics/commission-trends', { params: filters }),

  // Get conversion trends
  getConversionTrends: (filters?: AnalyticsFilters) =>
    api.get('/analytics/conversion-trends', { params: filters }),

  // Get affiliate performance comparison
  getAffiliateComparison: (affiliateIds: string[], filters?: AnalyticsFilters) =>
    api.post('/analytics/affiliate-comparison', { affiliateIds, filters }),

  // Get performance insights and recommendations
  getInsights: (filters?: AnalyticsFilters) =>
    api.get('/analytics/insights', { params: filters }),

  // Export analytics report
  exportReport: (filters?: AnalyticsFilters, format: 'pdf' | 'csv' | 'excel' = 'pdf') =>
    api.get('/analytics/export', { 
      params: { ...filters, format },
      responseType: 'blob'
    }),

  // Get real-time analytics
  getRealTimeMetrics: () =>
    api.get('/analytics/realtime'),

  // Set up analytics alerts
  setupAlerts: (alertConfig: {
    metric: string;
    threshold: number;
    condition: 'above' | 'below';
    email?: string;
    webhook?: string;
  }) =>
    api.post('/analytics/alerts', alertConfig),

  // Get analytics alerts
  getAlerts: () =>
    api.get('/analytics/alerts'),

  // Update analytics alert
  updateAlert: (alertId: string, alertConfig: any) =>
    api.put(`/analytics/alerts/${alertId}`, alertConfig),

  // Delete analytics alert
  deleteAlert: (alertId: string) =>
    api.delete(`/analytics/alerts/${alertId}`),

  // Get analytics dashboard configuration
  getDashboardConfig: () =>
    api.get('/analytics/dashboard-config'),

  // Update analytics dashboard configuration
  updateDashboardConfig: (config: any) =>
    api.put('/analytics/dashboard-config', config),

  // Get custom analytics queries
  getCustomQuery: (query: string, filters?: AnalyticsFilters) =>
    api.post('/analytics/custom-query', { query, filters }),

  // Save custom analytics query
  saveCustomQuery: (query: {
    name: string;
    description: string;
    query: string;
    filters?: AnalyticsFilters;
  }) =>
    api.post('/analytics/custom-queries', query),

  // Get saved custom queries
  getCustomQueries: () =>
    api.get('/analytics/custom-queries'),

  // Delete custom query
  deleteCustomQuery: (queryId: string) =>
    api.delete(`/analytics/custom-queries/${queryId}`),

  // Get analytics performance benchmarks
  getBenchmarks: (industry?: string) =>
    api.get('/analytics/benchmarks', { params: { industry } }),

  // Get predictive analytics
  getPredictions: (metric: string, days: number = 30) =>
    api.get('/analytics/predictions', { params: { metric, days } }),

  // Get anomaly detection
  getAnomalies: (metric: string, filters?: AnalyticsFilters) =>
    api.get('/analytics/anomalies', { params: { metric, ...filters } }),

  // Get cohort analysis
  getCohortAnalysis: (filters?: AnalyticsFilters) =>
    api.get('/analytics/cohorts', { params: filters }),

  // Get funnel analysis
  getFunnelAnalysis: (funnelId: string, filters?: AnalyticsFilters) =>
    api.get(`/analytics/funnels/${funnelId}`, { params: filters }),

  // Create custom funnel
  createFunnel: (funnel: {
    name: string;
    description: string;
    stages: string[];
  }) =>
    api.post('/analytics/funnels', funnel),

  // Get all funnels
  getFunnels: () =>
    api.get('/analytics/funnels'),

  // Update funnel
  updateFunnel: (funnelId: string, funnel: any) =>
    api.put(`/analytics/funnels/${funnelId}`, funnel),

  // Delete funnel
  deleteFunnel: (funnelId: string) =>
    api.delete(`/analytics/funnels/${funnelId}`),

  // Get A/B test results
  getABTestResults: (testId: string) =>
    api.get(`/analytics/ab-tests/${testId}/results`),

  // Create A/B test
  createABTest: (test: {
    name: string;
    description: string;
    variants: string[];
    metric: string;
    trafficSplit: number[];
  }) =>
    api.post('/analytics/ab-tests', test),

  // Get all A/B tests
  getABTests: () =>
    api.get('/analytics/ab-tests'),

  // Update A/B test
  updateABTest: (testId: string, test: any) =>
    api.put(`/analytics/ab-tests/${testId}`, test),

  // Stop A/B test
  stopABTest: (testId: string) =>
    api.post(`/analytics/ab-tests/${testId}/stop`),

  // Get analytics goals
  getGoals: () =>
    api.get('/analytics/goals'),

  // Create analytics goal
  createGoal: (goal: {
    name: string;
    description: string;
    metric: string;
    target: number;
    deadline: string;
  }) =>
    api.post('/analytics/goals', goal),

  // Update analytics goal
  updateGoal: (goalId: string, goal: any) =>
    api.put(`/analytics/goals/${goalId}`, goal),

  // Delete analytics goal
  deleteGoal: (goalId: string) =>
    api.delete(`/analytics/goals/${goalId}`),

  // Get goal progress
  getGoalProgress: (goalId: string) =>
    api.get(`/analytics/goals/${goalId}/progress`),
};

export default analyticsAPI;
