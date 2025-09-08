import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp,
  Users,
  Target,
  BarChart3
} from 'lucide-react';

interface CommissionLevel {
  id: string;
  level: number;
  percentage: number;
  description: string;
  isActive: boolean;
}

interface CommissionCalculatorProps {
  commissionLevels: CommissionLevel[];
}

const CommissionCalculator: React.FC<CommissionCalculatorProps> = ({ commissionLevels }) => {
  const [saleAmount, setSaleAmount] = useState<number>(100);
  const [numReferrals, setNumReferrals] = useState<number>(1);

  const activeLevels = (commissionLevels || []).filter(level => level.isActive);

  const calculateCommissions = () => {
    return activeLevels.map(level => {
      const percentage = typeof level.percentage === 'string' ? parseFloat(level.percentage) : (level.percentage || 0);
      const safePercentage = isNaN(percentage) ? 0 : percentage;
      return {
        level: level.level,
        percentage: safePercentage,
        commission: (saleAmount * safePercentage) / 100,
        totalForReferrals: ((saleAmount * safePercentage) / 100) * numReferrals,
        description: level.description
      };
    });
  };

  const totalCommission = calculateCommissions().reduce((sum, item) => sum + item.commission, 0);
  const totalCommissionForReferrals = calculateCommissions().reduce((sum, item) => sum + item.totalForReferrals, 0);
  const totalPercentage = activeLevels.reduce((sum, level) => {
    const percentage = typeof level.percentage === 'string' ? parseFloat(level.percentage) : (level.percentage || 0);
    return sum + (isNaN(percentage) ? 0 : percentage);
  }, 0);

  const scenarios = [
    { name: 'Small Sale', amount: 50, referrals: 1 },
    { name: 'Medium Sale', amount: 200, referrals: 3 },
    { name: 'Large Sale', amount: 500, referrals: 5 },
    { name: 'Enterprise', amount: 1000, referrals: 10 }
  ];

  return (
    <div className="space-y-6">
      {/* Main Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Commission Calculator
          </CardTitle>
          <CardDescription>
            Calculate potential earnings for different sale amounts and referral counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Sale Amount (AED)</label>
                <Input
                  type="number"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter sale amount"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Number of Referrals</label>
                <Input
                  type="number"
                  value={numReferrals}
                  onChange={(e) => setNumReferrals(parseInt(e.target.value) || 0)}
                  placeholder="Enter number of referrals"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Commission</span>
                  <span className="text-2xl font-bold text-blue-600">AED {(() => {
                    try {
                      const value = Number(totalCommission);
                      return isNaN(value) ? '0.00' : value.toFixed(2);
                    } catch (error) {
                      return '0.00';
                    }
                  })()}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">For {numReferrals} referral(s)</span>
                  <span className="text-lg font-semibold text-green-600">AED {(() => {
                    try {
                      const value = Number(totalCommissionForReferrals);
                      return isNaN(value) ? '0.00' : value.toFixed(2);
                    } catch (error) {
                      return '0.00';
                    }
                  })()}</span>
                </div>
                <Progress value={(totalPercentage / 50) * 100} className="mt-2" />
                <p className="text-xs text-gray-500 mt-1">Total: {(() => {
                  try {
                    const value = Number(totalPercentage);
                    return isNaN(value) ? '0.0' : value.toFixed(1);
                  } catch (error) {
                    return '0.0';
                  }
                })()}% commission rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Commission Breakdown
          </CardTitle>
          <CardDescription>
            Detailed breakdown of commissions by level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calculateCommissions().map((item) => (
              <div key={item.level} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">Level {item.level}</Badge>
                    <span className="font-medium text-gray-900">{item.percentage}%</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">AED {item.commission.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">AED {item.totalForReferrals.toFixed(2)} total</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
                <div className="mt-2">
                  <Progress 
                    value={(item.percentage / Math.max(...activeLevels.map(l => l.percentage))) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Quick Scenarios
          </CardTitle>
          <CardDescription>
            Predefined scenarios for quick calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map((scenario) => {
              const scenarioCommissions = activeLevels.map(level => ({
                level: level.level,
                commission: (scenario.amount * level.percentage) / 100,
                totalForReferrals: ((scenario.amount * level.percentage) / 100) * scenario.referrals
              }));
              const totalScenarioCommission = scenarioCommissions.reduce((sum, item) => sum + item.totalForReferrals, 0);

              return (
                <div 
                  key={scenario.name}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setSaleAmount(scenario.amount);
                    setNumReferrals(scenario.referrals);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sale:</span>
                      <span className="font-medium">AED {scenario.amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Referrals:</span>
                      <span className="font-medium">{scenario.referrals}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-green-600">
                      <span>Total:</span>
                      <span>AED {totalScenarioCommission.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Commission Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Commission Insights
          </CardTitle>
          <CardDescription>
            Key insights about your commission structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {(() => {
                  try {
                    const value = Number(totalPercentage);
                    return isNaN(value) ? '0.0' : value.toFixed(1);
                  } catch (error) {
                    return '0.0';
                  }
                })()}%
              </div>
              <div className="text-sm text-green-700">Total Commission Rate</div>
              <div className="text-xs text-green-600 mt-1">
                Across {activeLevels.length} levels
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                AED {(saleAmount * totalPercentage / 100).toFixed(2)}
              </div>
              <div className="text-sm text-blue-700">Commission per AED 100</div>
              <div className="text-xs text-blue-600 mt-1">
                For single referral
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {activeLevels.length}
              </div>
              <div className="text-sm text-purple-700">Active Levels</div>
              <div className="text-xs text-purple-600 mt-1">
                Commission tiers
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">💡 Optimization Tips</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Higher commission rates attract more affiliates but reduce profit margins</li>
              <li>• Consider tier-based commissions to reward high-performing affiliates</li>
              <li>• Monitor conversion rates to optimize commission structure</li>
              <li>• Balance between competitive rates and sustainable profitability</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionCalculator;
