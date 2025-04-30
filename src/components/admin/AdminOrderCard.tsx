// src/components/admin/AdminOrderCard.tsx (Example Path)

import React, { useState } from 'react';
import type { Order, OrderStatus, OrderItem, CartItemOptions } from '@/constants/types';
import { Timestamp } from 'firebase/firestore';

// Define the possible next statuses based on the current status
// This helps guide the admin/staff
const NEXT_STATUS_OPTIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
    pending: ['confirmed', 'rejected_by_restaurant'],
    confirmed: ['preparing', 'rejected_by_restaurant'],
    preparing: ['ready_for_pickup', 'out_for_delivery'], // Assuming ready_for_pickup is only for pickup orders
    ready_for_pickup: ['completed_pickup'],
    out_for_delivery: ['delivered'],
    // Completed/cancelled orders usually have no further actions
};

// Helper to format date/time
const formatDateTime = (dateInput: Date | string | Timestamp | undefined | null): string => {
    if (!dateInput) return 'N/A';
    try {
        let date: Date;

        if (typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
            date = dateInput.toDate();
        }

        else if (dateInput instanceof Date) {
            date = dateInput;
        }

        else if (typeof dateInput === 'string') {
            date = new Date(dateInput);
        }

        else if (typeof dateInput === 'object' && dateInput !== null && '_seconds' in dateInput && '_nanoseconds' in dateInput) {
             date = new Timestamp((dateInput as any)._seconds, (dateInput as any)._nanoseconds).toDate();
        }
         else {
             console.warn("formatDateTime received unexpected type:", typeof dateInput, dateInput);
             return 'Invalid Input';
        }

        // Check if the resulting date is valid
        if (isNaN(date.getTime())) {
             console.warn("formatDateTime resulted in an invalid date from input:", dateInput);
             return 'Invalid Date';
        }

        // Format the valid date
        return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    } catch (e) {
        console.error("Error formatting date:", e, dateInput); // Log error and input
        return 'Formatting Error';
    }
};
// Helper to format currency
const formatCurrency = (amount: number): string => {
    if (isNaN(amount) || !isFinite(amount)) return '$ 0.00';
    return `$ ${amount.toFixed(2)}`;
};

// Simplified Option Display for Order Items
const OrderOptionDisplay: React.FC<{ options: Record<string, any> | undefined }> = ({ options }) => {
    if (!options) return null;
    const displayOptions = Object.entries(options)
      .map(([key, value]) => {
        if (key.startsWith('_')) return null; // Skip internal keys
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
    return <span className="text-xs text-gray-500 ml-1">({displayOptions.join(', ')})</span>;
};


interface AdminOrderCardProps {
    order: Order;
    onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<boolean>;
}

const AdminOrderCard: React.FC<AdminOrderCardProps> = ({ order, onUpdateStatus }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedNextStatus, setSelectedNextStatus] = useState<OrderStatus | ''>('');

    const possibleNextStatuses = NEXT_STATUS_OPTIONS[order.status] || [];

    const handleStatusUpdate = async () => {
        if (!selectedNextStatus) {
            alert("Please select a status to update to.");
            return;
        }
        setIsUpdating(true);
        const success = await onUpdateStatus(order.id, selectedNextStatus);
        if (success) {
            setSelectedNextStatus(''); // Reset dropdown on success
        }
        setIsUpdating(false);
    };

    return (
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
            {/* Card Header */}
            <div className="px-4 py-3 sm:px-6 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-wrap justify-between items-center gap-2">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Order #{order.orderNumber || order.id.substring(0, 8)}
                        </h3>
                        {<p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Placed: {formatDateTime(order.createdAt)}
                        </p>}
                        {<p className="mt-1 max-w-2xl text-sm text-gray-500">
                            ({order.orderType})
                        </p>}
                    </div>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                         order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                         order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                         order.status === 'preparing' ? 'bg-indigo-100 text-indigo-800' :
                         order.status === 'ready_for_pickup' ? 'bg-purple-100 text-purple-800' :
                         order.status === 'out_for_delivery' ? 'bg-teal-100 text-teal-800' :
                         order.status === 'delivered' || order.status === 'completed_pickup' ? 'bg-green-100 text-green-800' :
                         'bg-red-100 text-red-800' // Cancelled/Rejected
                        } capitalize`}
                    >
                        {order.status.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="px-4 py-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer Info */}
                <div className="md:col-span-1">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Customer</h4>
                    <p className="text-sm text-gray-900">{order.customerInfo.name}</p>
                    <p className="text-sm text-gray-600">{order.customerInfo.email}</p>
                    <p className="text-sm text-gray-600">{order.customerInfo.phoneNumber}</p>
                     {order.orderType === 'delivery' && order.deliveryAddress && (
                        <p className="text-sm text-gray-600 mt-1">{order.deliveryAddress.address}</p>
                     )}
                     {order.specialInstructions && (
                        <p className="text-xs text-gray-500 mt-2 italic">Note: "{order.specialInstructions}"</p>
                     )}
                </div>

                {/* Order Items */}
                <div className="md:col-span-2">
                     <h4 className="text-sm font-medium text-gray-500 mb-1">Items ({order.items.length})</h4>
                     <div className="space-y-1 max-h-32 overflow-y-auto text-sm border rounded-md p-2 bg-gray-50/50">
                        {order.items.map((item, index) => (
                            <div key={`${item.menuItemId}-${index}`} className="flex justify-between">
                                <div>
                                    <span className="text-gray-800">{item.quantity} x {item.name}</span>
                                    <OrderOptionDisplay options={item.selectedOptions} />
                                </div>
                                <span className="text-gray-700">{formatCurrency(item.totalPrice)}</span>
                            </div>
                        ))}
                     </div>
                      <div className="flex justify-end font-semibold text-sm mt-2 pt-1 border-t">
                        <span>Total: {formatCurrency(order.totalAmount)}</span>
                      </div>
                </div>
            </div>

            {/* Card Footer - Actions */}
            {possibleNextStatuses.length > 0 && ( // Only show actions if there are next steps
                 <div className="px-4 py-3 sm:px-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <label htmlFor={`status-select-${order.id}`} className="text-sm font-medium text-gray-700 flex-shrink-0">Update Status:</label>
                        <select
                            id={`status-select-${order.id}`}
                            value={selectedNextStatus}
                            onChange={(e) => setSelectedNextStatus(e.target.value as OrderStatus)}
                            disabled={isUpdating}
                            className="flex-grow block w-full sm:w-auto pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md disabled:opacity-70 text-sm"
                        >
                            <option value="" disabled>Select next status...</option>
                            {possibleNextStatuses.map(status => (
                                <option key={status} value={status} className="capitalize">
                                    {status.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleStatusUpdate}
                            disabled={isUpdating || !selectedNextStatus}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             {isUpdating ? (
                                <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                    Updating...
                                </>
                             ) : "Update"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrderCard;
