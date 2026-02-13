import { removeSessionState } from '../utils/useStorage';
import { sessionRoutes } from './ApiConstants';
import { apiCall } from './AxiosApi';

interface SessionCreateRequest {
  applicationVersion: string;
  source: string;
  code: string;
  state: string;
}

const performLogout = (): void => {
  removeSessionState();
  window.location.replace('/login');
};

/**
 * Validate the session and redirect to login if invalid
 * @returns void
 */
export async function validateSession(): Promise<void> {
  try {
    const response = await apiCall({
      url: sessionRoutes.check,
      method: 'get',
      callType: 'session',
    });

    if (!response?.data?.isValid) {
      performLogout();
    }
  } catch (error: any) {
    if (error?.response?.status === 401) {
      performLogout();
    }
    throw error;
  }
}

/**
 * Get the login URL
 * @param email - The email to get the login URL for
 * @returns The login URL response
 */
export async function validateEmailAndGetLoginUrl(email: string) {
  return apiCall({
    url: `${sessionRoutes.logindetails}/${encodeURIComponent(btoa(email))}`,
    method: 'get',
    callType: 'session',
  });
}

/**
 * Create a session
 * @param body - The session creation request body
 * @returns The session creation response
 */
export async function createSession(body: SessionCreateRequest) {
  return apiCall({
    url: sessionRoutes.createSession,
    method: 'post',
    data: body,
    callType: 'session',
  });
}

/**
 * Logout and redirect
 * @returns void
 */
export async function logoutAndRedirect(): Promise<void> {
  try {
    await apiCall({
      url: sessionRoutes.logout,
      method: 'get',
      callType: 'session',
    });
  } finally {
    performLogout();
  }
}
