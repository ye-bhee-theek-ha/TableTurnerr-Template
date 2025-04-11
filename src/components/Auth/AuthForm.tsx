// auth form
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../../hooks/useAuth'; // Assuming correct path
import LoginForm from './Login'; // Assuming correct path
import SignupForm from './Signup'; // Assuming correct path
import PhoneVerificationForm from './PhoneVerification'; // Assuming correct path

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'phoneVerification'>(initialMode);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const [phoneNumber, setPhoneNumber] = useState(''); // Store phone number for verification/resend

  // State to handle component mount - prevents server-side rendering issues
  const [mounted, setMounted] = useState(false);
  const [isVerificationPending, setIsVerificationPending] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Use the unmodified useAuth hook ---
  const {
    // State pieces provided by the hook
    user,
    isAuthenticated, 
    loginLoading,    
    loginError,      
    registrationLoading,
    registrationError,   
    phoneVerificationLoading, 
    phoneVerificationError,   
    phoneVerificationId,      

    loginWithToken, 
    register,      
    sendVerificationCode, 
    verifyCode,           
    clearError,           
  } = useAuth();

  // --- Effects ---

  useEffect(() => {
  if (isOpen) {
        setMode(currentMode => currentMode !== initialMode ? initialMode : currentMode);
    } else {
      const timer = setTimeout(() => {
        setMode(initialMode);
        setPhoneNumber(''); 
        clearError(); 
      }, 300); 
      return () => clearTimeout(timer); 
    }
  }, [isOpen, initialMode, clearError]);


  useEffect(() => {

    const shouldClose = isOpen && isAuthenticated && (!isVerificationPending);

    if (shouldClose) {
      console.log(`Closing modal: isOpen=${isOpen}, isAuthenticated=${isAuthenticated}, isVerificationPending=${isVerificationPending}`);
      onClose();
  }

  }, [isOpen, isAuthenticated, isVerificationPending, user, onClose]);

  // --- Mode Switching and Handlers ---

  const switchMode = (newMode: 'login' | 'signup') => {
    console.log("Switching mode to:", newMode);
    console.info("Switching Current mode:", mode, "newMode", newMode);
    setSlideDirection(newMode === 'signup' ? 'left' : 'right');
    setMode(newMode);
    setIsVerificationPending(true);
    clearError(); // Clear errors when switching modes
  };

  const handlePhoneVerification = (phoneNum: string) => {
    setPhoneNumber(phoneNum);
    setSlideDirection('left');
    setMode('phoneVerification');
    clearError();
  };

  // Called by PhoneVerificationForm to resend the code
  const handleResendCode = useCallback(() => {
    if (phoneNumber) {
        clearError(); 
        sendVerificationCode(phoneNumber)
            .catch(err => {
                console.error("Error resending verification code:", err);
            });
    } else {
        console.error("Cannot resend code: phone number not available.");
    }
  }, [phoneNumber, sendVerificationCode, clearError]); // Add dependencies

  const handleVerificationSuccess = useCallback(() => {
    console.log("AuthModal: Phone verification successful.");
    setIsVerificationPending(false); // <-- Reset the flag on success
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsVerificationPending(false); 
  }, []);


  // --- Animation Variants ---
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  const slideVariants = {
    enterFromRight: { x: '100%', opacity: 0 },
    enterFromLeft: { x: '-100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exitToLeft: { x: '-100%', opacity: 0 },
    exitToRight: { x: '100%', opacity: 0 }
  };

  // --- Render Logic ---

  // Render nothing if not mounted (prevents hydration errors) or not open
  if (!mounted || !isOpen) return null;

  return (
    <div
      className="fixed h-full inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-md"
      // TODO disable on close while processing
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside closing the modal
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 z-10"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Use mode="wait" for smoother transitions between forms */}
        <AnimatePresence initial={false} custom={slideDirection} mode="wait">
          {mode === 'login' && (
            <motion.div
              key="login"
              custom={slideDirection}
              variants={slideVariants}
              initial={slideDirection === "right" ? "enterFromRight" : "enterFromLeft"}
              animate="center"
              exit={slideDirection === "right" ? "exitToLeft" : "exitToRight"} // Exit opposite to next enter
              transition={{ type: "tween", duration: 0.3 }}
            >
              <LoginForm
                onSwitch={() => switchMode('signup')}
                onLogin={loginWithToken}
                loading={loginLoading} // Pass specific loading state
                error={loginError}     // Pass specific error state
                clearAuthError={clearError} // Pass hook's clearError function
                onsuccess={handleLoginSuccess}
              />
            </motion.div>
          )}

          {mode === 'signup' && (
            <motion.div
              key="signup"
              custom={slideDirection}
              variants={slideVariants}
              initial={slideDirection === "right" ? "enterFromRight" : "enterFromLeft"}
              animate="center"
              exit={slideDirection === "right" ? "exitToLeft" : "exitToRight"} // Exit opposite to next enter
              transition={{ type: "tween", duration: 0.3 }}
            >
              <SignupForm
                onSwitch={() => switchMode('login')}
                onSignup={register} // Pass the register function from the hook
                loginWithToken={loginWithToken} // Pass the login function from the hook
                onPhoneVerification={handlePhoneVerification} // Keep this handler
                loading={registrationLoading} // Pass specific loading state
                error={registrationError}     // Pass specific error state
                clearAuthError={clearError}   // Pass hook's clearError function
              />
            </motion.div>
          )}

          {mode === 'phoneVerification' && (
            <motion.div
              key="phoneVerification"
              custom={slideDirection} // Might not need custom here if always entering from right
              variants={slideVariants}
              initial="enterFromRight" // Always enter from right after signup
              animate="center"
              exit="exitToLeft" // Assume it exits left if user goes back (though no back button shown)
              transition={{ type: "tween", duration: 0.3 }}
            >
              <PhoneVerificationForm
                phoneNumber={phoneNumber}
                onSendVerification={sendVerificationCode}
                // verifyCode from hook expects { code, verificationId }, hook handles adding Id
                onVerifyCode={verifyCode}
                onResendCode={handleResendCode} // Pass the implemented resend handler
                loading={phoneVerificationLoading} // Pass specific loading state
                error={phoneVerificationError}     // Pass specific error state
                user={user} // Pass user if needed by the form
                clearAuthError={clearError}        // Pass hook's clearError function
                onSuccess={handleVerificationSuccess}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AuthModal;