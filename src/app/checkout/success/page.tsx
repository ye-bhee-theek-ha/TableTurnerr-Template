// src/app/checkout/success/page.tsx

"use client";

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearCart } from '@/lib/slices/cartSlice'; // Adjust path
import { AppDispatch } from '@/lib/store/store'; // Adjust path
import Link from 'next/link'; // For linking back to menu/orders

// Loading component for Suspense boundary
const Loading = () => (
    <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
    </div>
);

const SuccessContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const sessionId = searchParams.get('session_id');

    // Clear cart on successful mount
    useEffect(() => {
        console.log("Checkout successful, clearing cart...");
        dispatch(clearCart());
    }, [dispatch]);

    // Optional: Fetch order details using sessionId if needed for display
    // const [order, setOrder] = useState(null);
    // useEffect(() => {
    //     if (sessionId) {
    //         // Example: Fetch order details from your backend
    //         // apiClient.get(`/api/orders/by-session/${sessionId}`)
    //         //     .then(response => setOrder(response.data))
    //         //     .catch(err => console.error("Error fetching order details:", err));
    //     }
    // }, [sessionId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                {/* Success Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <svg className="h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-6">
                    Thank you for your order. We've received your payment and your order is being processed.
                </p>

                {/* {order && order.orderNumber && (
                    <p className="text-sm text-gray-500 mb-4">Order Number: <span className="font-medium text-gray-700">{order.orderNumber}</span></p>
                )} */}

                <p className="text-xs text-gray-500 mb-6">
                    You can track your order status in your profile's order history. A confirmation email may also be sent shortly.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/orders" legacyBehavior>
                        <a className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors">
                            View Orders
                        </a>
                    </Link>
                    <Link href="/MenuPage" legacyBehavior>
                         <a className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                            Back to Menu
                         </a>
                    </Link>
                </div>
            </div>
        </div>
    );
}


// Main page component using Suspense
const CheckoutSuccessPage = () => {
    return (
        <Suspense fallback={<Loading />}>
            <SuccessContent />
        </Suspense>
    );
};


export default CheckoutSuccessPage;
