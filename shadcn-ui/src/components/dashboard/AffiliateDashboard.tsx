import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Copy, 
  Mail, 
  Trophy,
  Link as LinkIcon,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { AffiliateStats, EmailLead, Commission, Bonus } from '../../types';
import { DataService } from '../../services/mockData';

const AffiliateDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referralLink, setReferralLink] = useState('');
  const [emailLeads, setEmailLeads] = useState<EmailLead[]>([]);
  const [recentCommissions, setRecentCommissions] = useState<Commission[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);

  // Email invite form
  const [emailForm, setEmailForm] = useState({
    email: '',
    name: ''
  });
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        // Use the current user's ID as affiliate ID
        const affiliateId = user.id;
        
        const [statsData, commissions, leads, bonusData] = await Promise.all([
          DataService.getAffiliateStats(affiliateId),
          DataService.getCommissions(affiliateId),
          DataService.getEmailLeads(affiliateId),
          DataService.getBonuses(affiliateId)
        ]);

        setStats(statsData);
        setRecentCommissions(commissions.slice(0, 5));
        setEmailLeads(leads);
        setBonuses(bonusData);

        // Generate referral link
        const link = await DataService.generateReferralLink(affiliateId);
        setReferralLink(link);
      } catch (error) {
        console.error('Error loading affiliate dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSending(true);
    setEmailSuccess(false);

    try {
      const success = await DataService.sendEmailInvite(user.id, emailForm.email, emailForm.name);
      if (success) {
        setEmailSuccess(true);
        setEmailForm(prev => ({ ...prev, email: '' }));
        // Refresh email leads
        const updatedLeads = await DataService.getEmailLeads(user.id);
        setEmailLeads(updatedLeads);
      }
    } catch (error) {
      console.error('Error sending email invite:', error);
    } finally {
      setEmailSending(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down';
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className={`text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                {subtitle}
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-gray-600">Here's your affiliate performance overview</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Trophy className="w-3 h-3" />
          {stats.tierProgress.currentTier} Tier
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Earnings"
          value={`AED ${stats.totalEarnings.toLocaleString()}`}
          subtitle={`+AED ${stats.thisMonthEarnings} this month`}
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Pending Earnings"
          value={`AED ${stats.pendingEarnings.toLocaleString()}`}
          subtitle="Awaiting approval"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Referrals"
          value={stats.totalReferrals}
          subtitle={`${stats.conversionRate}% conversion rate`}
          icon={Users}
          trend="up"
        />
        <StatCard
          title="This Month"
          value={`AED ${stats.thisMonthEarnings}`}
          subtitle="Current month earnings"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>Share this link to earn commissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input value={referralLink} readOnly className="flex-1" />
              <Button onClick={copyReferralLink} size="icon">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">Share on Twitter</Button>
              <Button variant="outline" size="sm">Share on LinkedIn</Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Invites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Send Email Invites
            </CardTitle>
            <CardDescription>Invite people directly via email</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailInvite} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="friend@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  type="text"
                  value={emailForm.name}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Recipient's name..."
                />
              </div>
              <Button type="submit" disabled={emailSending} className="w-full">
                {emailSending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invite
                  </>
                )}
              </Button>
            </form>
            {emailSuccess && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Email invite sent successfully!</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Tier Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Tier Progress
            </CardTitle>
            <CardDescription>Your current tier status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="mb-2">
                {stats.tierProgress.currentTier} Tier
              </Badge>
              <p className="text-sm text-gray-600">{stats.tierProgress.requirement}</p>
            </div>
            <Progress value={stats.tierProgress.progress} className="w-full" />
            <p className="text-xs text-center text-gray-500">
              {stats.tierProgress.progress}% to {stats.tierProgress.nextTier || 'Maximum Tier'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Network</CardTitle>
          <CardDescription>Your multi-level referral structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.directReferrals}</p>
              <p className="text-sm text-gray-600">Level 1 (Direct)</p>
              <p className="text-xs text-blue-600">15% commission</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.level2Referrals}</p>
              <p className="text-sm text-gray-600">Level 2</p>
              <p className="text-xs text-green-600">5% commission</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{stats.level3Referrals}</p>
              <p className="text-sm text-gray-600">Level 3</p>
              <p className="text-xs text-purple-600">2.5% commission</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Commissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Commissions</CardTitle>
            <CardDescription>Your latest commission earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCommissions.map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={commission.status === 'paid' ? 'default' : commission.status === 'pending' ? 'secondary' : 'outline'}>
                      Level {commission.level}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">AED {commission.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(commission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {commission.status === 'paid' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {commission.status === 'pending' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Email Leads Status */}
        <Card>
          <CardHeader>
            <CardTitle>Email Invites Status</CardTitle>
            <CardDescription>Track your email invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{lead.email}</p>
                    <p className="text-xs text-gray-500">
                      Invited {new Date(lead.invitedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      lead.status === 'converted' ? 'default' : 
                      lead.status === 'confirmed' ? 'secondary' : 
                      'outline'
                    }
                  >
                    {lead.status}
                  </Badge>
                </div>
              ))}
              {emailLeads.length === 0 && (
                <p className="text-center text-gray-500 py-4">No email invites sent yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bonuses */}
      {bonuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bonuses</CardTitle>
            <CardDescription>Special rewards and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bonuses.map((bonus) => (
                <div key={bonus.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    <div>
                      <p className="font-medium">{bonus.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(bonus.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">+AED {bonus.amount}</p>
                    <Badge variant={bonus.status === 'paid' ? 'default' : 'secondary'}>
                      {bonus.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AffiliateDashboard;