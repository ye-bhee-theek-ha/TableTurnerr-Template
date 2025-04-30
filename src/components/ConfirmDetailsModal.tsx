// src/components/ConfirmDetailsModal.tsx (Example Path)

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';

import { RootState, AppDispatch } from '@/lib/store/store';
import { useUser } from '@/hooks/useUser';
import {
    calculatePriceForItem,
    selectCartItems,
    selectCartSubtotal,
} from '@/lib/slices/cartSlice';

import apiClient from '@/lib/apiClient';

import { CartItem as CartItemTypeDefinition } from '@/constants/types';
import placeholderImg from '@/../public/Images/Product img 1.png';

// --- Initialize Stripe ---
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// --- Helper Functions & Components (Keep formatCurrency, LoadingSpinner, ErrorIcon, CloseIcon) ---
const formatCurrency = (amount: number): string => {
    if (isNaN(amount) || !isFinite(amount)) {
      return '$ 0.00';
    }
    return `$ ${amount.toFixed(2)}`;
};

// TODO: Replace with your actual loading spinner component
const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
);

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


// --- Component Props ---
interface ConfirmDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ConfirmDetailsModal: React.FC<ConfirmDetailsModalProps> = ({ isOpen, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const cartItems = useSelector(selectCartItems);
    const subtotal = useSelector(selectCartSubtotal);
    const { profile, defaultAddress, addresses, userId, isLoading: isUserLoading } = useUser();

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const modalRef = useRef<HTMLDivElement>(null);

    const deliveryAddress = defaultAddress || (addresses && addresses.length > 0 ? addresses[0] : null);

    useEffect(() => {
        if (!isOpen) {
            setIsProcessing(false);
            setError(null);
        }
    }, [isOpen]);

    // --- Click Outside Handler 
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (!isProcessing && modalRef.current && !modalRef.current.contains(event.target as Node)) {
            handleClose();
          }
        };
        if (isOpen) { document.addEventListener("mousedown", handleClickOutside); }
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [isOpen, isProcessing, onClose]); 


    const handleClose = () => {
        if (isProcessing) return;
        setError(null);
        setIsProcessing(false);
        onClose();
    }

    // --- Initiate Payment via Backend API ---
    const handleProceedToPayment = async () => {
        setError(null);
        setIsProcessing(true);

        if (!userId || !deliveryAddress || cartItems.length === 0) {
            setError("Missing required information."); setIsProcessing(false); return;
        }

        try {
            console.log("Calling backend to initiate checkout session...");

            const response = await apiClient.post('/orders/initiate-checkout', {
                cartItems: cartItems,
                deliveryAddress: deliveryAddress,
                restaurantId: process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID
            });

            const { sessionId } = response.data;

            if (!sessionId) {
                throw new Error("Backend did not return a session ID.");
            }

            console.log("Received Stripe Session ID:", sessionId);

            const stripe = await stripePromise;
            if (stripe) {
                const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
                if (stripeError) {
                    console.error("Stripe redirection error:", stripeError);
                    setError(stripeError.message || "Failed to redirect to payment.");
                    // Allow retry on redirection failure
                    setIsProcessing(false);
                }
                // If successful, user leaves the page.
                // If fails, error is shown, isProcessing becomes false.
            } else {
                 setError("Stripe.js failed to load.");
                 setIsProcessing(false);
            }

        } catch (err: any) {
            console.error("Error initiating checkout via backend:", err);
            setError(err.response?.data?.message || err.message || "Could not initiate checkout.");
            setIsProcessing(false);
        }
    };

    // --- Loading State for User Data (Keep as is) ---
    if (isOpen && (isUserLoading || !profile || !deliveryAddress)) 
    {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                <motion.div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-700">Loading details...</p>
                </motion.div>
            </div>
        );
    }

    if (!isOpen) return null;

    return (
        <div className="absolute top-full right-0 mt-2 w-80 md:w-96 max-h-[70vh] flex flex-col bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden">
            <motion.div
                ref={modalRef}
                className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}
            >
                 {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Confirm Details</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 disabled:opacity-50" aria-label="Close" disabled={isProcessing}>
                        <CloseIcon/>
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto">
                    {/* Show Processing / Error State */}
                    {isProcessing && !error && (
                        <div className="text-center p-6 flex flex-col items-center justify-center min-h-[150px]">
                            <LoadingSpinner />
                            <p className="mt-3 text-sm text-gray-600">Connecting to payment gateway...</p>
                            <p className="text-xs text-gray-400 mt-1">Please wait...</p>
                        </div>
                    )}
                    {error && !isProcessing && (
                         <div className="text-center p-6 flex flex-col items-center justify-center min-h-[150px]">
                            <ErrorIcon />
                            <p className="mt-2 text-sm text-primary font-medium">Payment Error</p>
                            <p className="mt-1 text-xs text-gray-500">{error}</p>
                             <button onClick={handleProceedToPayment} className="mt-4 px-4 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50">
                                Retry
                             </button>
                        </div>
                    )}

                    {/* Show Confirmation Details when not processing and no error */}
                    {!isProcessing && !error && profile && deliveryAddress && (
                        <>
                            {/* Delivery Details Summary */}
                            <div className="mb-4">
                                <h3 className="text-md font-semibold text-gray-700 mb-2">Deliver To:</h3>
                                <div className="bg-gray-50 p-3 rounded-md border text-sm space-y-1">
                                    <p className="font-medium">{profile.displayName}</p>
                                    <p className="text-gray-600">{profile.phoneNumber} {profile.phoneVerified ? <span className="text-green-600 text-xs">(Verified)</span> : <span className="text-red-600 text-xs">(Not Verified)</span>}</p>
                                    <p className="text-gray-600 mt-1">{deliveryAddress.address}</p>
                                    <button onClick={onClose} className="text-xs text-primary hover:underline pt-1">
                                        Edit Details
                                    </button>
                                </div>
                            </div>

                            {/* Order Summary Snippet */}
                            <div className="mb-4">
                                <h3 className="text-md font-semibold text-gray-700 mb-2">Order Summary:</h3>
                                <div className="text-sm space-y-1 max-h-24 overflow-y-auto border rounded-md p-2">
                                    {cartItems.map(item => (
                                        <p key={item.cartItemId} className="text-gray-600 truncate text-xs">
                                            {item.quantity} x {item.name} ({formatCurrency(calculatePriceForItem(item as CartItemTypeDefinition))}/ea)
                                        </p>
                                    ))}
                                </div>
                                 <div className="flex justify-between font-medium pt-2 mt-2 text-sm">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 text-center mb-1">
                                You will be redirected to Stripe to complete your payment securely.
                            </p>
                        </>
                    )}
                </div>

                 {/* Footer with Action Button */}
                 <div className="p-4 bg-gray-50 border-t">
                    <button
                        onClick={handleProceedToPayment}
                        disabled={isProcessing || !!error}
                        className="w-full bg-primary text-white py-2.5 px-4 rounded-lg font-bold text-normal3 hover:bg-primary-dark transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                        {isProcessing ? <LoadingSpinner/> : null}
                        {isProcessing ? 'Processing...' : `Confirm & Pay ${formatCurrency(subtotal)}`}
                    </button>
                    {(isProcessing || error) && (
                         <button
                            onClick={handleClose}
                            className="w-full text-center text-xs text-gray-500 hover:underline mt-2 disabled:opacity-50"
                            disabled={isProcessing && !error}
                         >
                            Cancel
                         </button>
                    )}
                 </div>
            </motion.div>
        </div>
    );
};

export default ConfirmDetailsModal;
