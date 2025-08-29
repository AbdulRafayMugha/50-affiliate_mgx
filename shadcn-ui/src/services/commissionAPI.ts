import api from './api';

export interface CommissionLevel {
  id: string;
  level: number;
  percentage: number;
  description: string;
  isActive: boolean;
  minReferrals?: number;
  maxReferrals?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSettings {
  globalCommissionEnabled: boolean;
  defaultLevel1Commission: number;
  defaultLevel2Commission: number;
  defaultLevel3Commission: number;
  maxCommissionLevels: number;
  autoAdjustEnabled: boolean;
  minimumCommission: number;
  maximumCommission: number;
}

export interface CommissionCalculation {
  saleAmount: number;
  numReferrals: number;
  levelBreakdown: {
    level: number;
    percentage: number;
    commission: number;
    totalForReferrals: number;
  }[];
  totalCommission: number;
  totalCommissionForReferrals: number;
}

export const commissionAPI = {
  // Get all commission levels
  getCommissionLevels: () => 
    api.get('/admin/commission-levels'),

  // Get a specific commission level
  getCommissionLevel: (id: string) => 
    api.get(`/admin/commission-levels/${id}`),

  // Create a new commission level
  createCommissionLevel: (data: Omit<CommissionLevel, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post('/admin/commission-levels', data),

  // Update a commission level
  updateCommissionLevel: (id: string, data: Partial<CommissionLevel>) => 
    api.put(`/admin/commission-levels/${id}`, data),

  // Delete a commission level
  deleteCommissionLevel: (id: string) => 
    api.delete(`/admin/commission-levels/${id}`),

  // Toggle commission level status
  toggleCommissionLevel: (id: string, isActive: boolean) => 
    api.patch(`/admin/commission-levels/${id}/toggle`, { isActive }),

  // Get commission settings
  getCommissionSettings: () => 
    api.get('/admin/commission-settings'),

  // Update commission settings
  updateCommissionSettings: (data: Partial<CommissionSettings>) => 
    api.put('/admin/commission-settings', data),

  // Calculate commissions
  calculateCommissions: (saleAmount: number, numReferrals: number = 1) => 
    api.post('/admin/commission-calculator', { saleAmount, numReferrals }),

  // Get commission statistics
  getCommissionStats: () => 
    api.get('/admin/commission-stats'),

  // Reset to default commission levels
  resetToDefaults: () => 
    api.post('/admin/commission-levels/reset'),

  // Bulk update commission levels
  bulkUpdateLevels: (levels: Partial<CommissionLevel>[]) => 
    api.put('/admin/commission-levels/bulk', { levels }),

  // Get commission history
  getCommissionHistory: (filters?: {
    startDate?: string;
    endDate?: string;
    level?: number;
    affiliateId?: string;
  }) => 
    api.get('/admin/commission-history', { params: filters }),

  // Export commission data
  exportCommissionData: (format: 'csv' | 'excel' | 'pdf' = 'csv') => 
    api.get('/admin/commission-export', { 
      params: { format },
      responseType: 'blob' 
    }),

  // Import commission levels
  importCommissionLevels: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/commission-levels/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get commission templates
  getCommissionTemplates: () => 
    api.get('/admin/commission-templates'),

  // Apply commission template
  applyCommissionTemplate: (templateId: string) => 
    api.post(`/admin/commission-templates/${templateId}/apply`),

  // Create commission template
  createCommissionTemplate: (data: {
    name: string;
    description: string;
    levels: Omit<CommissionLevel, 'id' | 'createdAt' | 'updatedAt'>[];
  }) => 
    api.post('/admin/commission-templates', data),

  // Get commission analytics
  getCommissionAnalytics: (filters?: {
    timeRange?: string;
    level?: number;
    affiliateId?: string;
  }) => 
    api.get('/admin/commission-analytics', { params: filters }),

  // Get commission performance by level
  getLevelPerformance: (levelId: string) => 
    api.get(`/admin/commission-levels/${levelId}/performance`),

  // Get commission recommendations
  getCommissionRecommendations: () => 
    api.get('/admin/commission-recommendations'),

  // Validate commission structure
  validateCommissionStructure: (levels: Partial<CommissionLevel>[]) => 
    api.post('/admin/commission-levels/validate', { levels }),

  // Get commission impact analysis
  getCommissionImpactAnalysis: (changes: {
    levelId: string;
    newPercentage: number;
  }[]) => 
    api.post('/admin/commission-impact-analysis', { changes }),

  // Lock/unlock commission changes
  toggleCommissionLock: (isLocked: boolean) => 
    api.post('/admin/commission-lock', { isLocked }),

  // Get commission audit log
  getCommissionAuditLog: (filters?: {
    startDate?: string;
    endDate?: string;
    action?: string;
    userId?: string;
  }) => 
    api.get('/admin/commission-audit-log', { params: filters }),

  // Get commission comparison
  getCommissionComparison: (scenario1: CommissionLevel[], scenario2: CommissionLevel[]) => 
    api.post('/admin/commission-comparison', { scenario1, scenario2 }),

  // Get commission optimization suggestions
  getOptimizationSuggestions: () => 
    api.get('/admin/commission-optimization-suggestions'),

  // Apply commission optimization
  applyOptimization: (optimizationId: string) => 
    api.post(`/admin/commission-optimization/${optimizationId}/apply`),

  // Get commission forecasting
  getCommissionForecasting: (filters?: {
    timeRange?: string;
    growthRate?: number;
    newAffiliates?: number;
  }) => 
    api.get('/admin/commission-forecasting', { params: filters }),

  // Get commission alerts
  getCommissionAlerts: () => 
    api.get('/admin/commission-alerts'),

  // Update commission alert settings
  updateCommissionAlertSettings: (settings: {
    lowCommissionThreshold: number;
    highCommissionThreshold: number;
    enableEmailAlerts: boolean;
    enableSMSAlerts: boolean;
  }) => 
    api.put('/admin/commission-alert-settings', settings),

  // Get commission reports
  getCommissionReports: (filters?: {
    reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate?: string;
    endDate?: string;
    level?: number;
  }) => 
    api.get('/admin/commission-reports', { params: filters }),

  // Generate custom commission report
  generateCustomReport: (params: {
    startDate: string;
    endDate: string;
    levels: number[];
    includeInactive: boolean;
    groupBy: 'day' | 'week' | 'month' | 'level' | 'affiliate';
  }) => 
    api.post('/admin/commission-reports/custom', params),

  // Get commission dashboard data
  getCommissionDashboard: () => 
    api.get('/admin/commission-dashboard'),

  // Get commission trends
  getCommissionTrends: (filters?: {
    timeRange?: string;
    level?: number;
    metric?: 'percentage' | 'amount' | 'count';
  }) => 
    api.get('/admin/commission-trends', { params: filters }),

  // Get commission benchmarks
  getCommissionBenchmarks: () => 
    api.get('/admin/commission-benchmarks'),

  // Update commission benchmarks
  updateCommissionBenchmarks: (benchmarks: {
    industryAverage: number;
    competitorRates: number[];
    targetRates: number[];
  }) => 
    api.put('/admin/commission-benchmarks', benchmarks),

  // Get commission compliance
  getCommissionCompliance: () => 
    api.get('/admin/commission-compliance'),

  // Get commission risk assessment
  getCommissionRiskAssessment: () => 
    api.get('/admin/commission-risk-assessment'),

  // Get commission ROI analysis
  getCommissionROIAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    affiliateId?: string;
  }) => 
    api.get('/admin/commission-roi-analysis', { params: filters }),

  // Get commission efficiency metrics
  getCommissionEfficiencyMetrics: () => 
    api.get('/admin/commission-efficiency-metrics'),

  // Get commission cost analysis
  getCommissionCostAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    includeOverhead: boolean;
  }) => 
    api.get('/admin/commission-cost-analysis', { params: filters }),

  // Get commission profit margins
  getCommissionProfitMargins: (filters?: {
    timeRange?: string;
    level?: number;
    productId?: string;
  }) => 
    api.get('/admin/commission-profit-margins', { params: filters }),

  // Get commission performance by affiliate tier
  getCommissionByTier: (tierId: string) => 
    api.get(`/admin/commission-tiers/${tierId}/performance`),

  // Get commission seasonality analysis
  getCommissionSeasonality: (filters?: {
    year?: number;
    level?: number;
    includePredictions: boolean;
  }) => 
    api.get('/admin/commission-seasonality', { params: filters }),

  // Get commission geographic analysis
  getCommissionGeographicAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    country?: string;
    region?: string;
  }) => 
    api.get('/admin/commission-geographic-analysis', { params: filters }),

  // Get commission device analysis
  getCommissionDeviceAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    deviceType?: string;
  }) => 
    api.get('/admin/commission-device-analysis', { params: filters }),

  // Get commission source analysis
  getCommissionSourceAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    source?: string;
  }) => 
    api.get('/admin/commission-source-analysis', { params: filters }),

  // Get commission conversion analysis
  getCommissionConversionAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    conversionType?: string;
  }) => 
    api.get('/admin/commission-conversion-analysis', { params: filters }),

  // Get commission lifetime value analysis
  getCommissionLTVAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    affiliateId?: string;
  }) => 
    api.get('/admin/commission-ltv-analysis', { params: filters }),

  // Get commission churn analysis
  getCommissionChurnAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    churnType?: string;
  }) => 
    api.get('/admin/commission-churn-analysis', { params: filters }),

  // Get commission retention analysis
  getCommissionRetentionAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    retentionPeriod?: string;
  }) => 
    api.get('/admin/commission-retention-analysis', { params: filters }),

  // Get commission cohort analysis
  getCommissionCohortAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    cohortType?: string;
  }) => 
    api.get('/admin/commission-cohort-analysis', { params: filters }),

  // Get commission funnel analysis
  getCommissionFunnelAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    funnelStage?: string;
  }) => 
    api.get('/admin/commission-funnel-analysis', { params: filters }),

  // Get commission A/B test results
  getCommissionABTestResults: (testId: string) => 
    api.get(`/admin/commission-ab-tests/${testId}/results`),

  // Create commission A/B test
  createCommissionABTest: (data: {
    name: string;
    description: string;
    variantA: CommissionLevel[];
    variantB: CommissionLevel[];
    duration: number;
    trafficSplit: number;
  }) => 
    api.post('/admin/commission-ab-tests', data),

  // Get commission machine learning insights
  getCommissionMLInsights: () => 
    api.get('/admin/commission-ml-insights'),

  // Get commission predictive analytics
  getCommissionPredictiveAnalytics: (filters?: {
    timeRange?: string;
    level?: number;
    predictionType?: string;
  }) => 
    api.get('/admin/commission-predictive-analytics', { params: filters }),

  // Get commission anomaly detection
  getCommissionAnomalyDetection: (filters?: {
    timeRange?: string;
    level?: number;
    anomalyType?: string;
  }) => 
    api.get('/admin/commission-anomaly-detection', { params: filters }),

  // Get commission sentiment analysis
  getCommissionSentimentAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    source?: string;
  }) => 
    api.get('/admin/commission-sentiment-analysis', { params: filters }),

  // Get commission competitive analysis
  getCommissionCompetitiveAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    competitor?: string;
  }) => 
    api.get('/admin/commission-competitive-analysis', { params: filters }),

  // Get commission market analysis
  getCommissionMarketAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    market?: string;
  }) => 
    api.get('/admin/commission-market-analysis', { params: filters }),

  // Get commission industry analysis
  getCommissionIndustryAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    industry?: string;
  }) => 
    api.get('/admin/commission-industry-analysis', { params: filters }),

  // Get commission regulatory compliance
  getCommissionRegulatoryCompliance: (filters?: {
    timeRange?: string;
    level?: number;
    regulation?: string;
  }) => 
    api.get('/admin/commission-regulatory-compliance', { params: filters }),

  // Get commission tax analysis
  getCommissionTaxAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    taxYear?: number;
  }) => 
    api.get('/admin/commission-tax-analysis', { params: filters }),

  // Get commission legal analysis
  getCommissionLegalAnalysis: (filters?: {
    timeRange?: string;
    level?: number;
    legalAspect?: string;
  }) => 
    api.get('/admin/commission-legal-analysis', { params: filters }),

  // Get commission audit trail
  getCommissionAuditTrail: (filters?: {
    startDate?: string;
    endDate?: string;
    action?: string;
    userId?: string;
    levelId?: string;
  }) => 
    api.get('/admin/commission-audit-trail', { params: filters }),

  // Get commission backup and restore
  getCommissionBackups: () => 
    api.get('/admin/commission-backups'),

  // Create commission backup
  createCommissionBackup: (data: {
    name: string;
    description: string;
    includeSettings: boolean;
    includeHistory: boolean;
  }) => 
    api.post('/admin/commission-backups', data),

  // Restore commission backup
  restoreCommissionBackup: (backupId: string) => 
    api.post(`/admin/commission-backups/${backupId}/restore`),

  // Get commission system health
  getCommissionSystemHealth: () => 
    api.get('/admin/commission-system-health'),

  // Get commission performance metrics
  getCommissionPerformanceMetrics: (filters?: {
    timeRange?: string;
    level?: number;
    metric?: string;
  }) => 
    api.get('/admin/commission-performance-metrics', { params: filters }),

  // Get commission SLA monitoring
  getCommissionSLAMonitoring: () => 
    api.get('/admin/commission-sla-monitoring'),

  // Get commission error logs
  getCommissionErrorLogs: (filters?: {
    startDate?: string;
    endDate?: string;
    errorType?: string;
    severity?: string;
  }) => 
    api.get('/admin/commission-error-logs', { params: filters }),

  // Get commission system logs
  getCommissionSystemLogs: (filters?: {
    startDate?: string;
    endDate?: string;
    logType?: string;
    level?: string;
  }) => 
    api.get('/admin/commission-system-logs', { params: filters }),

  // Get commission API usage
  getCommissionAPIUsage: (filters?: {
    startDate?: string;
    endDate?: string;
    endpoint?: string;
    userId?: string;
  }) => 
    api.get('/admin/commission-api-usage', { params: filters }),

  // Get commission rate limits
  getCommissionRateLimits: () => 
    api.get('/admin/commission-rate-limits'),

  // Update commission rate limits
  updateCommissionRateLimits: (limits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  }) => 
    api.put('/admin/commission-rate-limits', limits),

  // Get commission webhooks
  getCommissionWebhooks: () => 
    api.get('/admin/commission-webhooks'),

  // Create commission webhook
  createCommissionWebhook: (data: {
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
  }) => 
    api.post('/admin/commission-webhooks', data),

  // Update commission webhook
  updateCommissionWebhook: (webhookId: string, data: {
    name?: string;
    url?: string;
    events?: string[];
    isActive?: boolean;
  }) => 
    api.put(`/admin/commission-webhooks/${webhookId}`, data),

  // Delete commission webhook
  deleteCommissionWebhook: (webhookId: string) => 
    api.delete(`/admin/commission-webhooks/${webhookId}`),

  // Test commission webhook
  testCommissionWebhook: (webhookId: string) => 
    api.post(`/admin/commission-webhooks/${webhookId}/test`),

  // Get commission webhook logs
  getCommissionWebhookLogs: (webhookId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => 
    api.get(`/admin/commission-webhooks/${webhookId}/logs`, { params: filters }),

  // Get commission integrations
  getCommissionIntegrations: () => 
    api.get('/admin/commission-integrations'),

  // Connect commission integration
  connectCommissionIntegration: (integrationId: string, config: any) => 
    api.post(`/admin/commission-integrations/${integrationId}/connect`, config),

  // Disconnect commission integration
  disconnectCommissionIntegration: (integrationId: string) => 
    api.post(`/admin/commission-integrations/${integrationId}/disconnect`),

  // Get commission integration status
  getCommissionIntegrationStatus: (integrationId: string) => 
    api.get(`/admin/commission-integrations/${integrationId}/status`),

  // Sync commission integration
  syncCommissionIntegration: (integrationId: string) => 
    api.post(`/admin/commission-integrations/${integrationId}/sync`),

  // Get commission integration logs
  getCommissionIntegrationLogs: (integrationId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => 
    api.get(`/admin/commission-integrations/${integrationId}/logs`, { params: filters }),
};

export default commissionAPI;
