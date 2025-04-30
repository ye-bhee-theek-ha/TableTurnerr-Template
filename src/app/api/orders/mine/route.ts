// src/app/api/orders/mine/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin'; 
import { withLoginRequired } from '@/utils/withAuth'; 
import { DecodedIdToken } from 'firebase-admin/auth';
import { Order } from '@/constants/types'; 
import { Timestamp } from 'firebase-admin/firestore';

// GET handler to fetch orders for the authenticated user
const handler = async (
    req: NextRequest,
    context: { params: Record<string, string | string[]> },
    user: DecodedIdToken
): Promise<NextResponse<Order[] | { message: string }>> => {

    const userId = user.uid;
    console.log(`GET /api/orders/mine: Fetching orders for user ${userId}`);

    try {
        const ordersQuery = adminDb.collectionGroup('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(50);

        const querySnapshot = await ordersQuery.get();

        const orders: Order[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const orderData: Order = {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date(0).toISOString(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date(0).toISOString(),
                estimatedCompletionTime: (data.estimatedCompletionTime as Timestamp)?.toDate().toISOString() || null,
            } as Order;
            orders.push(orderData);
        });

        console.log(`GET /api/orders/mine: Found ${orders.length} orders for user ${userId}.`);

        return NextResponse.json(orders, { status: 200 });

    } catch (error: any) {
        console.error(`GET /api/orders/mine: Error fetching orders for user ${userId}:`, error);
         // Handle potential Firestore index errors
         if (error.code === 'failed-precondition' && error.message.includes('index')) {
            console.error("Firestore index missing for orders query! Needs index on 'userId' (asc) and 'createdAt' (desc) for collection group 'orders'.");
            return NextResponse.json({ message: 'Internal Server Error: Database configuration issue.' }, { status: 500 });
        }
        return NextResponse.json({ message: 'Failed to fetch orders.', error: error.message }, { status: 500 });
    }
};


export const GET = withLoginRequired(handler);

