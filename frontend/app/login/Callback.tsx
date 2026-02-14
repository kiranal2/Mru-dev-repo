import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '@/api/SessionApis';
import { useAuth } from '@/lib/auth-context';
import { removeSessionState } from '@/utils/use-storage';

function Callback() {
  const effectRan = useRef(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Utility to get query parameter from URL
  const getQueryParam = (param: string) => new URLSearchParams(window.location.search).get(param);

  // Handles user session creation and auth state update
  const getUserSession = async () => {
    try {
      removeSessionState();
      const code = getQueryParam('code');
      const state = getQueryParam('state');
      
      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      const requestBody = {
        applicationVersion: '1.0.0', // Replace with actual app version
        source: 'web',
        code,
        state,
      };

      const response = await createSession(requestBody);
      const responseData = response.data?.data;

      if (!responseData) throw new Error('No user data in response');

      // Create session token
      const sessionId = responseData.k || Math.random().toString(36).substring(2, 15);
      const tokenPayload = {
        userId: responseData.userId,
        email: responseData.email,
        sessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };
      
      const token = btoa(JSON.stringify(tokenPayload));

      // Prepare user data for auth context
      const userData = {
        id: responseData.userId,
        email: responseData.email,
        name: responseData.fullName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(responseData.fullName)}&background=6B7EF3&color=fff`
      };

      // Store auth data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('session_id', sessionId);

      // Auth context will automatically pick up the stored data on next render

      // Redirect to main app
      router.push('/');
    } catch (error: any) {
      console.error('Session creation error:', error);
      setError(error?.response?.data?.error?.message ?? 'Session creation failed');
    }
  };

  useEffect(() => {
    if (!effectRan.current) {
      getUserSession();
    }
    effectRan.current = true;
    // eslint-disable-next-line
  }, []);

  if (error) {
    return (
      <div className="m-auto flex min-h-screen w-9/12 items-center justify-center py-16">
        <div className="overflow-hidden pb-8">
          <div className="pt-8 text-center">
            <div className="text-red-600 font-medium mb-4">Session Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-[#0A3B77] text-white rounded hover:bg-[#0A3B77]/90"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="m-auto flex min-h-screen w-9/12 items-center justify-center py-16">
      <div className="overflow-hidden pb-8">
        <div className="pt-8 text-center">
          <div className="flex-inline flex px-12 pb-8 text-font-13 font-medium">
            <Loader2 className="h-4 w-4 text-gray-900/50 animate-spin" />
            <div className="ml-1 text-font-12">Generating session ...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Callback;
