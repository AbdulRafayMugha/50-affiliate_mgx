import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Trophy,
  Gift,
  Target,
  Users,
  Calendar,
  DollarSign,
  Star,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Crown,
  Sparkles
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';

interface Bonus {
  id: string;
  type: 'signup' | 'milestone' | 'tier_upgrade' | 'special' | 'monthly' | 'target';
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'expired';
  earnedAt: string;
  paidAt?: string;
  expiresAt?: string;
  progress?: number;
  target?: number;
  category: 'welcome' | 'performance' | 'achievement' | 'seasonal' | 'loyalty';
}

interface BonusChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  expiresAt: string;
  category: 'referral' | 'sales' | 'engagement' | 'streak';
  difficulty: 'easy' | 'medium' | 'hard';
}

const BonusesRewards = () => {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [challenges, setChallenges] = useState<BonusChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'welcome' | 'performance' | 'achievement' | 'seasonal' | 'loyalty'>('all');

  useEffect(() => {
    loadBonusData();
  }, []);

  const loadBonusData = async () => {
    try {
      setLoading(true);
      // Simulate API call with demo data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo bonuses
      const demoBonuses: Bonus[] = [
        {
          id: '1',
          type: 'signup',
          title: 'Welcome Bonus',
          description: 'Congratulations on joining our affiliate program!',
          amount: 50.00,
          status: 'paid',
          earnedAt: '2024-01-15T10:00:00Z',
          paidAt: '2024-01-16T10:00:00Z',
          category: 'welcome'
        },
        {
          id: '2',
          type: 'milestone',
          title: 'First 10 Referrals Milestone',
          description: 'You successfully referred 10 new users!',
          amount: 100.00,
          status: 'approved',
          earnedAt: '2024-02-01T14:30:00Z',
          category: 'performance'
        },
        {
          id: '3',
          type: 'tier_upgrade',
          title: 'Gold Tier Achievement',
          description: 'Upgraded to Gold tier for exceptional performance',
          amount: 250.00,
          status: 'paid',
          earnedAt: '2024-02-15T09:15:00Z',
          paidAt: '2024-02-16T10:00:00Z',
          category: 'achievement'
        },
        {
          id: '4',
          type: 'monthly',
          title: 'Top Performer February',
          description: 'You were among the top 10 performers this month!',
          amount: 200.00,
          status: 'pending',
          earnedAt: '2024-02-28T23:59:00Z',
          category: 'performance'
        },
        {
          id: '5',
          type: 'special',
          title: 'Valentine\'s Day Special',
          description: 'Special bonus for active affiliates during Valentine\'s week',
          amount: 75.00,
          status: 'paid',
          earnedAt: '2024-02-14T12:00:00Z',
          paidAt: '2024-02-15T10:00:00Z',
          category: 'seasonal'
        },
        {
          id: '6',
          type: 'target',
          title: 'Monthly Sales Target',
          description: 'Achieved $5,000 in referred sales this month',
          amount: 300.00,
          status: 'approved',
          earnedAt: '2024-02-29T20:45:00Z',
          category: 'performance'
        },
        {
          id: '7',
          type: 'special',
          title: '6-Month Loyalty Bonus',
          description: 'Thank you for being with us for 6 months!',
          amount: 150.00,
          status: 'pending',
          earnedAt: '2024-03-01T00:00:00Z',
          category: 'loyalty'
        }
      ];

      // Demo challenges
      const demoChallenges: BonusChallenge[] = [
        {
          id: '1',
          title: 'Referral Sprint',
          description: 'Refer 5 new users this week',
          reward: 125.00,
          progress: 3,
          target: 5,
          expiresAt: '2024-03-10T23:59:59Z',
          category: 'referral',
          difficulty: 'medium'
        },
        {
          id: '2',
          title: 'Sales Champion',
          description: 'Generate $2,000 in sales this month',
          reward: 400.00,
          progress: 1450,
          target: 2000,
          expiresAt: '2024-03-31T23:59:59Z',
          category: 'sales',
          difficulty: 'hard'
        },
        {
          id: '3',
          title: 'Engagement Master',
          description: 'Send 10 email invites this week',
          reward: 50.00,
          progress: 7,
          target: 10,
          expiresAt: '2024-03-10T23:59:59Z',
          category: 'engagement',
          difficulty: 'easy'
        },
        {
          id: '4',
          title: 'Consistency Streak',
          description: 'Be active for 7 consecutive days',
          reward: 100.00,
          progress: 4,
          target: 7,
          expiresAt: '2024-03-15T23:59:59Z',
          category: 'streak',
          difficulty: 'medium'
        }
      ];

      setBonuses(demoBonuses);
      setChallenges(demoChallenges);
    } catch (error) {
      console.error('Error loading bonus data:', error);
      toast({
        title: "Error",
        description: "Failed to load bonus data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBonuses = () => {
    if (selectedCategory === 'all') return bonuses;
    return bonuses.filter(bonus => bonus.category === selectedCategory);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'approved':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getBonusIcon = (type: string, category: string) => {
    if (category === 'welcome') return <Gift className="w-5 h-5 text-purple-600" />;
    if (category === 'achievement') return <Trophy className="w-5 h-5 text-yellow-600" />;
    if (category === 'seasonal') return <Sparkles className="w-5 h-5 text-pink-600" />;
    if (category === 'loyalty') return <Crown className="w-5 h-5 text-indigo-600" />;
    
    switch (type) {
      case 'signup':
        return <Gift className="w-5 h-5 text-purple-600" />;
      case 'milestone':
        return <Target className="w-5 h-5 text-green-600" />;
      case 'tier_upgrade':
        return <Trophy className="w-5 h-5 text-yellow-600" />;
      case 'target':
        return <Zap className="w-5 h-5 text-orange-600" />;
      default:
        return <Award className="w-5 h-5 text-blue-600" />;
    }
  };

  const getChallengeIcon = (category: string) => {
    switch (category) {
      case 'referral':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'sales':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'engagement':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'streak':
        return <Star className="w-4 h-4 text-yellow-600" />;
      default:
        return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const totalEarned = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
  const paidBonuses = bonuses.filter(b => b.status === 'paid');
  const pendingBonuses = bonuses.filter(b => b.status === 'pending' || b.status === 'approved');

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bonuses & Rewards</h1>
            <p className="text-gray-600">Loading your rewards...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bonuses & Rewards</h1>
          <p className="text-gray-600">Track your bonus earnings and active challenges</p>
        </div>
        <Button onClick={loadBonusData} variant="outline">
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bonuses Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  AED {totalEarned.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <Trophy className="h-4 w-4 mr-1" />
                  {bonuses.length} bonuses earned
                </p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Bonuses</p>
                <p className="text-2xl font-bold text-gray-900">
                  AED {paidBonuses.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {paidBonuses.length} bonuses paid
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bonuses</p>
                <p className="text-2xl font-bold text-gray-900">
                  AED {pendingBonuses.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                </p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  {pendingBonuses.length} awaiting payment
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Active Challenges
          </CardTitle>
          <CardDescription>
            Complete challenges to earn bonus rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getChallengeIcon(challenge.category)}
                    <div>
                      <h4 className="font-medium text-gray-900">{challenge.title}</h4>
                      <p className="text-sm text-gray-600">{challenge.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">AED {challenge.reward}</p>
                    <p className={`text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty.toUpperCase()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress: {challenge.progress}/{challenge.target}</span>
                    <span>{Math.round((challenge.progress / challenge.target) * 100)}%</span>
                  </div>
                  <Progress value={(challenge.progress / challenge.target) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Expires {new Date(challenge.expiresAt).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {challenge.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-2 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              size="sm"
            >
              All ({bonuses.length})
            </Button>
            <Button
              variant={selectedCategory === 'welcome' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('welcome')}
              size="sm"
            >
              Welcome ({bonuses.filter(b => b.category === 'welcome').length})
            </Button>
            <Button
              variant={selectedCategory === 'performance' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('performance')}
              size="sm"
            >
              Performance ({bonuses.filter(b => b.category === 'performance').length})
            </Button>
            <Button
              variant={selectedCategory === 'achievement' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('achievement')}
              size="sm"
            >
              Achievement ({bonuses.filter(b => b.category === 'achievement').length})
            </Button>
            <Button
              variant={selectedCategory === 'seasonal' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('seasonal')}
              size="sm"
            >
              Seasonal ({bonuses.filter(b => b.category === 'seasonal').length})
            </Button>
            <Button
              variant={selectedCategory === 'loyalty' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('loyalty')}
              size="sm"
            >
              Loyalty ({bonuses.filter(b => b.category === 'loyalty').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bonuses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Your Bonuses
          </CardTitle>
          <CardDescription>
            {getFilteredBonuses().length} {selectedCategory === 'all' ? 'total' : selectedCategory} bonuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getFilteredBonuses().length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {selectedCategory === 'all' ? '' : selectedCategory} bonuses yet
              </h3>
              <p className="text-gray-600">
                Keep performing well to earn bonus rewards!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredBonuses().map((bonus) => (
                <div key={bonus.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getBonusIcon(bonus.type, bonus.category)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{bonus.title}</h4>
                        {getStatusBadge(bonus.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{bonus.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Earned {new Date(bonus.earnedAt).toLocaleDateString()}
                        </span>
                        {bonus.paidAt && (
                          <span className="flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Paid {new Date(bonus.paidAt).toLocaleDateString()}
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {bonus.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <div>
                      <p className="text-lg font-bold text-green-600">+AED {bonus.amount}</p>
                      <div className="flex items-center">
                        {getStatusIcon(bonus.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BonusesRewards;
