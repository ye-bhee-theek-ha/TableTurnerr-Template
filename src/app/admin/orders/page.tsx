// src/app/admin/orders/page.tsx 

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AdminOrderList from '@/components/admin/AdminOrderList'; // Component to display orders
import apiClient from '@/lib/apiClient'; // Your API client
import type { Order, OrderStatus } from '@/constants/types'; // Order types
import { RootState } from '@/lib/store/store'; // RootState for restaurant ID (if needed)
import { useUser } from '@/hooks/useUser'; // To check if user is admin/staff (optional client check)

// Define available statuses for filtering
const ALL_STATUSES: OrderStatus[] = [
    'pending', 'confirmed', 'preparing', 'ready_for_pickup',
    'out_for_delivery', 'delivered', 'completed_pickup',
    'cancelled_by_user', 'rejected_by_restaurant'
];

const AdminOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>(['pending', 'confirmed', 'preparing']); // Default filters
    const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Get restaurant ID (assuming it's available globally or via context/props)
    // Replace with your actual method of getting the restaurant ID for the admin
    const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

    // TODO: Add proper authorization check here - ensure only staff/admin can access
    const { profile } = useUser();
    // Example check (replace with your actual role logic):
    // const isAuthorized = profile?.role === 'admin' || profile?.role === 'staff';
    // useEffect(() => {
    //     if (!isAuthorized && profile) { // Redirect if profile loaded and not authorized
    //         router.push('/');
    //     }
    // }, [isAuthorized, profile, router]);


    // Function to fetch orders based on current filters/sorting
    const fetchOrders = useCallback(async () => {
        if (!restaurantId) {
            setError("Restaurant ID not configured.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                status: selectedStatuses.join(','),
                sortBy: sortBy,
                order: sortOrder,
                limit: '50',
            });
            const response = await apiClient.get(`/admin/restaurants/${restaurantId}/orders?${params.toString()}`);
            setOrders(response.data || []);
        } catch (err: any) {
            console.error("Error fetching orders:", err);
            setError(err.response?.data?.message || err.message || "Failed to fetch orders.");
        } finally {
            setIsLoading(false);
        }
    }, [restaurantId, selectedStatuses, sortBy, sortOrder]);

    // Fetch orders on initial load and when filters/sorting change
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]); // Dependency array includes the memoized fetchOrders

    // Handler for status filter changes
    const handleStatusChange = (status: OrderStatus) => {
        setSelectedStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status) // Remove status
                : [...prev, status] // Add status
        );
    };

    // Handler for order status update (passed down to child components)
    const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<boolean> => {
        if (!restaurantId) {
            console.error("Restaurant ID missing");
            alert("Configuration error: Restaurant ID missing.");
            return false;
        }
        console.log(`Attempting to update order ${orderId} to status ${newStatus}`);
        try {
            await apiClient.put(`/admin/restaurants/${restaurantId}/orders/${orderId}/status`, { status: newStatus });

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
                ).filter(order => selectedStatuses.includes(order.status))
            );

            // Or simply refetch all orders: fetchOrders();

             console.log(`Order ${orderId} status updated locally to ${newStatus}.`);
            return true;
        } catch (err: any) {
            console.error(`Error updating order ${orderId} status:`, err);
            // TODO set error state to show in UI
            return false;
        }
    };


    return (
        <div className='flex flex-col items-center w-full min-h-screen bg-gray-50'>

            {/* <Header /> */}

            <div className="h-[20px] w-full" />
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Admin - Order Management</h1>

                {/* Filter Controls */}
                <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-100">
                    <h2 className="text-lg font-semibold mb-3 text-gray-700">Filter by Status</h2>
                    <div className="flex flex-wrap gap-2">
                        {ALL_STATUSES.map(status => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={`px-3 py-1 text-xs sm:text-sm rounded-full border transition-colors duration-150 ${
                                    selectedStatuses.includes(status)
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                                }`}
                            >
                                {status.replace(/_/g, ' ')} {/* Make status more readable */}
                            </button>
                        ))}
                    </div>
                     {/* TODO: Add Sorting Controls (Dropdowns?) */}
                     {/* <div className="mt-4 flex gap-4"> ... </div> */}
                </div>

                {/* Order List Area */}
                {isLoading ? (
                    <div className="flex justify-center items-center pt-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-10 px-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                        <p className="font-medium">Failed to load orders:</p>
                        <p className="text-sm">{error}</p>
                        <button onClick={fetchOrders} className="mt-4 px-4 py-1.5 border border-red-300 rounded text-sm hover:bg-red-100">Retry</button>
                    </div>
                ) : (
                    <AdminOrderList
                        orders={orders}
                        onUpdateStatus={handleUpdateOrderStatus}
                    />
                )}
            </main>
             {/* Optional Footer */}
             {/* <Footer /> */}
        </div>
    );
}

export default AdminOrdersPage;
