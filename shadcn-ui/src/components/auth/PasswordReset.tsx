import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

interface PasswordResetProps {
  token?: string;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ token }) => {
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      setStep('reset');
    }
  }, [token]);

  const requestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Reset Link Sent",
          description: "If an account with that email exists, a password reset link has been sent.",
        });
        setMessage(data.message);
        setStep('success');
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        setMessage(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
      setMessage('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Password Required",
        description: "Please enter both password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password Reset Successfully",
          description: "Your password has been updated. You can now login with your new password.",
        });
        setMessage(data.message);
        setStep('success');
      } else {
        toast({
          title: "Reset Failed",
          description: data.error,
          variant: "destructive",
        });
        setMessage(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
      setMessage('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (step === 'request') {
      return (
        <form onSubmit={requestPasswordReset} className="space-y-4">
          <div className="text-center mb-6">
            <Lock className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={loading}
            />
          </div>

          <Button 
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Send Reset Link
              </>
            )}
          </Button>
        </form>
      );
    }

    if (step === 'reset') {
      return (
        <form onSubmit={resetPassword} className="space-y-4">
          <div className="text-center mb-6">
            <Lock className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-600">
              Enter your new password below.
            </p>
          </div>

          <div>
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={loading}
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Resetting...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Reset Password
              </>
            )}
          </Button>
        </form>
      );
    }

    if (step === 'success') {
      return (
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="w-full"
          >
            Continue to Login
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">ReffalPlan</h1>
          <p className="mt-2 text-sm text-gray-600">Affiliate Marketing Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Password Reset</CardTitle>
            <CardDescription>
              {step === 'request' && 'Enter your email to receive a reset link'}
              {step === 'reset' && 'Enter your new password'}
              {step === 'success' && 'Password reset completed successfully'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in to your account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
