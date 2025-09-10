import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { 
  User, 
  Users, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Trophy,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  History,
  Trash2,
  Power,
  PowerOff,
  Shield,
  Ban,
  Mail
} from 'lucide-react';
import { Affiliate, BankDetails, Commission, EmailReferral } from '../../types';
import { adminAPI } from '../../services/api';

interface AffiliateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliateId: string;
  onAffiliateUpdated?: () => void;
}

const AffiliateDetailsModal: React.FC<AffiliateDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  affiliateId,
  onAffiliateUpdated
}) => {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [emailReferrals, setEmailReferrals] = useState<EmailReferral[]>([]);
  const [emailStats, setEmailStats] = useState<{
    total: number;
    invited: number;
    confirmed: number;
    converted: number;
    expired: number;
    totalConversionValue: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedBankDetail, setSelectedBankDetail] = useState<string>('');

  useEffect(() => {
    if (isOpen && affiliateId) {
      loadAffiliateDetails();
    }
  }, [isOpen, affiliateId]);

  const loadAffiliateDetails = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      console.log('Loading affiliate details for ID:', affiliateId);
      
      // Load basic affiliate info first
      const affiliateRes = await adminAPI.getAffiliateDetails(affiliateId);
      console.log('Affiliate response:', affiliateRes.data);
      
      // Transform the affiliate data to match our interface
      const affiliateData = affiliateRes.data.affiliate;
      
      if (!affiliateData) {
        throw new Error('Affiliate data not found in response');
      }
      
      const transformedAffiliate: Affiliate = {
        id: affiliateData.id,
        userId: affiliateData.id,
        referralCode: affiliateData.referral_code,
        level: 1, // Default level for affiliates
        tier: { 
          id: '1',
          name: affiliateData.tier || 'Bronze',
          minReferrals: 0,
          minRevenue: 0,
          commissionBoost: 0,
          bonusAmount: 0,
          benefits: []
        },
        totalEarnings: affiliateRes.data.stats?.paid || 0,
        pendingEarnings: affiliateRes.data.stats?.pending || 0,
        totalReferrals: affiliateRes.data.referralTree?.totals?.total || 0,
        activeReferrals: affiliateRes.data.referralTree?.totals?.total || 0,
        conversionRate: 0,
        createdAt: affiliateData.created_at,
        user: {
          id: affiliateData.id,
          name: affiliateData.name,
          email: affiliateData.email,
          role: 'affiliate',
          status: affiliateData.is_active === true ? 'active' : 'inactive',
          createdAt: affiliateData.created_at
        },
        directReferrals: affiliateRes.data.referralTree?.totals?.level1 || 0,
        level2Referrals: affiliateRes.data.referralTree?.totals?.level2 || 0,
        level3Referrals: affiliateRes.data.referralTree?.totals?.level3 || 0
      };
      
      console.log('Transformed affiliate:', transformedAffiliate);
      setAffiliate(transformedAffiliate);
      setCommissions(affiliateRes.data.recentCommissions || []);
      
      // Load bank details and email referrals separately
      try {
        const [bankRes, emailReferralsRes, emailStatsRes] = await Promise.all([
          adminAPI.getAffiliateBankDetails(affiliateId).catch(() => ({ data: [] })),
          adminAPI.getAffiliateEmailReferrals(affiliateId).catch(() => ({ data: [] })),
          adminAPI.getAffiliateEmailStats(affiliateId).catch(() => ({ data: null }))
        ]);
        
        setBankDetails(bankRes.data || []);
        setEmailReferrals(emailReferralsRes.data || []);
        setEmailStats(emailStatsRes.data);
        
        // Set default bank detail for payments
        if (bankRes.data && bankRes.data.length > 0) {
          setSelectedBankDetail(bankRes.data[0].id);
        }
      } catch (error) {
        console.error('Error loading additional data:', error);
        setBankDetails([]);
        setEmailReferrals([]);
        setEmailStats(null);
      }
    } catch (error: any) {
      console.error('Error loading affiliate details:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to load affiliate details' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentAmount || !selectedBankDetail) {
      setMessage({ type: 'error', text: 'Please enter payment amount and select a payment method' });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid payment amount' });
      return;
    }

    try {
      await adminAPI.processAffiliatePayment(affiliateId, amount, selectedBankDetail);
      setMessage({ type: 'success', text: `Payment of $${amount} processed successfully!` });
      setPaymentAmount('');
      await loadAffiliateDetails(); // Refresh data
      onAffiliateUpdated?.();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to process payment' 
      });
    }
  };

  const handleStatusToggle = async () => {
    if (!affiliate) return;
    
    const newStatus = affiliate.user?.status !== 'active';
    
    try {
      await adminAPI.updateAffiliateStatus(affiliateId, newStatus);
      setMessage({ 
        type: 'success', 
        text: `Affiliate ${newStatus ? 'activated' : 'deactivated'} successfully!` 
      });
      await loadAffiliateDetails(); // Refresh data
      onAffiliateUpdated?.();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update status' 
      });
    }
  };

  const handleDeleteAffiliate = async () => {
    try {
      await adminAPI.deleteAffiliate(affiliateId);
      setMessage({ type: 'success', text: 'Affiliate deleted successfully!' });
      setShowDeleteDialog(false);
      onClose();
      onAffiliateUpdated?.();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete affiliate' 
      });
    }
  };

  const getReferralTree = () => {
    if (!affiliate) return null;

    return {
      level1: affiliate.directReferrals || 0,
      level2: affiliate.level2Referrals || 0,
      level3: affiliate.level3Referrals || 0,
      total: (affiliate.directReferrals || 0) + (affiliate.level2Referrals || 0) + (affiliate.level3Referrals || 0)
    };
  };

  const getPaymentMethodDisplay = (bank: BankDetails) => {
    switch (bank.payment_method) {
      case 'bank_transfer':
        return `${bank.bank_name} • ${showSensitiveInfo ? bank.account_number : '****' + bank.account_number?.slice(-4)}`;
      case 'paypal':
        return `PayPal • ${showSensitiveInfo ? bank.paypal_email : '****' + bank.paypal_email?.slice(-4)}`;
      case 'stripe':
        return `Stripe • ${showSensitiveInfo ? bank.stripe_account_id : '****' + bank.stripe_account_id?.slice(-4)}`;
      case 'crypto':
        return `${bank.crypto_currency} • ${showSensitiveInfo ? bank.crypto_wallet_address : '****' + bank.crypto_wallet_address?.slice(-4)}`;
      case 'check':
        return `Check • ${bank.check_payable_to}`;
      default:
        return 'Unknown method';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Affiliate Details...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!affiliate && !loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>Affiliate not found</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">The requested affiliate could not be found.</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const referralTree = getReferralTree();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Affiliate Details: {affiliate.user?.name}
            </DialogTitle>
            <DialogDescription>
              Comprehensive view of affiliate performance, referrals, and payment information
            </DialogDescription>
          </DialogHeader>

          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant={affiliate.user?.status === 'active' ? 'default' : 'secondary'}>
                {affiliate.user?.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {affiliate.tier?.name || 'Bronze'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStatusToggle}
                className="flex items-center gap-2"
              >
                {affiliate.user?.status === 'active' ? (
                  <>
                    <PowerOff className="w-4 h-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    Activate
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Affiliate
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="email-referrals">Email Referrals</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{affiliate.user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{affiliate.user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Referral Code:</span>
                      <span className="font-medium">{affiliate.referralCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tier:</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {affiliate.tier?.name || 'Bronze'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Joined:</span>
                      <span className="font-medium">
                        {new Date(affiliate.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Performance Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Earnings:</span>
                      <span className="font-bold text-green-600">${(affiliate.totalEarnings || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending Earnings:</span>
                      <span className="font-bold text-yellow-600">${(affiliate.pendingEarnings || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Referrals:</span>
                      <span className="font-bold">{affiliate.totalReferrals || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversion Rate:</span>
                      <span className="font-bold">{affiliate.conversionRate || 0}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="referrals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Referral Network
                  </CardTitle>
                  <CardDescription>3-level affiliate structure</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{referralTree?.level1 || 0}</p>
                      <p className="text-sm text-gray-600">Level 1 (Direct)</p>
                      <p className="text-xs text-blue-600">15% commission</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{referralTree?.level2 || 0}</p>
                      <p className="text-sm text-gray-600">Level 2</p>
                      <p className="text-xs text-green-600">5% commission</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{referralTree?.level3 || 0}</p>
                      <p className="text-sm text-gray-600">Level 3</p>
                      <p className="text-xs text-purple-600">2.5% commission</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-lg font-semibold">Total Network: {referralTree?.total || 0} affiliates</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Methods & Processing
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                    >
                      {showSensitiveInfo ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Show Details
                        </>
                      )}
                    </Button>
                  </CardTitle>
                  <CardDescription>Manage payment methods and process payouts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bankDetails.map((bank) => (
                      <div key={bank.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">{bank.account_name}</p>
                            <p className="text-sm text-gray-500">
                              {getPaymentMethodDisplay(bank)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {bank.is_default && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                            <Badge variant={bank.is_verified ? 'default' : 'outline'}>
                              {bank.is_verified ? 'Verified' : 'Unverified'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {bankDetails.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No payment methods configured</p>
                        <p className="text-sm">Affiliate needs to add payment methods to receive payouts</p>
                      </div>
                    )}

                    {/* Payment Processing */}
                    {affiliate.pendingEarnings > 0 && bankDetails.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold mb-3">Process Payment</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="payment-amount">Payment Amount</Label>
                            <Input
                              id="payment-amount"
                              type="number"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder={`Max: $${affiliate.pendingEarnings}`}
                              max={affiliate.pendingEarnings}
                            />
                          </div>
                          <div>
                            <Label htmlFor="payment-method">Payment Method</Label>
                            <select
                              id="payment-method"
                              value={selectedBankDetail}
                              onChange={(e) => setSelectedBankDetail(e.target.value)}
                              className="w-full p-2 border rounded-md"
                            >
                              {bankDetails.map((bank) => (
                                <option key={bank.id} value={bank.id}>
                                  {bank.account_name} - {bank.payment_method}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end">
                            <Button
                              onClick={handleProcessPayment}
                              className="w-full"
                              disabled={!paymentAmount || !selectedBankDetail}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Process Payment
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Commission History
                  </CardTitle>
                  <CardDescription>Recent commission transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                                         {commissions.slice(0, 10).map((commission) => {
                       const amount = typeof commission.amount === 'number' ? commission.amount : parseFloat(commission.amount) || 0;
                       const createdAt = commission.createdAt ? new Date(commission.createdAt).toLocaleDateString() : 'Unknown';
                       
                       return (
                         <div key={commission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <div className="flex items-center space-x-3">
                             <Badge variant={commission.status === 'paid' ? 'default' : commission.status === 'pending' ? 'secondary' : 'outline'}>
                               Level {commission.level || 1}
                             </Badge>
                             <div>
                               <p className="font-medium">${amount.toFixed(2)}</p>
                               <p className="text-sm text-gray-500">
                                 {createdAt}
                               </p>
                             </div>
                           </div>
                           <div className="flex items-center">
                             <Badge variant={
                               commission.status === 'paid' ? 'default' : 
                               commission.status === 'pending' ? 'secondary' : 
                               'outline'
                             }>
                               {commission.status || 'unknown'}
                             </Badge>
                           </div>
                         </div>
                       );
                     })}
                    
                    {commissions.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No commission history available</p>
                    )}
                    
                    {commissions.length > 10 && (
                      <div className="text-center mt-4">
                        <Button variant="outline">View All Commissions ({commissions.length})</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
                         </TabsContent>

             <TabsContent value="email-referrals" className="space-y-4">
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Mail className="w-5 h-5" />
                     Email Referrals
                   </CardTitle>
                   <CardDescription>Email referrals and their conversion status</CardDescription>
                 </CardHeader>
                 <CardContent>
                   {/* Email Stats */}

                   {/* Email Referrals List */}
                   <div className="space-y-3">
                     {emailReferrals.map((emailRef) => {
                       const invitedDate = emailRef.invited_at ? new Date(emailRef.invited_at).toLocaleDateString() : 'Unknown';
                       const confirmedDate = emailRef.confirmed_at ? new Date(emailRef.confirmed_at).toLocaleDateString() : null;
                       const convertedDate = emailRef.converted_at ? new Date(emailRef.converted_at).toLocaleDateString() : null;
                       const expiresDate = emailRef.expires_at ? new Date(emailRef.expires_at).toLocaleDateString() : 'Unknown';
                       
                       return (
                         <div key={emailRef.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                               <Mail className="w-5 h-5 text-blue-600" />
                             </div>
                             <div>
                               <p className="font-medium text-gray-900">{emailRef.email}</p>
                               {emailRef.name && (
                                 <p className="text-sm text-gray-500">Name: {emailRef.name}</p>
                               )}
                               {emailRef.phone_number && (
                                 <p className="text-sm text-gray-500">Phone: {emailRef.phone_number}</p>
                               )}
                               <p className="text-xs text-gray-400">
                                 Invited: {invitedDate} • Expires: {expiresDate}
                               </p>
                             </div>
                           </div>
                           <div className="flex items-center space-x-2">
                             <Badge variant={
                               emailRef.status === 'converted' ? 'default' : 
                               emailRef.status === 'confirmed' ? 'secondary' : 
                               emailRef.status === 'invited' ? 'outline' : 
                               'destructive'
                             }>
                               {emailRef.status}
                             </Badge>
                             {emailRef.conversion_value && (
                               <Badge variant="outline" className="text-green-600">
                                 ${emailRef.conversion_value.toFixed(2)}
                               </Badge>
                             )}
                           </div>
                         </div>
                       );
                     })}
                     
                     {emailReferrals.length === 0 && (
                       <div className="text-center py-8 text-gray-500">
                         <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                         <p>No email referrals found</p>
                         <p className="text-sm">This affiliate hasn't added any email referrals yet</p>
                       </div>
                     )}
                     
                     {emailReferrals.length > 10 && (
                       <div className="text-center mt-4">
                         <Button variant="outline">View All Email Referrals ({emailReferrals.length})</Button>
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
             </TabsContent>
           </Tabs>
         </DialogContent>
       </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Delete Affiliate
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{affiliate.user?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAffiliate}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Affiliate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AffiliateDetailsModal;

