import Toast from 'react-native-toast-message';

/**
 * Show a success toast notification
 */
export const showSuccessToast = (message: string, title?: string) => {
  Toast.show({
    type: 'success',
    text1: title || 'Success',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    topOffset: 60,
  });
};

/**
 * Show an error toast notification
 */
export const showErrorToast = (message: string, title?: string) => {
  Toast.show({
    type: 'error',
    text1: title || 'Error',
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    topOffset: 60,
  });
};

/**
 * Show an info toast notification
 */
export const showInfoToast = (message: string, title?: string) => {
  Toast.show({
    type: 'info',
    text1: title || 'Info',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    topOffset: 60,
  });
};

/**
 * Show a warning toast notification
 */
export const showWarningToast = (message: string, title?: string) => {
  Toast.show({
    type: 'error', // Use error style for warnings (yellow)
    text1: title || 'Warning',
    text2: message,
    position: 'top',
    visibilityTime: 3500,
    topOffset: 60,
  });
};
