"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

import { auth } from '@/lib/firebase/ClientApp';
import { signInWithEmailAndPassword } from "firebase/auth";
interface LoginFormProps {
  onSwitch: () => void;
  onLogin: (idToken: string) => Promise<any> | void;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
  clearAuthError: () => void;
  onsuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSwitch,
  onLogin,
  loading,
  error,
  clearAuthError,
  onsuccess
  
}) => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // Handles the form submission (logic inside try/catch remains the same)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error) {
      clearAuthError();
    }

    // Prevent submission if already pending
    if (loading === 'pending') {
        return;
    }

    try {

      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginData.email,
        loginData.password
      );
      const user = userCredential.user;

      
      if (user) {
        const idToken = await user.getIdToken();

        await onLogin(idToken);
        onsuccess(); // Call the success callback after login

      } else {
         console.error("Login succeeded but user object is null.");
      }
      

    } catch (authError: any) {
      console.error("Authentication Error:", authError);

    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setLoginData({
      ...loginData,
      [name]: type === 'checkbox' ? checked : value
    });

    if (error) {
      clearAuthError();
    }
  };

  const isProcessing = loading === 'pending';

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
      <motion.h2 variants={itemVariants} className="text-h5 font-bold mb-6 text-center">Log In</motion.h2>
      
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
      
      <form onSubmit={handleLoginSubmit}>
        <motion.div variants={itemVariants} className="mb-4">
          <label htmlFor="login-email" className="block text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="login-email"
            name="email"
            value={loginData.email}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
            required
            autoComplete="email"
            disabled={isProcessing}
          />
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-4">
          <label htmlFor="login-password" className="block text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="login-password"
            name="password"
            value={loginData.password}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
            required
            autoComplete="current-password"
            disabled={isProcessing}
          />
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={loginData.rememberMe}
              onChange={handleInputChange}
              className="mr-2 focus:ring-primary focus:ring-2"
            />
            <label htmlFor="rememberMe" className="text-gray-700">
              Remember me
            </label>
          </div>
          
          <a href="/forgot-password" className="text-primary hover:underline">
            Forgot Password?
          </a>
        </motion.div>
        
        <motion.button
          variants={itemVariants}
          type="submit"
          disabled={isProcessing}
          className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 disabled:bg-primary/50 transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isProcessing ? 'Logging In...' : 'Log In'}
        </motion.button>
      </form>
      
      <motion.div variants={itemVariants} className="mt-4 text-center">
        <p className="text-gray-600">
          Don&apos;t have an account?{' '}
          <button 
            onClick={onSwitch}
            disabled={isProcessing} 
            className="text-primary hover:underline font-medium transition-colors duration-200"
          >
            Sign Up
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default LoginForm;