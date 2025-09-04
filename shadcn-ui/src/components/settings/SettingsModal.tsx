import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { 
  User, 
  Lock, 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import { BankDetails } from '../../types';
import api from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile settings
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  // Password settings
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Bank details
  const [bankDetails, setBankDetails] = useState<BankDetails[]>([]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [editingBank, setEditingBank] = useState<BankDetails | null>(null);
  const [bankForm, setBankForm] = useState({
    payment_method: 'bank_transfer' as const,
    account_name: '',
    account_number: '',
    routing_number: '',
    bank_name: '',
    paypal_email: '',
    stripe_account_id: '',
    crypto_wallet_address: '',
    crypto_currency: '',
    check_payable_to: '',
    is_default: false
  });

  useEffect(() => {
    if (isOpen && user) {
      loadBankDetails();
      setProfileForm({
        name: user.name,
        email: user.email
      });
    }
  }, [isOpen, user]);

  const loadBankDetails = async () => {
    try {
      const response = await api.get('/auth/bank-details');
      setBankDetails(response.data);
    } catch (error) {
      console.error('Error loading bank details:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.put('/auth/profile', profileForm);
      updateUser(response.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBankDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (editingBank) {
        await api.put(`/auth/bank-details/${editingBank.id}`, bankForm);
        setMessage({ type: 'success', text: 'Bank details updated successfully!' });
      } else {
        await api.post('/auth/bank-details', bankForm);
        setMessage({ type: 'success', text: 'Bank details added successfully!' });
      }
      
      await loadBankDetails();
      setShowAddBank(false);
      setEditingBank(null);
      setBankForm({
        payment_method: 'bank_transfer',
        account_name: '',
        account_number: '',
        routing_number: '',
        bank_name: '',
        paypal_email: '',
        stripe_account_id: '',
        crypto_wallet_address: '',
        crypto_currency: '',
        check_payable_to: '',
        is_default: false
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save bank details' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      await api.delete(`/auth/bank-details/${id}`);
      await loadBankDetails();
      setMessage({ type: 'success', text: 'Payment method deleted successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete payment method' 
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/auth/bank-details/${id}/default`);
      await loadBankDetails();
      setMessage({ type: 'success', text: 'Default payment method updated!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update default payment method' 
      });
    }
  };

  const getPaymentMethodFields = () => {
    switch (bankForm.payment_method) {
      case 'bank_transfer':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={bankForm.account_number}
                  onChange={(e) => setBankForm(prev => ({ ...prev, account_number: e.target.value }))}
                  placeholder="1234567890"
                />
              </div>
              <div>
                <Label htmlFor="routing_number">Routing Number</Label>
                <Input
                  id="routing_number"
                  value={bankForm.routing_number}
                  onChange={(e) => setBankForm(prev => ({ ...prev, routing_number: e.target.value }))}
                  placeholder="021000021"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={bankForm.bank_name}
                onChange={(e) => setBankForm(prev => ({ ...prev, bank_name: e.target.value }))}
                placeholder="Chase Bank"
              />
            </div>
          </>
        );
      case 'paypal':
        return (
          <div>
            <Label htmlFor="paypal_email">PayPal Email</Label>
            <Input
              id="paypal_email"
              type="email"
              value={bankForm.paypal_email}
              onChange={(e) => setBankForm(prev => ({ ...prev, paypal_email: e.target.value }))}
              placeholder="your-email@paypal.com"
            />
          </div>
        );
      case 'stripe':
        return (
          <div>
            <Label htmlFor="stripe_account_id">Stripe Account ID</Label>
            <Input
              id="stripe_account_id"
              value={bankForm.stripe_account_id}
              onChange={(e) => setBankForm(prev => ({ ...prev, stripe_account_id: e.target.value }))}
              placeholder="acct_1234567890"
            />
          </div>
        );
      case 'crypto':
        return (
          <>
            <div>
              <Label htmlFor="crypto_wallet_address">Wallet Address</Label>
              <Input
                id="crypto_wallet_address"
                value={bankForm.crypto_wallet_address}
                onChange={(e) => setBankForm(prev => ({ ...prev, crypto_wallet_address: e.target.value }))}
                placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
              />
            </div>
            <div>
              <Label htmlFor="crypto_currency">Cryptocurrency</Label>
              <Select
                value={bankForm.crypto_currency}
                onValueChange={(value) => setBankForm(prev => ({ ...prev, crypto_currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cryptocurrency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                  <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'check':
        return (
          <div>
            <Label htmlFor="check_payable_to">Payable To</Label>
            <Input
              id="check_payable_to"
              value={bankForm.check_payable_to}
              onChange={(e) => setBankForm(prev => ({ ...prev, check_payable_to: e.target.value }))}
              placeholder="John Smith"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Settings
          </DialogTitle>
          <DialogDescription>
            Manage your profile, security, and payment information
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Payment Methods
                  <Button
                    onClick={() => {
                      setShowAddBank(true);
                      setEditingBank(null);
                      setBankForm({
                        payment_method: 'bank_transfer',
                        account_name: '',
                        account_number: '',
                        routing_number: '',
                        bank_name: '',
                        paypal_email: '',
                        stripe_account_id: '',
                        crypto_wallet_address: '',
                        crypto_currency: '',
                        check_payable_to: '',
                        is_default: false
                      });
                    }}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </CardTitle>
                <CardDescription>Manage your payment methods for commission payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bankDetails.map((bank) => (
                    <div key={bank.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{bank.account_name}</p>
                          <p className="text-sm text-gray-500">
                            {bank.payment_method === 'bank_transfer' && `${bank.bank_name} • ${bank.account_number}`}
                            {bank.payment_method === 'paypal' && bank.paypal_email}
                            {bank.payment_method === 'stripe' && bank.stripe_account_id}
                            {bank.payment_method === 'crypto' && `${bank.crypto_currency} • ${bank.crypto_wallet_address?.slice(0, 10)}...`}
                            {bank.payment_method === 'check' && bank.check_payable_to}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {bank.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                        {!bank.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(bank.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingBank(bank);
                            setBankForm({
                              payment_method: bank.payment_method,
                              account_name: bank.account_name,
                              account_number: bank.account_number || '',
                              routing_number: bank.routing_number || '',
                              bank_name: bank.bank_name || '',
                              paypal_email: bank.paypal_email || '',
                              stripe_account_id: bank.stripe_account_id || '',
                              crypto_wallet_address: bank.crypto_wallet_address || '',
                              crypto_currency: bank.crypto_currency || '',
                              check_payable_to: bank.check_payable_to || '',
                              is_default: bank.is_default
                            });
                            setShowAddBank(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBank(bank.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {bankDetails.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No payment methods added yet</p>
                      <p className="text-sm">Add a payment method to receive your commission payouts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Add/Edit Bank Details Modal */}
            {showAddBank && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      {editingBank ? 'Edit Payment Method' : 'Add Payment Method'}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddBank(false);
                        setEditingBank(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <form onSubmit={handleBankDetailsSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="payment_method">Payment Method</Label>
                      <Select
                        value={bankForm.payment_method}
                        onValueChange={(value: any) => setBankForm(prev => ({ ...prev, payment_method: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                          <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        value={bankForm.account_name}
                        onChange={(e) => setBankForm(prev => ({ ...prev, account_name: e.target.value }))}
                        placeholder="John Smith"
                        required
                      />
                    </div>
                    
                    {getPaymentMethodFields()}
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={bankForm.is_default}
                        onChange={(e) => setBankForm(prev => ({ ...prev, is_default: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="is_default">Set as default payment method</Label>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? 'Saving...' : (editingBank ? 'Update' : 'Add')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddBank(false);
                          setEditingBank(null);
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
