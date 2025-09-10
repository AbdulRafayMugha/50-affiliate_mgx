import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

interface EmailVerificationProps {
  token?: string;
  email?: string;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ token, email }) => {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'expired'>('pending');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState(email || '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationStatus('success');
        setMessage(data.message);
        toast({
          title: "Email Verified!",
          description: "Your account has been successfully verified. Welcome to ReffalPlan!",
        });
      } else {
        if (data.error.includes('expired')) {
          setVerificationStatus('expired');
        } else {
          setVerificationStatus('error');
        }
        setMessage(data.error);
        toast({
          title: "Verification Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('Failed to verify email. Please try again.');
      toast({
        title: "Error",
        description: "Failed to verify email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!resendEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox and click the verification link.",
        });
        setMessage('Verification email sent successfully. Please check your inbox.');
      } else {
        toast({
          title: "Failed to Send Email",
          description: data.error,
          variant: "destructive",
        });
        setMessage(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
      setMessage('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-600 mb-2">Email Verified!</h2>
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

    if (verificationStatus === 'error' || verificationStatus === 'expired') {
      return (
        <div className="py-8">
          <div className="text-center mb-6">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              {verificationStatus === 'expired' ? 'Verification Expired' : 'Verification Failed'}
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="resend-email">Email Address</Label>
              <Input
                id="resend-email"
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={resendLoading}
              />
            </div>
            <Button 
              onClick={resendVerification}
              disabled={resendLoading}
              className="w-full"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    // Default state - no token provided
    return (
      <div className="py-8">
        <div className="text-center mb-6">
          <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
          <p className="text-gray-600 mb-6">
            Enter your email address to resend the verification link.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={resendLoading}
            />
          </div>
          <Button 
            onClick={resendVerification}
            disabled={resendLoading}
            className="w-full"
          >
            {resendLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Verification Email
              </>
            )}
          </Button>
        </div>
      </div>
    );
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
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              {verificationStatus === 'success' 
                ? 'Your email has been successfully verified'
                : 'Please verify your email address to complete your registration'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already verified?{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in to your account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
