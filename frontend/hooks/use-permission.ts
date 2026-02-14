import { useState, useEffect } from 'react';

/**
 * Hook to check user permissions
 */
export const usePermission = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Start as logged in
  const [user, setUser] = useState<any>({ id: '1', email: 'demo@meeru.ai', name: 'Demo User' }); // Start with mock user

  useEffect(() => {
    // Check if user is logged in from localStorage
    // const userLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userLoggedIn = true;
    const userData = localStorage.getItem('userData');
    
    setIsLoggedIn(userLoggedIn);
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      // Set a mock user if no user data exists
      setUser({ id: '1', email: 'demo@meeru.ai', name: 'Demo User' });
    }
  }, []);

  /**
   * Check if user has specific permission
   * @param permission - Permission to check
   * @param subPermission - Sub permission to check (optional)
   * @returns boolean indicating if user has permission
   */
  const hasPermission = (permission?: string, subPermission?: string): boolean => {
    if (!isLoggedIn || !user) return false;
    
    // For demo purposes, return true for all permissions
    // In real implementation, check against user.permissions array
    return true;
  };

  return {
    hasPermission,
    isLoggedIn,
    user,
  };
};
