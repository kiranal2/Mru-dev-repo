import { localStorageNames } from '@/conf/conf';

/**
 * Remove all session-related data from localStorage
 */
export const removeSessionState = (): void => {
  localStorage.removeItem(localStorageNames.userLoggedInLocalStorageName);
  localStorage.removeItem(localStorageNames.lastActivityTimeLocalStorageName);
  localStorage.removeItem(localStorageNames.sessionTokenName);
  localStorage.removeItem(localStorageNames.userDataName);
};
