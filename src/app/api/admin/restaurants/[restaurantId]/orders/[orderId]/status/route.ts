// src/app/api/admin/restaurants/[restaurantId]/orders/[orderId]/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin'; // Adjust path
import { withStaffAuth } from '@/utils/withAuth'; // Use staff/admin auth middleware
import { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { OrderStatus, Order } from '@/constants/types'; // Adjust path

// Define the expected request body structure
interface UpdateStatusRequest {
    status: OrderStatus;
    estimatedCompletionTime?: string | null;
}

// Define the structure for the response
interface UpdateStatusResponse {
    success: boolean;
    message: string;
    updatedOrder?: Order; // Optionally return the updated order
}

// --- PUT Handler to Update Order Status ---
// Using PUT implies replacing the status, PATCH could also be used
export const PUT = withStaffAuth<UpdateStatusResponse>(
    async (request, context, user) => {
        const { restaurantId, orderId } = context.params as { restaurantId: string; orderId: string };
        const staffUserId = user.uid; // ID of the staff member making the change

        // --- Input Validation ---
        if (!orderId) {
            return NextResponse.json({ success: false, message: 'Missing Order ID in URL path.' }, { status: 400 });
        }
        if (!restaurantId) {
            return NextResponse.json({ success: false, message: 'Missing Restaurant ID in URL path.' }, { status: 400 });
        }

        let body: UpdateStatusRequest;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
        }

        const { status, estimatedCompletionTime } = body;

        // Validate the status value
        const validStatuses: OrderStatus[] = [
            'pending', 'confirmed', 'preparing', 'ready_for_pickup',
            'out_for_delivery', 'delivered', 'completed_pickup',
            'cancelled_by_user', 'rejected_by_restaurant'
        ];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json({ success: false, message: `Invalid status provided. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
        }

        // Validate estimatedCompletionTime if provided (must be a valid ISO date string)
        let completionTimestamp: Date | null = null;
        if (estimatedCompletionTime) {
            completionTimestamp = new Date(estimatedCompletionTime);
            if (isNaN(completionTimestamp.getTime())) {
                 return NextResponse.json({ success: false, message: 'Invalid format for estimatedCompletionTime. Use ISO 8601 format.' }, { status: 400 });
            }
        }


        console.log(`PUT /status: Staff ${staffUserId} updating order ${orderId} in restaurant ${restaurantId} to status: ${status}`);

        try {
            const orderRef = adminDb.doc(`Restaurants/${restaurantId}/orders/${orderId}`);

            // --- Prepare Update Data ---
            const updateData: { status: OrderStatus; updatedAt: FieldValue; handledByStaffId: string; estimatedCompletionTime?: Date | null | FieldValue } = {
                status: status,
                updatedAt: FieldValue.serverTimestamp(),
                handledByStaffId: staffUserId, // Track which staff member updated
            };

            // Add estimated time only if provided and valid
            if (completionTimestamp !== null) {
                updateData.estimatedCompletionTime = completionTimestamp;
            } else if (estimatedCompletionTime === null) {
                // Allow explicitly setting it to null
                updateData.estimatedCompletionTime = null;
            }


            // --- Database Update ---
            // Use update to only change specified fields
            await orderRef.update(updateData);

            console.log(`Order ${orderId} status updated successfully to ${status}.`);

            // --- Optional: Fetch updated order to return ---
            // const updatedSnap = await orderRef.get();
            // const updatedOrderData = { id: updatedSnap.id, ...updatedSnap.data() } as Order;
            // // Convert timestamps for response
            // updatedOrderData.createdAt = (updatedOrderData.createdAt as Timestamp)?.toDate().toISOString();
            // updatedOrderData.updatedAt = (updatedOrderData.updatedAt as Timestamp)?.toDate().toISOString();
            // updatedOrderData.estimatedCompletionTime = (updatedOrderData.estimatedCompletionTime as Timestamp)?.toDate().toISOString() || null;


            // --- Success Response ---
            return NextResponse.json({
                success: true,
                message: `Order status updated to ${status}.`,
                // updatedOrder: updatedOrderData // Optionally return updated order
            }, { status: 200 });

        } catch (error: any) {
            console.error(`PUT /status: Error updating order ${orderId} status:`, error);
            // Handle potential "not found" errors during update
            if (error.code === 5) { // Firestore code for NOT_FOUND
                 return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
            }
            return NextResponse.json({ success: false, message: 'Failed to update order status.', error: error.message }, { status: 500 });
        }
    }
);
