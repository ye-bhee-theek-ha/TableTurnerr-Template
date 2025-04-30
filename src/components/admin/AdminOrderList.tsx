// src/components/admin/AdminOrderList.tsx (Example Path)

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order, OrderStatus } from '@/constants/types'; // Adjust path
import AdminOrderCard from './AdminOrderCard'; // Import the card component

interface AdminOrderListProps {
    orders: Order[];
    onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<boolean>;
}

const AdminOrderList: React.FC<AdminOrderListProps> = ({ orders, onUpdateStatus }) => {

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-10 px-4 bg-white rounded-lg shadow border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Orders Found</h3>
                <p className="mt-1 text-sm text-gray-500">No orders match the current filters.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AnimatePresence>
                {orders.map((order, index) => (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }} // Stagger animation
                    >
                        <AdminOrderCard
                            order={order}
                            onUpdateStatus={onUpdateStatus}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default AdminOrderList;
