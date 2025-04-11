"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { clearRecaptchaVerifier } from '@/lib/firebase/services/auth';
import type { VerifyPhonePayload } from '@/lib/slices/authSlice';

interface PhoneVerificationFormProps {
  phoneNumber: string;
  onSendVerification: (phoneNumber: string) => Promise<string | null>;
  onVerifyCode: (payload: VerifyPhonePayload) => Promise<any>;  onResendCode: () => void;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null; 
  user: any; 
  clearAuthError: () => void;
  onSuccess: () => void; 
}

const PhoneVerificationForm: React.FC<PhoneVerificationFormProps> = ({
  phoneNumber,
  onSendVerification,
  onVerifyCode,
  onResendCode,
  loading,
  error,
  onSuccess,
  user,
  clearAuthError
}) => {
  
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [localError, setLocalError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const initialSendAttempted = useRef(false);

  console.log("PhoneVerificationForm mounted with phoneNumber:", phoneNumber);

  useEffect(() => {
    if (!initialSendAttempted.current && phoneNumber) {
        initialSendAttempted.current = true;
        handleSendVerificationCode();
    }
    return () => {
      clearRecaptchaVerifier();
    };
  }, [phoneNumber]);

  const handleSendVerificationCode = async () => {
    clearAuthError();
    setLocalError('');
    setVerificationSuccess(false);
    setIsSendingCode(true);
    setVerificationId(null); // Reset verificationId before sending
    setShowVerificationInput(false); // Hide input while sending

    let formattedPhoneNumber = phoneNumber;
    if (!formattedPhoneNumber.startsWith('+')) {
      console.warn("Formatting phone number for E.164.");
      formattedPhoneNumber = `+${phoneNumber.replace(/\D/g, '')}`;
    }

    try {
      // Call onSendVerification, which now returns Promise<string | null>
      const resultId = await onSendVerification(formattedPhoneNumber);

      if (resultId) {
        setVerificationId(resultId); // Store the received ID
        setShowVerificationInput(true);
      } else {
        // Failure is indicated by null or rejection, error state should be set by Redux
        setLocalError('Failed to send verification code. Please try again or check the error message.'); // More specific local message
        setShowVerificationInput(false);
      }
    } catch (err: any) {
      // Catch errors from the promise rejection (e.g., recaptcha container not found)
      console.error("Error calling onSendVerification:", err);
      setLocalError(err.message || 'An unexpected error occurred while sending the code.');
      setShowVerificationInput(false);
      // Redux state should also reflect the error via the 'error' prop
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalError('');

    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }

    // --- Updated Payload ---
    // Ensure verificationId was successfully received and stored
    if (verificationId) {
        // Create the payload expected by the updated useAuth.verifyCode and the verifyPhone thunk
        const payload: VerifyPhonePayload = {
            verificationId: verificationId,
            verificationCode: verificationCode,
            // No longer need to pass 'user' here, thunk gets it internally
        };

        try {
            // Call the onVerifyCode function passed via props
            await onVerifyCode(payload);

            // Assume success if onVerifyCode promise resolves without error.
            // The Redux state (user.phoneVerified) should be updated by the thunk.
            setVerificationSuccess(true);
            clearRecaptchaVerifier(); // Clean up reCAPTCHA on success
            onSuccess()

        } catch (err: any) {
            // Errors are handled by Redux state (`error` prop) if using .unwrap() in hook,
            // or caught here if the raw dispatch promise rejects.
            console.error("Error calling onVerifyCode:", err);
            setVerificationSuccess(false);
            // Set local error *only if* the `error` prop isn't sufficient
            // setLocalError(err.message || 'An error occurred during verification.');
        }
    } else {
        // This indicates the verificationId wasn't obtained correctly earlier
        setLocalError('Verification session is invalid or expired. Please request a new code.');
        console.error("Verification error: verificationId is missing in component state.");
    }
  };


  // --- Resend Code Logic ---
  const handleResend = () => {
    setVerificationCode('');
    // verificationId is reset in handleSendVerificationCode
    setShowVerificationInput(false);
    setLocalError('');
    setVerificationSuccess(false);
    clearAuthError();
    clearRecaptchaVerifier(); // Clear current verifier before trying again

    // Call parent handler first (optional, depends on parent logic)
    onResendCode();
    // Re-initiate the send process
    handleSendVerificationCode();
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={formVariants}
      className="p-6"
    >
      <motion.h2 variants={itemVariants} className="text-h5 font-bold mb-6 text-center">
        Phone Verification
      </motion.h2>
      
      {error && (
        <motion.div 
          variants={itemVariants}
          className="mb-4 p-3 bg-red-100 text-red-700 rounded"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {error}
        </motion.div>
      )}
      
      {localError && (
        <motion.div 
          variants={itemVariants}
          className="mb-4 p-3 bg-red-100 text-red-700 rounded"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {localError}
        </motion.div>
      )}
      
      {verificationSuccess ? (
        <motion.div
          variants={itemVariants}
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded">
            <p className="font-medium">Phone number verified successfully!</p>
            <p className="mt-2">You can now continue to your account.</p>
          </div>
          
          <motion.div
            className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 0, 0]
            }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
          >
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              We've sent a verification code to:
            </p>
            <p className="font-medium text-gray-900">{phoneNumber}</p>
          </div>
          
          {showVerificationInput ? (
            <form onSubmit={handleVerifyCode}>
              <motion.div 
                variants={itemVariants}
                className="mb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <label htmlFor="verificationCode" className="block text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </motion.div>
              
              <motion.button
                variants={itemVariants}
                type="submit"
                disabled={loading === "pending"}
                className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 disabled:bg-primary/50 transition-colors duration-200 mb-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading === "pending" ? 'Verifying...' : 'Verify Code'}
              </motion.button>
              
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={handleResend}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Resend Code
              </motion.button>
            </form>
          ) : (
            <motion.div
              className="flex justify-center" 
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 0, 0]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </motion.div>
          )}
        </motion.div>
      )}
      <div id="recaptcha-container"></div>
    </motion.div>
  );
};

export default PhoneVerificationForm;