// app/api/admin/restaurants/[restaurantId]/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { withStaffAuth } from '@/utils/withAuth';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';


import type { Order } from '@/constants/types';

// TODO: shorten the details of the order object to only what is needed for the response

interface OrderResponse extends Order {
    id: string;
}

// --- GET: List Orders ---
export const GET = withStaffAuth<OrderResponse[] | {}>(
    async (request, context, user) => {
        const { restaurantId } = await context.params;
        const { searchParams } = request.nextUrl;

        // --- Query Parameters for Filtering/Pagination ---
        const status = searchParams.get('status')?.split(','); // e.g., ?status=pending,confirmed
        const limitParam = searchParams.get('limit');
        const sortBy = searchParams.get('sortBy') || 'createdAt'; // Default sort
        const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'; // Default desc

        const limit = limitParam ? parseInt(limitParam, 10) : 25; // Default limit

        console.log(`GET /orders: User ${user.email} fetching orders for restaurant ${restaurantId} with status ${status || 'any'}`);

        try {
            const ordersCollectionRef = adminDb.collection(`Restaurants/${restaurantId}/orders`);
            let query: FirebaseFirestore.Query = ordersCollectionRef;

            // Apply status
            if (status && status.length > 0) {
                // Firestore 'in' query limit is 30 values as of last check
                if (status.length > 30) {
                    return NextResponse.json({ message: 'Too many status values provided for filter (max 30).' }, { status: 400 });
                }
                query = query.where('status', 'in', status);
            }

            // Apply sorting
            query = query.orderBy(sortBy, order);

            // Apply limit
            if (!isNaN(limit) && limit > 0) {
                query = query.limit(limit);
            }

            // Add pagination later if needed (using startAfter/endBefore)

            const querySnapshot = await query.get();
            const orders: OrderResponse[] = [];
            querySnapshot.forEach(doc => {
                const { id, ...data } = doc.data() as Order;
                orders.push({ id: doc.id, ...data });
            });

            return NextResponse.json(orders, { status: 200 });

        } catch (error: any) {
            console.error(`GET /orders: Error fetching orders for restaurant ${restaurantId}:`, error);
             // Check for missing index errors
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                console.error("Firestore index missing! Check the error details in the Firebase console or logs to create the required index (e.g., for status + createdAt).");
                return NextResponse.json({ message: 'Internal Server Error: Database configuration issue (index missing).', error: error.message }, { status: 500 });
            }
            return NextResponse.json({ message: 'Failed to fetch orders.', error: error.message }, { status: 500 });
        }
    }
);
