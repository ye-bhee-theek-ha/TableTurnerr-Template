// File: app/api/admin/restaurants/[restaurantId]/orders/[orderId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { withStaffAuth } from '@/utils/withAuth';
import type { Order } from '@/constants/types';

// Define the structure for the response
interface OrderResponse extends Order {
    id: string;
}

// --- GET: Get Specific Order ---

export const GET = withStaffAuth<OrderResponse | {}>(
    async (request, context, user) => {
        const { restaurantId, orderId } = context.params;

        // --- Input Validation ---
        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json({ message: 'Invalid or missing Order ID in URL path.' }, { status: 400 });
        }
         if (!restaurantId || typeof restaurantId !== 'string') {
             return NextResponse.json({ message: 'Invalid or missing Restaurant ID in URL path.' }, { status: 400 });
         }


        console.log(`GET /api/admin/restaurants/${restaurantId}/orders/${orderId}: User ${user.email} fetching order details.`);

        try {
            // --- Database Fetch ---
            const orderRef = adminDb.doc(`Restaurants/${restaurantId}/orders/${orderId}`);
            const orderSnap = await orderRef.get();

            // --- Handle Not Found ---
            if (!orderSnap.exists) {
                console.log(`Order ${orderId} not found in restaurant ${restaurantId}.`);
                return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
            }

            // --- Prepare Response ---
            const { id, ...orderDetails } = orderSnap.data() as Order;
            const orderData = {
                id: orderSnap.id,
                ...orderDetails
            };

            console.log(`Successfully fetched order ${orderId}.`);

            // --- Success Response ---
            return NextResponse.json(orderData, { status: 200 });

        } catch (error: any) {
             console.error(`GET /api/admin/restaurants/${restaurantId}/orders/${orderId}: Error fetching order:`, error);
             return NextResponse.json({ message: 'Failed to fetch order details.', error: error.message }, { status: 500 });
        }
    }
);

// Note: PUT/PATCH for full order update or DELETE could be added here if needed,
// but often only status updates are required via a separate endpoint.
