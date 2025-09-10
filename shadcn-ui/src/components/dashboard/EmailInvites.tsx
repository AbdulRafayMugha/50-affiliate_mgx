import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  Mail, 
  Send, 
  Users, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  BarChart3,
  Calendar,
  User
} from 'lucide-react';
import { affiliateAPI } from '../../services/api';
import { toast } from '../../hooks/use-toast';

interface EmailInvite {
  id: string;
  email: string;
  name?: string;
  phone_number?: string;
  status: 'invited' | 'confirmed' | 'converted' | 'expired';
  invited_at: string;
  confirmed_at?: string;
  converted_at?: string;
  expires_at: string;
  conversion_value?: number;
  created_at: string;
  updated_at: string;
}

interface EmailStats {
  totalInvited: number;
  totalConfirmed: number;
  totalConverted: number;
  totalExpired: number;
  confirmationRate: number;
  conversionRate: number;
}

const EmailInvites = () => {
  const [invites, setInvites] = useState<EmailInvite[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'invited' | 'confirmed' | 'converted' | 'expired'>('all');

  // Email form
  const [emailForm, setEmailForm] = useState({
    email: '',
    name: '',
    phoneNumber: ''
  });

  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailData = async () => {
    try {
      setLoading(true);
      const response = await affiliateAPI.getEmailInvites();
      
      if (response.data.invites) {
        setInvites(response.data.invites);
        
        // Calculate stats from the data
        const totalInvited = response.data.invites.length;
        const totalConfirmed = response.data.invites.filter(i => i.status === 'confirmed').length;
        const totalConverted = response.data.invites.filter(i => i.status === 'converted').length;
        const totalExpired = response.data.invites.filter(i => i.status === 'expired').length;
        
        setStats({
          totalInvited,
          totalConfirmed,
          totalConverted,
          totalExpired,
          confirmationRate: totalInvited > 0 ? Math.round((totalConfirmed / totalInvited) * 100 * 100) / 100 : 0,
          conversionRate: totalInvited > 0 ? Math.round((totalConverted / totalInvited) * 100 * 100) / 100 : 0
        });
      }
    } catch (error) {
      console.error('Error loading email invites:', error);
      toast({
        title: "Error",
        description: "Failed to load email invites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailForm.email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await affiliateAPI.sendEmailInvite(emailForm.email, emailForm.name, emailForm.phoneNumber);
      
      toast({
        title: "Success",
        description: "Email invite sent successfully!",
      });
      
      // Reset form and reload data
      setEmailForm(prev => ({ ...prev, email: '', name: '', phoneNumber: '' }));
      await loadEmailData();
    } catch (error: any) {
      console.error('Error sending email invite:', error);
      
      let errorMessage = 'Failed to send email invite';
      if (error.response?.status === 409) {
        errorMessage = 'This email address has already been invited. Please use a different email address.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getFilteredInvites = () => {
    if (selectedStatus === 'all') return invites;
    return invites.filter(invite => invite.status === selectedStatus);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'opened':
        return <Eye className="w-4 h-4 text-green-600" />;
      case 'clicked':
        return <MousePointer className="w-4 h-4 text-purple-600" />;
      case 'converted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline">Sent</Badge>;
      case 'opened':
        return <Badge variant="secondary">Opened</Badge>;
      case 'clicked':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Clicked</Badge>;
      case 'converted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Converted</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-blue-600';
      case 'opened':
        return 'text-yellow-600';
      case 'clicked':
        return 'text-purple-600';
      case 'converted':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Invites</h1>
            <p className="text-gray-600">Loading your email invitations...</p>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Invites</h1>
          <p className="text-gray-600">Send and track email invitations to grow your network</p>
        </div>
        <Button onClick={loadEmailData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalInvited || 0}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-1" />
                  Email invitations
                </p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.confirmationRate || 0}%
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <Eye className="h-4 w-4 mr-1" />
                  {stats?.totalConfirmed || 0} confirmed
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.conversionRate || 0}%
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <MousePointer className="h-4 w-4 mr-1" />
                  {stats?.totalConverted || 0} converted
                </p>
              </div>
              <MousePointer className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalExpired || 0}
                </p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  {stats?.totalExpired || 0} expired
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Overview
          </CardTitle>
          <CardDescription>
            Visual breakdown of your email campaign performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Confirmation Rate</span>
                <span>{stats?.confirmationRate || 0}%</span>
              </div>
              <Progress value={stats?.confirmationRate || 0} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Conversion Rate</span>
                <span>{stats?.conversionRate || 0}%</span>
              </div>
              <Progress value={stats?.conversionRate || 0} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Conversion Rate</span>
                <span>{stats?.conversionRate || 0}%</span>
              </div>
              <Progress value={stats?.conversionRate || 0} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send New Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Send New Invite
          </CardTitle>
          <CardDescription>
            Invite new people to join through your referral link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="flex items-end">
                <Button type="submit" disabled={sending} className="w-full">
                  {sending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
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
            <div>
              <Label htmlFor="phoneNumber">Phone Number (Preferred)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={emailForm.phoneNumber}
                onChange={(e) => setEmailForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Status Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-2 flex-wrap">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('all')}
              size="sm"
            >
              All ({invites.length})
            </Button>
            <Button
              variant={selectedStatus === 'invited' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('invited')}
              size="sm"
            >
              Invited ({invites.filter(i => i.status === 'invited').length})
            </Button>
            <Button
              variant={selectedStatus === 'confirmed' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('confirmed')}
              size="sm"
            >
              Confirmed ({invites.filter(i => i.status === 'confirmed').length})
            </Button>
            <Button
              variant={selectedStatus === 'converted' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('converted')}
              size="sm"
            >
              Converted ({invites.filter(i => i.status === 'converted').length})
            </Button>
            <Button
              variant={selectedStatus === 'expired' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('expired')}
              size="sm"
            >
              Expired ({invites.filter(i => i.status === 'expired').length})
            </Button>
            <Button
              variant={selectedStatus === 'converted' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('converted')}
              size="sm"
            >
              Converted ({invites.filter(i => i.status === 'converted').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invites List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Email Invitations
          </CardTitle>
          <CardDescription>
            {getFilteredInvites().length} {selectedStatus === 'all' ? 'total' : selectedStatus} invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getFilteredInvites().length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {selectedStatus === 'all' ? '' : selectedStatus} invitations yet
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedStatus === 'all' 
                  ? 'Start sending email invitations to grow your network!' 
                  : `No invitations with status "${selectedStatus}" found.`}
              </p>
              {selectedStatus === 'all' && (
                <Button onClick={() => document.getElementById('email')?.focus()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Send Your First Invite
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredInvites().map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(invite.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{invite.email}</h4>
                        {getStatusBadge(invite.status)}
                      </div>
                                             {invite.name && (
                         <p className="text-sm text-gray-600 mb-1 line-clamp-2">Name: {invite.name}</p>
                       )}
                       {invite.phone_number && (
                         <p className="text-sm text-gray-600 mb-1 line-clamp-2">Phone: {invite.phone_number}</p>
                       )}
                       <div className="flex items-center space-x-4 text-xs text-gray-500">
                         <span className="flex items-center">
                           <Calendar className="w-3 h-3 mr-1" />
                           Invited {new Date(invite.invited_at).toLocaleDateString()}
                         </span>
                         {invite.confirmed_at && (
                           <span className="flex items-center">
                             <CheckCircle className="w-3 h-3 mr-1" />
                             Confirmed {new Date(invite.confirmed_at).toLocaleDateString()}
                           </span>
                         )}
                        {invite.converted_at && (
                          <span className="flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Converted {new Date(invite.converted_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center ${getStatusColor(invite.status)}`}>
                      {getStatusIcon(invite.status)}
                      <span className="ml-1 text-sm font-medium capitalize">
                        {invite.status}
                      </span>
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

export default EmailInvites;
