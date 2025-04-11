// lib/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../apiClient';
import { auth } from '../firebase/ClientApp'; 
import {
  signOut,
  PhoneAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import { sendVerificationCode, clearRecaptchaVerifier } from '../firebase/services/auth'; // Assuming these are correctly defined client-side functions
import { AuthState, User } from '@/constants/types';


const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: 'idle', // General loading for checkAuthStatus
  error: null,     // General error for checkAuthStatus
  phoneVerificationId: null,
  phoneVerificationLoading: 'idle',
  phoneVerificationError: null,
  registrationLoading: 'idle',
  registrationError: null,
  loginLoading: 'idle',
  loginError: null,
  logoutLoading: 'idle',
  logoutError: null,
};

// --- Async Thunks ---

// Check Auth Status (uses /api/auth/me)
export const checkAuthStatus = createAsyncThunk<User>(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      console.log("checking auth status...");
      const response = await apiClient.get('/auth/me');
      // Ensure phoneVerified is handled, default to false if missing
      const userData = response.data as User;
      return { ...userData, phoneVerified: userData.phoneVerified ?? false };
    } catch (error: any) {
      const message = error?.message || 'Failed to check auth status';
      // Don't treat 401 as a "failure" to show an error message, just means not logged in
      if (error?.status === 401) {
         console.log('No active session found.');
         // Return a specific value or structure identifiable in the reducer
         return rejectWithValue({ silent: true }); // Indicate silent failure
      }
      // For other errors, reject with the message
      return rejectWithValue({ message });
    }
  }
);

// Login With Firebase ID Token (uses /api/auth/login)
export const loginUserWithToken = createAsyncThunk<User, string>(
  'auth/loginUserWithToken',
  async (idToken, { dispatch, rejectWithValue }) => {
    try {
      // 1. Send ID token to backend to create session cookie
      await apiClient.post('/auth/login', { idToken });
      // 2. Fetch user data using the new session
      const userData = await dispatch(checkAuthStatus()).unwrap(); // unwrap handles rejection
      return userData;
    } catch (error: any) {
      // Handle errors from both login and checkAuthStatus
      const message = error?.message || 'Login failed';
      return rejectWithValue({ message });
    }
  }
);

// Logout User (uses /api/auth/logout)
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // 1. Tell backend to clear session cookie
      await apiClient.post('/auth/logout');
      // 2. Sign out from Firebase client-side
      await signOut(auth);
      // 3. Clear any lingering reCAPTCHA
      clearRecaptchaVerifier(); // Ensure this function exists and works
      // No return value needed on success
    } catch (error: any) {
      // Try to sign out client-side even if backend fails
      await signOut(auth).catch(err => console.error("Client signout failed during logout error:", err));
      clearRecaptchaVerifier();
      const message = error?.message || 'Logout failed';
      return rejectWithValue({ message });
    }
  }
);

// Register User via Backend API (uses /api/auth/register)
export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  phoneNumber: string; // Make sure phone number is included
}

interface RegisterSuccessPayload { uid: string; customToken: string; message?: string; }


export const registerUser = createAsyncThunk<RegisterSuccessPayload, RegisterPayload>(
  'auth/registerUserApi',
  async (registerData, { rejectWithValue }) => {
    try {
      // Call the backend registration endpoint
      // Assumes backend handles Firebase user creation AND Firestore profile creation
      const response = await apiClient.post('/auth/register', registerData);
      
      if (!response.data.customToken || !response.data.uid) {
        throw new Error('Registration response missing custom token or UID.');
      }

      return response.data as RegisterSuccessPayload;

    } catch (error: any) {
      const message = error?.message || 'Registration failed';
      // Include potential error code from backend (e.g., 'auth/email-already-in-use')
      return rejectWithValue({ message, code: error?.code });
    }
  }
);


// Send Phone Verification Code (Client-side Firebase)
export const sendPhoneVerification = createAsyncThunk<string, string>(
  'auth/sendPhoneVerificationClient',
  async (phoneNumber, { rejectWithValue }) => {
    try {
      // Uses the imported client-side service function `sendVerificationCode`
      // This function should handle RecaptchaVerifier setup internally
      const confirmationResult = await sendVerificationCode(phoneNumber); // From services/auth.ts
      return confirmationResult.verificationId; // Return only the ID
    } catch (error: any) {
      const message = error.message || 'Failed to send verification code';
      console.error("Error sending verification code:", error);
      // Ensure reCAPTCHA is cleared on error if the service function doesn't do it
      clearRecaptchaVerifier(); // From services/auth.ts
      return rejectWithValue({ message });
    }
  }
);

// Verify Phone Code and Link to User (Client-side Firebase + Backend Update)
export interface VerifyPhonePayload {
  verificationId: string;
  verificationCode: string;
}
export const verifyPhone = createAsyncThunk<void, VerifyPhonePayload>(
  'auth/verifyPhoneClientAndBackend',
  async ({ verificationId, verificationCode }, { dispatch, rejectWithValue }) => {
    console.log("Verifying phone with ID:", verificationId, "and code:", verificationCode);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return rejectWithValue({ message: 'User must be logged in client-side to verify phone.' });
    }

    let idToken: string | null = null;


    try {
      // 1. Create PhoneAuthCredential using the ID and code
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      try {
        idToken = await currentUser.getIdToken(true); // Force refresh
        if (!idToken) throw new Error("Failed to retrieve ID token."); // Should not happen if currentUser exists
      } catch(tokenError: any) {
          console.error("Failed to get ID token:", tokenError);
          clearRecaptchaVerifier(); // Clean up recaptcha
          return rejectWithValue({ message: `Failed to get authentication token: ${tokenError.message}` });
      }

      // // 2. Link the credential to the currently signed-in user (Client-side)
      // await linkWithCredential(currentUser, credential);
      // console.log("Phone credential linked successfully client-side.");

      // 3. Call the backend API to update Firestore/Auth (`phoneVerified: true`)
      try {
        await apiClient.post('/auth/verify-phone', { idToken });
        console.log("Backend notified of phone verification.");

        // --- AUTO-LOGIN STEP ---
        try {
            // 5. Dispatch login action to create session cookie via backend
            // Ensure loginUserWithToken POSTs the idToken to '/api/auth/login'
            console.log("Dispatching login action for session cookie...");
            await dispatch(loginUserWithToken(idToken)).unwrap(); // Use unwrap to catch login errors
            console.log("Session login initiated successfully after phone verification.");

            // 6. Clear verifier AFTER successful verification AND session login attempt
            clearRecaptchaVerifier();

            // 7. Refresh user data one last time AFTER login attempt (optional but good)
            // This ensures the final state reflects session login and potentially updated claims
            await dispatch(checkAuthStatus());
            console.log("Final auth status check dispatched.");

            // If everything succeeded up to here, the thunk resolves successfully (void)

        } catch (loginError: any) {
             // Handle errors specifically from the loginUserWithToken step
             console.error("Auto-login step failed after phone verification:", loginError);
             clearRecaptchaVerifier(); // Still clear verifier even if login fails
             // Decide how to handle: Reject verifyPhone? Or let it succeed but user isn't auto-logged in?
             // Rejecting verifyPhone seems reasonable as the full intended flow failed.
             return rejectWithValue({ message: `Phone verified, but auto-login failed: ${loginError.message || loginError}` });
        }
        // --- END AUTO-LOGIN STEP ---

      } catch (backendError: any) {
        // Handle errors from the '/api/auth/verify-phone' call
        console.error("Backend update failed after phone linking:", backendError);
        clearRecaptchaVerifier(); // Clear verifier on backend error
        return rejectWithValue({ message: `Phone linked, but backend update failed: ${backendError.message || 'Unknown backend error'}` });
      }

    } catch (linkError: any) {
      // Handle errors during client-side linking (e.g., invalid code)
      const message = linkError.message || 'Failed to verify phone code.';
      console.error("Error verifying/linking phone code:", linkError);
      clearRecaptchaVerifier(); // Clear verifier on linking error
      return rejectWithValue({ message, code: linkError.code }); // Include Firebase error code if available
    }
  }
);



// --- Slice Definition ---
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Optional: Reducer to manually clear errors if needed
    clearAuthError: (state) => {
      state.error = null;
      state.loginError = null;
      state.registrationError = null;
      state.phoneVerificationError = null;
      state.logoutError = null;
    },
    // Optional: Directly set user data if needed in specific scenarios
    // setUser: (state, action: PayloadAction<AuthenticatedUser | null>) => {
    //   state.user = action.payload;
    //   state.isAuthenticated = !!action.payload;
    //   state.loading = 'idle';
    //   state.error = null;
    // },
  },
  extraReducers: (builder) => {
    builder
      // checkAuthStatus
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = 'pending';
        state.error = null; // Clear previous errors
      })
      .addCase(checkAuthStatus.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = 'failed';
        state.isAuthenticated = false;
        state.user = null;
        // Only set error if it's not a silent rejection (e.g., 401)
        if (!(action.payload as any)?.silent) {
            state.error = (action.payload as any)?.message || action.error.message || 'Failed to check status';
        } else {
            state.error = null; // Clear error on silent rejection
        }
      })

      // loginUserWithToken
      .addCase(loginUserWithToken.pending, (state) => {
        state.loginLoading = 'pending';
        state.loginError = null;
        // Also update general loading/auth state optimistically or as needed
        state.loading = 'pending';
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(loginUserWithToken.fulfilled, (state, action: PayloadAction<User>) => {
        state.loginLoading = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
        state.loading = 'succeeded'; // Update general loading state
        state.loginError = null;
        state.error = null; // Clear general error on successful login
      })
      .addCase(loginUserWithToken.rejected, (state, action) => {
        state.loginLoading = 'failed';
        state.isAuthenticated = false;
        state.user = null;
        state.loading = 'failed'; // Update general loading state
        state.loginError = (action.payload as any)?.message || action.error.message || 'Login failed';
        state.error = state.loginError; // Reflect login error in general error
      })

      // logoutUser
      .addCase(logoutUser.pending, (state) => {
        state.logoutLoading = 'pending';
        state.logoutError = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.logoutLoading = 'succeeded';
        state.isAuthenticated = false;
        state.user = null;
        state.error = null; // Clear errors on logout
        state.loginError = null;
        state.registrationError = null;
        state.phoneVerificationError = null;
        state.phoneVerificationId = null;
        // Reset other states as needed
        state.loading = 'idle';
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.logoutLoading = 'failed';
        // Keep user logged in state? Or force logout? Forcing logout is safer.
        state.isAuthenticated = false;
        state.user = null;
        state.logoutError = (action.payload as any)?.message || action.error.message || 'Logout failed';
        // Optionally clear other errors or states here too
      })

      // registerUser
      .addCase(registerUser.pending, (state) => {
        state.registrationLoading = 'pending';
        state.registrationError = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.registrationLoading = 'succeeded';
        state.registrationError = null;
        // User is registered but not logged in yet usually
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.registrationLoading = 'failed';
        state.registrationError = (action.payload as any)?.message || action.error.message || 'Registration failed';
      })

      // sendPhoneVerification
      .addCase(sendPhoneVerification.pending, (state) => {
        state.phoneVerificationLoading = 'pending';
        state.phoneVerificationError = null;
        state.phoneVerificationId = null; // Clear previous ID
      })
      .addCase(sendPhoneVerification.fulfilled, (state, action: PayloadAction<string>) => {
        state.phoneVerificationLoading = 'succeeded';
        state.phoneVerificationId = action.payload; // Store the verification ID
        state.phoneVerificationError = null;
      })
      .addCase(sendPhoneVerification.rejected, (state, action) => {
        state.phoneVerificationLoading = 'failed';
        state.phoneVerificationError = (action.payload as any)?.message || action.error.message || 'Failed to send code';
        state.phoneVerificationId = null;
      })

       // verifyPhone
      .addCase(verifyPhone.pending, (state) => {
        // Use phoneVerificationLoading/Error for the verification step as well
        state.phoneVerificationLoading = 'pending';
        state.phoneVerificationError = null;
      })
      .addCase(verifyPhone.fulfilled, (state) => {
        // Verification succeeded (client + backend)
        state.phoneVerificationLoading = 'succeeded';
        state.phoneVerificationError = null;
        state.phoneVerificationId = null; // Clear ID after use
        // The user state (phoneVerified) should be updated by the checkAuthStatus dispatched within the thunk
        // If checkAuthStatus wasn't dispatched, update manually:
        // if (state.user) {
        //   state.user.phoneVerified = true;
        // }
      })
      .addCase(verifyPhone.rejected, (state, action) => {
        state.phoneVerificationLoading = 'failed';
        state.phoneVerificationError = (action.payload as any)?.message || action.error.message || 'Failed to verify code';
        // Keep verification ID? Maybe clear it depending on UX. Clearing is safer.
        // state.phoneVerificationId = null;
      });
  },
});

// Export actions and reducer
export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
