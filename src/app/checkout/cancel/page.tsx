// src/app/checkout/cancel/page.tsx

"use client";

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { selectCartTotalItemCount } from '@/lib/slices/cartSlice'; 

const CheckoutCancelPage: React.FC = () => {
    const cartItemCount = useSelector(selectCartTotalItemCount);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
             <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                   <svg className="h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                   </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
                <p className="text-gray-600 mb-6">
                    Your payment process was cancelled. Your order has not been placed.
                </p>

                {/* Conditionally show return to cart button */}
                {cartItemCount > 0 && (
                    <p className="text-sm text-gray-500 mb-6">
                        Your items are still in your cart if you'd like to try again.
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/MenuPage" legacyBehavior>
                         <a className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                            Return to Menu
                         </a>
                    </Link>
                </div>
             </div>
        </div>
    );
};

export default CheckoutCancelPage;
