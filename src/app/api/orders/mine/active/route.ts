// src/app/api/orders/mine/active/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin'; // Adjust path
import { withLoginRequired } from '@/utils/withAuth'; // Adjust path
import { DecodedIdToken } from 'firebase-admin/auth';
import { Order, OrderStatus } from '@/constants/types'; // Adjust path
import { Timestamp } from 'firebase-admin/firestore';

const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'];

const handler = async (
    req: NextRequest,
    context: { params: Record<string, string | string[]> },
    user: DecodedIdToken
): Promise<NextResponse<Order[] | { message: string }>> => {

    const userId = user.uid;
    console.log(`GET /api/orders/mine/active: Fetching ACTIVE orders for user ${userId}`);

    try {
        const ordersQuery = adminDb.collectionGroup('orders')
            .where('userId', '==', userId)
            .where('status', 'in', ACTIVE_ORDER_STATUSES)
            .orderBy('createdAt', 'desc')
            .limit(10);

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

        console.log(`GET /api/orders/mine/active: Found ${orders.length} active orders for user ${userId}.`);

        return NextResponse.json(orders, { status: 200 });

    } catch (error: any) {
        console.error(`GET /api/orders/mine/active: Error fetching active orders for user ${userId}:`, error);
         if (error.code === 'failed-precondition' && error.message.includes('index')) {
            console.error("Firestore index missing for active orders query! Needs index on 'userId' (asc), 'status' (in), and 'createdAt' (desc) for collection group 'orders'.");
            return NextResponse.json({ message: 'Internal Server Error: Database configuration issue.' }, { status: 500 });
        }
        return NextResponse.json({ message: 'Failed to fetch active orders.', error: error.message }, { status: 500 });
    }
};

export const GET = withLoginRequired(handler);
