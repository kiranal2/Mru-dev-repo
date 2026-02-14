import { toast } from 'sonner';

/**
 * Show error toast message
 * @param message - Error message to display
 */
export const errorToast = (message: string): void => {
  toast.error(message);
};

/**
 * Show success toast message
 * @param message - Success message to display
 */
export const successToast = (message: string): void => {
  toast.success(message);
};

/**
 * Show info toast message
 * @param message - Info message to display
 */
export const infoToast = (message: string): void => {
  toast.info(message);
};
