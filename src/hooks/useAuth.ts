// lib/hooks/useAuth.ts
import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/lib/store/store';
import {
  checkAuthStatus,
  loginUserWithToken,
  logoutUser,
  registerUser,
  sendPhoneVerification,
  verifyPhone,
  clearAuthError,
  // Import specific types if needed, e.g., RegisterPayload, VerifyPhonePayload
  type RegisterPayload,
  type VerifyPhonePayload,
} from '@/lib/slices/authSlice';

/**
 * Custom hook for accessing authentication state and dispatching auth actions.
 * Provides a centralized and optimized way to interact with the auth system.
 */
export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Selectors for relevant auth state pieces
  const {
    isAuthenticated,
    user,
    loading: authLoading, // Renamed to avoid conflict if components use 'loading'
    error: authError,     // Renamed for clarity
    phoneVerificationId,
    phoneVerificationLoading,
    phoneVerificationError,
    registrationLoading,
    registrationError,
    loginLoading,
    loginError,
    logoutLoading,
    logoutError,
  } = useSelector((state: RootState) => state.auth); // Assuming 'auth' is the slice name in your root reducer

  // --- Action Dispatchers ---
  // Use useCallback to memoize dispatcher functions, preventing unnecessary re-renders
  // in components that consume this hook, especially if passed as props.

  const checkStatus = useCallback(() => {
    // Returns the promise for potential chaining or await in components
    return dispatch(checkAuthStatus());
  }, [dispatch]);

  const loginWithToken = useCallback((idToken: string) => {
    return dispatch(loginUserWithToken(idToken));
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const dispatchedActionPromise = dispatch(registerUser(payload));

    try {

      const result = await dispatchedActionPromise.unwrap();
      console.log("Registration thunk fulfilled successfully via unwrap.");
      return result; // Return the success payload if any
    } catch (rejectedValueOrError) {

      console.error("Registration thunk rejected:", rejectedValueOrError);
      throw rejectedValueOrError; // Re-throw the error/rejection payload
    }
  }, [dispatch]);

  // --- Updated sendVerificationCode ---
  const sendVerificationCode = useCallback(async (phoneNumber: string): Promise<string | null> => {
    // Ensure the reCAPTCHA container exists before dispatching
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (!recaptchaContainer) {
      console.error("reCAPTCHA container 'recaptcha-container' not found in the DOM.");
      // Return a rejected promise matching the expected types
      return Promise.reject(new Error("reCAPTCHA container not found"));
    }

    try {
      const resultAction = await dispatch(sendPhoneVerification(phoneNumber));
      const verificationIdResult = await resultAction.payload; // Access the payload which holds the ID on success
      const dispatchedActionPromise = dispatch(sendPhoneVerification(phoneNumber));
      const verificationIdResultUnwrapped = await dispatchedActionPromise.unwrap();

      return verificationIdResultUnwrapped;
    } catch (error: any) {
     
      console.error("sendVerificationCode hook caught error:", error);

      return null;
    }
  }, [dispatch]);


  // --- Updated verifyCode ---
  // This function now directly expects the payload required by the verifyPhone thunk
  const verifyCode = useCallback((payload: VerifyPhonePayload) => {

    if (!payload.verificationId) {
         console.error("Cannot verify code: verificationId is missing in payload.");
         return Promise.reject(new Error("Verification ID is missing in payload"));
    }
    return dispatch(verifyPhone(payload));
    // Consider unwrapping if the component needs direct success/failure feedback beyond state updates
    // Example: return dispatch(verifyPhone(payload)).unwrap();
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // --- Returned Values ---
  // Return state variables and action dispatchers
  return {
    // State
    isAuthenticated,
    user,
    authLoading, // General loading (checkAuthStatus)
    authError,   // General error (checkAuthStatus)
    phoneVerificationId, // ID needed for verifyCode step
    phoneVerificationLoading,
    phoneVerificationError,
    registrationLoading,
    registrationError,
    loginLoading,
    loginError,
    logoutLoading,
    logoutError,

    // Actions
    checkStatus,
    loginWithToken,
    logout,
    register,
    sendVerificationCode,
    verifyCode,
    clearError, // Expose the error clearing action
  };
};

export default useAuth;