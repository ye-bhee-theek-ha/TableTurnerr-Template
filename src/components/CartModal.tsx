// src/components/CartModal.tsx

"use client";

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Image from 'next/image';
import {
  selectCartItems,
  selectCartSubtotal,
  selectEstimatedLoyaltyPoints,
  incrementQuantity,
  decrementQuantity,
  removeItem,
  closeCart,
} from '@/lib/slices/cartSlice';
import { AppDispatch } from '@/lib/store/store';
import { CartItemOptions } from '@/constants/types';

import placeholderImg from '@/../public/Images/Product img 1.png';
import useUser from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

// Placeholder for icons - replace with your actual icon components or SVGs
const PlusIcon = () => <span className="text-xs font-bold">+</span>;
const MinusIcon = () => <span className="text-xs font-bold">-</span>;
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash3 text-gray-500 hover:text-primary" viewBox="0 0 16 16">
    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm-1 .72h-5.04l.83 10.37a1 1 0 0 0 .996.87h3.234a1 1 0 0 0 .996-.87zM8 5.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m3 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m-6 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5"/>
  </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return `$ ${amount.toFixed(2)}`;
};

// Helper to display options (example implementation)
const OptionDisplay: React.FC<{ options: CartItemOptions }> = ({ options }) => {
  const displayOptions = Object.entries(options)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0 ? `${key}: ${value.join(', ')}` : null;
      }
      if (typeof value === 'boolean' && value) {
        return key;
      }
      if (typeof value === 'string' || typeof value === 'number') {
        return `${value}`;
      }
      return null;
    })
    .filter(Boolean);

  if (displayOptions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {displayOptions.map((optionText, index) => (
        <span key={index} className="text-[10px] text-grey bg-gray-100 px-1.5 py-0.5 rounded">
          {optionText}
        </span>
      ))}
    </div>
  );
};


const CartModal: React.FC<{OnLoginRequired?: () => void, onProceedToConfirmation: () => void;}> = ({ OnLoginRequired, onProceedToConfirmation }) => {
  
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const loyaltyPoints = useSelector(selectEstimatedLoyaltyPoints);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);


  const { isAuthenticated, profile, defaultAddress, addresses } = useUser();
  const router = useRouter();

  const handleIncrement = (cartItemId: string) => {
    setCheckoutError(null);
    dispatch(incrementQuantity({ cartItemId }));
  };

  const handleDecrement = (cartItemId: string) => {
    setCheckoutError(null);
    dispatch(decrementQuantity({ cartItemId }));
  };

  const handleRemove = (cartItemId: string) => {
    setCheckoutError(null);
    dispatch(removeItem({ cartItemId }));
  };

  const handleClose = () => {
    setCheckoutError(null);
    dispatch(closeCart());
  };

  const handleCheckout = () => {
    setCheckoutError(null);  
    console.log('Proceeding to checkout confirmation...');

    if (!isAuthenticated) {
      handleClose();
      OnLoginRequired?.();
      return;
    }

    if (!profile?.phoneNumber && !profile?.phoneVerified) {
       // TODO: Prompt user to add phone number in their profile
       setCheckoutError("Please add and verify your phone number in your profile.");
       return;
    }

    if (!defaultAddress && (!addresses || addresses.length === 0)) {
      console.warn("User address missing.");
      setCheckoutError("Please add a delivery address to your profile.");
      return;
    }

    if (items.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    console.log('Validation passed, proceeding to confirmation step.');
    onProceedToConfirmation();

    handleClose();
  };

  if (!items || items.length === 0) {
    // Optional: Render an empty cart message or return null
    return (
        <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200 p-4 text-center">
             <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                aria-label="Close cart"
            >
               <CloseIcon/>
            </button>
            <p className="text-grey mt-8">Your cart is empty.</p>
        </div>
    );
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 md:w-96 max-h-[70vh] flex flex-col bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-black">Cart</h2>
        <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Close cart"
        >
           <CloseIcon/>
        </button>
      </div>

      {/* Cart Items List */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {items.map((item) => (
          <div key={item.cartItemId} className="flex items-start space-x-3">
            {/* Image */}
            <div className="flex-shrink-0">
              <Image
                src={item.imageUrl || placeholderImg}
                alt={item.name}
                width={60}
                height={60}
                className="rounded object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex-grow">
              <h3 className="text-sm font-bold text-black">{item.name}</h3>
              {/* Display selected options */}
              <OptionDisplay options={item.selectedOptions} />

              {/* Quantity Control */}
              <div className="flex items-center mt-1">
                <button
                  onClick={() => handleDecrement(item.cartItemId)}
                  className="flex items-center justify-center w-5 h-5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  <MinusIcon />
                </button>
                <span className="mx-2 text-sm font-medium text-black w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() => handleIncrement(item.cartItemId)}
                  className="flex items-center justify-center w-5 h-5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  <PlusIcon />
                </button>
              </div>
            </div>

            {/* Price & Remove */}
            <div className="flex flex-col items-end space-y-1 flex-shrink-0">
               <span className="text-sm font-bold text-black">{formatCurrency((parseFloat(item.price ?? '0')) * item.quantity)}</span>
               <button
                 onClick={() => handleRemove(item.cartItemId)}
                 className="mt-auto" // Push to bottom if needed
                 aria-label={`Remove ${item.name} from cart`}
               >
                 <TrashIcon />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {/* Loyalty Points */}
        <div className="bg-pink-100/50 text-primary-dark text-xs font-medium text-center p-2 rounded mb-3">
           You'll earn +{loyaltyPoints} points for this order
        </div>

        {/* Subtotal */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-md font-semibold text-black">Subtotal</span>
          <span className="text-md font-bold text-black">{formatCurrency(subtotal)}</span>
        </div>

        {checkoutError && (
            <div className="mb-3 p-2 bg-red-100 text-red-700 text-xs text-center rounded">
                {checkoutError}
                {/* Optional: Add links to profile sections */}
                {checkoutError.includes("phone") && <button onClick={() => { router.push('/profile?section=contact'); handleClose(); }} className="ml-1 underline font-medium">Update Profile</button>}
                {checkoutError.includes("address") && <button onClick={() => { router.push('/profile?section=addresses'); handleClose(); }} className="ml-1 underline font-medium">Add Address</button>}
            </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          className="w-full bg-primary text-white py-2.5 px-4 rounded-lg font-bold text-normal3 hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center"
        >
          Checkout
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CartModal;
