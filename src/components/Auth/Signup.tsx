"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { RegisterPayload } from '@/lib/slices/authSlice';


interface SignupFormProps {
  onSwitch: () => void;
  onSignup: (payload: RegisterPayload) => Promise<any>; // Return type might vary based on thunk
  onPhoneVerification: (phone: string) => void; // Keep this handler for switching view
  loading: "idle" | "pending" | "succeeded" | "failed"
  error: string | null; // Corresponds to registrationError from useAuth
  clearAuthError: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({
  onSwitch,
  onSignup,
  onPhoneVerification,
  loading,
  error,
  clearAuthError
}) => {
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: ''
  });

  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });

  const validateSignupForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
    };
    
    // Email validation
    if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Password validation
    if (signupData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }
    
    // Confirm password validation
    if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    // Phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(signupData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number with country code';
      isValid = false;
    }
    
    setFormErrors(newErrors);
    return isValid;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError(); // Clear previous auth errors on new submission attempt

    if (validateSignupForm()) {
      // Create the payload object expected by the register function from useAuth
      const payload: RegisterPayload = {
        email: signupData.email,
        password: signupData.password,
        displayName: signupData.displayName,
        phoneNumber: signupData.phoneNumber
      };

      try {

        const resultAction = await onSignup(payload);

        onPhoneVerification(signupData.phoneNumber); // Trigger phone verification UI switch

      } catch (err) {
        console.error("Signup failed:", err);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setSignupData({
      ...signupData,
      [name]: value
    });
    
    // Clear form errors
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
    
    // Clear any auth errors
    if (error) {
      clearAuthError();
    }
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
      <motion.h2 variants={itemVariants} className="text-h5 font-bold mb-6 text-center">Create an Account</motion.h2>
      
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
      
      <form onSubmit={handleSignupSubmit}>
        <motion.div variants={itemVariants} className="mb-4">
          <label htmlFor="displayName" className="block text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={signupData.displayName}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
            required
          />
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-4">
          <label htmlFor="signup-email" className="block text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="signup-email"
            name="email"
            value={signupData.email}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary ${
              formErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {formErrors.email && (
            <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
          )}
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-4">
          <label htmlFor="phoneNumber" className="block text-gray-700 mb-2">
            Phone Number (with country code)
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={signupData.phoneNumber}
            onChange={handleInputChange}
            placeholder="+1 (123) 456-7890"
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary ${
              formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {formErrors.phoneNumber && (
            <p className="text-red-500 text-sm mt-1">{formErrors.phoneNumber}</p>
          )}
          {/* <p className="text-sm text-gray-500 mt-1">
            Format: +[country code][number] (e.g., +12345678900)
          </p> */}
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-4">
          <label htmlFor="signup-password" className="block text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="signup-password"
            name="password"
            value={signupData.password}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary ${
              formErrors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {formErrors.password && (
            <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
          )}
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={signupData.confirmPassword}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary ${
              formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {formErrors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
          )}
        </motion.div>
        
        <motion.button
          variants={itemVariants}
          type="submit"
          disabled={loading === "pending"}
          className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 disabled:bg-primary/50 transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading === "pending" ? 'Creating Account...' : 'Sign Up'}
        </motion.button>
      </form>
      
      <motion.div variants={itemVariants} className="mt-4 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button 
            onClick={onSwitch}
            className="text-primary hover:underline font-medium transition-colors duration-200"
          >
            Log In
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SignupForm;