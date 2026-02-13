"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Mail } from 'lucide-react';
import { validateEmailAndGetLoginUrl } from '../../api/SessionApis';
import { removeSessionState } from '../../utils/useStorage';
import { localStorageNames } from '../../conf/conf';

function LoginPage() {
  const effectRan = useRef(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isError, setIsError] = useState(false);

  // Clear session state on mount (only once)
  useEffect(() => {
    if (!effectRan.current) {
      removeSessionState();
      localStorage.removeItem(localStorageNames.userLoggedInLocalStorageName);
      localStorage.removeItem(localStorageNames.lastActivityTimeLocalStorageName);
      effectRan.current = true;
    }
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (isError) {
      setIsError(false);
      setError('');
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !email.includes('@')) {
      setIsError(true);
      setError('Please enter your valid email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await validateEmailAndGetLoginUrl(email);
      const loginUrl = response?.data?.data;
      if (typeof loginUrl === 'string' && loginUrl.includes('http')) {
        window.location.href = loginUrl;
      } else {
        setIsError(true);
        setError('Please enter a valid email');
      }
    } catch (error: any) {
      const errMsg = error?.response?.data?.error?.message ?? 'Please enter a valid email';
      setIsError(true);
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/meeru-logo.png"
            alt="Meeru AI Logo"
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Your personal AI Powered Accounting Analyst</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Security Notice */}
            <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-start">
                <Lock className="mr-2 mt-0.5 h-5 w-5 text-blue-500" />
                <p className="text-sm text-blue-700">
                  Sign in with your email to access the Meeru AI platform.
                </p>
              </div>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="corporate-email" className="text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="corporate-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`pl-10 ${isError ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign in with SSO
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 border-t border-gray-200 pt-6 text-center">
              <p className="text-xs text-gray-500">
                Meeru AI v1.0.0 | All rights reserved &copy; {new Date().getFullYear()}
                <br />
                <span className="text-xs text-gray-400">
                  Build Date: {new Date().toLocaleString()}
                </span>
              </p>
              <p className="mt-4 text-xs text-gray-500">Development</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default React.memo(LoginPage);
