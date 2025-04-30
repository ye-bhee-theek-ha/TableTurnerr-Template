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
  type RegisterPayload,
  type VerifyPhonePayload,
} from '@/lib/slices/authSlice';


export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    isAuthenticated,
    user,
    loading: authLoading,
    error: authError,  
    phoneVerificationId,
    phoneVerificationLoading,
    phoneVerificationError,
    registrationLoading,
    registrationError,
    loginLoading,
    loginError,
    logoutLoading,
    logoutError,
  } = useSelector((state: RootState) => state.auth);

  // --- Action Dispatchers ---

  const checkStatus = useCallback(() => {
    return dispatch(checkAuthStatus());
  }, [dispatch]);

  const loginWithToken = useCallback((idToken: string) => {
    return dispatch(loginUserWithToken(idToken)).unwrap();
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
  const verifyCode = useCallback(async (payload: VerifyPhonePayload) => {
    if (!payload.verificationId) {
         console.error("Cannot verify code: verificationId is missing in payload.");
         throw new Error("Verification ID is missing in payload");
    }

    const dispatchedActionPromise = dispatch(verifyPhone(payload));

    try {
        await dispatchedActionPromise.unwrap();
        console.log("Verification thunk fulfilled successfully via unwrap.");
    } catch (rejectedValueOrError) {
        console.error("Verification thunk rejected:", rejectedValueOrError);
        throw rejectedValueOrError; // Re-throw the error/rejection payload
    }
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