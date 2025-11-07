import toast from 'react-hot-toast';

/**
 * Toast Notification Utility
 * 
 * Provides consistent, user-friendly notifications throughout the app.
 * Replaces browser alert() for better UX and stability.
 */

const DEFAULT_DURATION = 4000; // 4 seconds
const ERROR_DURATION = 6000; // 6 seconds for errors
const SUCCESS_DURATION = 3000; // 3 seconds for success

/**
 * Show success notification
 */
export const showSuccess = (message: string, duration = SUCCESS_DURATION) => {
  return toast.success(message, {
    duration,
    position: 'top-center',
    style: {
      background: '#065f46', // green-800
      color: '#ffffff',
      border: '1px solid #10b981', // green-500
      borderRadius: '0.5rem',
      fontSize: '14px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#ffffff',
    },
  });
};

/**
 * Show error notification
 */
export const showError = (message: string, duration = ERROR_DURATION) => {
  return toast.error(message, {
    duration,
    position: 'top-center',
    style: {
      background: '#7f1d1d', // red-900
      color: '#ffffff',
      border: '1px solid #ef4444', // red-500
      borderRadius: '0.5rem',
      fontSize: '14px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#ffffff',
    },
  });
};

/**
 * Show info notification
 */
export const showInfo = (message: string, duration = DEFAULT_DURATION) => {
  return toast(message, {
    duration,
    position: 'top-center',
    icon: 'ℹ️',
    style: {
      background: '#1e3a8a', // blue-900
      color: '#ffffff',
      border: '1px solid #3b82f6', // blue-500
      borderRadius: '0.5rem',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

/**
 * Show warning notification
 */
export const showWarning = (message: string, duration = DEFAULT_DURATION) => {
  return toast(message, {
    duration,
    position: 'top-center',
    icon: '⚠️',
    style: {
      background: '#78350f', // yellow-900
      color: '#ffffff',
      border: '1px solid #f59e0b', // yellow-500
      borderRadius: '0.5rem',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

/**
 * Show loading notification (returns toast ID for dismissal)
 */
export const showLoading = (message: string) => {
  return toast.loading(message, {
    position: 'top-center',
    style: {
      background: '#1f2937', // gray-800
      color: '#ffffff',
      border: '1px solid #4b5563', // gray-600
      borderRadius: '0.5rem',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

/**
 * Dismiss a specific toast by ID
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Show async operation with promise
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      position: 'top-center',
      style: {
        background: '#1f2937',
        color: '#ffffff',
        border: '1px solid #4b5563',
        borderRadius: '0.5rem',
        fontSize: '14px',
        fontWeight: '500',
      },
      success: {
        duration: SUCCESS_DURATION,
        style: {
          background: '#065f46',
          border: '1px solid #10b981',
        },
      },
      error: {
        duration: ERROR_DURATION,
        style: {
          background: '#7f1d1d',
          border: '1px solid #ef4444',
        },
      },
    }
  );
};

/**
 * Show custom confirmation (replaces window.confirm for better UX)
 * Note: For now, falls back to window.confirm. 
 * TODO: Implement custom confirmation modal component
 */
export const showConfirm = async (message: string): Promise<boolean> => {
  // Temporary: Use browser confirm for stability
  // Will be replaced with custom modal in next iteration
  return window.confirm(message);
};
