
"use client";

import React, { JSX, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import {
    selectMostRecentActiveOrder,
    fetchActiveUserOrders, // Use the action for active orders
    selectOrdersLoadingActive, // Use the loading state for active orders
    selectOrdersErrorActive, // Use the error state for active orders
    updateOrderStatus
} from '@/lib/slices/orderSlice'; // Adjust path
import { AppDispatch, RootState } from '@/lib/store/store'; // Adjust path
import { useUser } from '@/hooks/useUser'; // Adjust path
import { OrderStatus, OrderItem, CartItemOptions } from '@/constants/types'; // Adjust path
import placeholderImg from '@/../public/Images/Product img 1.png'; // Adjust path
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/ClientApp';

// --- Helper Functions & Components ---

const formatCurrency = (amount: number): string => {
    if (isNaN(amount) || !isFinite(amount)) return '$ 0.00';
    return `$ ${amount.toFixed(2)}`;
};

// Updated Option Display specifically for Order Items
const OrderOptionDisplay: React.FC<{ options: Record<string, any> | undefined }> = ({ options }) => {
    if (!options) return null;
    const displayOptions = Object.entries(options)
      .map(([key, value]) => {
        if (key.startsWith('_')) return null;
        let displayValue = '';
        if (Array.isArray(value)) {
          displayValue = value.filter(v => v && typeof v === 'string').join(', ');
        } else if (typeof value === 'string' && value) {
          displayValue = value;
        } else if (typeof value === 'boolean' && value) {
           displayValue = key;
        } else if (typeof value === 'number') {
           displayValue = String(value);
        }
        return displayValue ? displayValue : null;
      })
      .filter(Boolean);

    if (displayOptions.length === 0) return null;
    return <p className="text-xs text-gray-500 mt-0.5">({displayOptions.join(', ')})</p>;
};


// Status Icons and Text (similar to tracker)
const getStatusInfo = (status: OrderStatus | undefined | null): { text: string; colorClass: string; bgColorClass: string; icon?: JSX.Element; progress: number } => {
    switch (status) {
        case 'pending':
            return { text: 'Order Received', colorClass: 'text-yellow-700', bgColorClass: 'bg-yellow-100', icon: <ClockIcon />, progress: 10 };
        case 'confirmed':
            return { text: 'Order Confirmed', colorClass: 'text-blue-700', bgColorClass: 'bg-blue-100', icon: <CheckCircleIcon />, progress: 30 };
        case 'preparing':
            return { text: 'Preparing Your Order', colorClass: 'text-indigo-700', bgColorClass: 'bg-indigo-100', icon: <ChefIcon />, progress: 50 };
        case 'ready_for_pickup':
            return { text: 'Ready for Pickup', colorClass: 'text-purple-700', bgColorClass: 'bg-purple-100', icon: <BagIcon />, progress: 80 };
        case 'out_for_delivery':
            return { text: 'Out for Delivery', colorClass: 'text-teal-700', bgColorClass: 'bg-teal-100', icon: <TruckIcon />, progress: 80 };
        // Completed/Cancelled states won't typically be shown by the active order selector
        default:
            return { text: 'Loading Status...', colorClass: 'text-gray-600', bgColorClass: 'bg-gray-100', icon: <Spinner />, progress: 0 };
    }
};

// Placeholder Icons
const ClockIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckCircleIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ChefIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V10a2 2 0 012-2h2V6l4 2zM7 8V6l4-2v4" /></svg>;
const BagIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const TruckIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;


const OrderDetails: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated } = useUser();
    const order = useSelector(selectMostRecentActiveOrder);
    const isLoading = useSelector(selectOrdersLoadingActive);
    const error = useSelector(selectOrdersErrorActive);

    const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

    useEffect(() => {
        if (isAuthenticated && isLoading) {
            console.log("OrderDetails: Fetching active orders...");
            dispatch(fetchActiveUserOrders());
        }

        // Set up real-time listener for the specific active order ID if needed
        const orderId = order?.id;
        if (orderId) {
            const unsubscribe = onSnapshot(doc(db, `Restaurants/${restaurantId}/orders/${orderId}`), (doc) => {
                if (doc.exists()) {
                    const updatedOrder = doc.data();
                    dispatch(updateOrderStatus({ orderId: updatedOrder.id, status: updatedOrder.status as OrderStatus })); 
                }
            });
            return () => unsubscribe();
        }

    }, [isAuthenticated, dispatch, isLoading]); // Depend on loading state

    // --- Render Logic ---

    if (!isAuthenticated) {
        // Or redirect to login, or show login prompt
        return <div className="p-4 text-center text-gray-500">Please log in to view your orders.</div>;
    }

    if (isLoading && !order) { // Show loading only if no order data is available yet
        return (
            <div className="p-6 text-center">
                <Spinner />
                <p className="text-sm text-gray-500 mt-2">Loading active order details...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-center text-red-600">Error loading orders: {error}</div>;
    }

    if (!order) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-600">You have no active orders right now.</p>
                <Link href="/menu" legacyBehavior>
                    <a className="mt-4 inline-block px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors">
                        Start Ordering
                    </a>
                </Link>
            </div>
        );
    }

    // We have an active order, display its details
    const { text: statusText, colorClass, bgColorClass, icon: StatusIcon, progress } = getStatusInfo(order.status);
    const estimatedTime = order.estimatedCompletionTime
        ? new Date(order.estimatedCompletionTime as string).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : null;

    return (
        // Example: Render as a card or section on a page
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100 w-full max-w-2xl mx-auto my-6">
            {/* Order Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Current Order Status</h2>
                    <p className="text-sm text-gray-500">Order #{order.orderNumber || order.id.substring(0, 8)}</p>
                </div>
                <div className={`mt-2 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bgColorClass} ${colorClass}`}>
                    {StatusIcon && <span className="mr-1.5 -ml-0.5">{StatusIcon}</span>}
                    {statusText}
                </div>
            </div>

             {/* Progress Bar */}
             <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
                <motion.div
                    className="bg-primary h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                 />
            </div>

            {/* Estimated Time */}
            {estimatedTime && (
                 <p className="text-sm text-center text-gray-600 mb-4">
                    Estimated {order.orderType === 'delivery' ? 'Delivery' : 'Ready'} Time: <span className="font-medium text-primary-dark">{estimatedTime}</span>
                 </p>
            )}


            {/* Order Items */}
            <div className="mb-4">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Items</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {order.items.map((item, index) => (
                        <div key={`${item.menuItemId}-${index}`} className="flex justify-between items-start text-sm">
                            <div className="flex-grow mr-2">
                                <span className="font-medium text-gray-800">{item.quantity} x {item.name}</span>
                                <OrderOptionDisplay options={item.selectedOptions} />
                            </div>
                            <span className="text-gray-700 flex-shrink-0">{formatCurrency(item.totalPrice)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Totals */}
             <div className="text-sm border-t pt-3 mt-3 space-y-1">
                <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">{formatCurrency(order.subTotal)}</span>
                </div>
                {/* Add Delivery Fee, Tax, Discount if present in order data */}
                <div className="flex justify-between font-semibold text-base text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                </div>
            </div>

            {/* Delivery Address */}
            {order.orderType === 'delivery' && order.deliveryAddress && (
                 <div className="mt-4 border-t pt-3">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Delivery Address</h3>
                    <div className="flex items-start text-sm text-gray-600">
                        <MapPinIcon />
                        <span>{order.deliveryAddress.address}</span>
                    </div>
                 </div>
            )}

             {/* Special Instructions */}
             {order.specialInstructions && (
                 <div className="mt-4 border-t pt-3">
                    <h3 className="text-md font-semibold text-gray-700 mb-1">Special Instructions</h3>
                    <p className="text-sm text-gray-600 italic">"{order.specialInstructions}"</p>
                 </div>
             )}

             {/* Link to full order history */}
             <div className="mt-6 text-center">
                <Link href="/orders" legacyBehavior>
                    <a className="text-sm text-primary hover:underline">
                        View All Orders
                    </a>
                </Link>
             </div>
        </div>
    );
};

export default OrderDetails;