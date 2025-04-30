// app/api/restaurants/[restaurantId]/menu/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import type { MenuItem } from '@/constants/types';


// --- GET Handler ---

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ restaurantId: string }> }

): Promise<NextResponse<MenuItem[] | { message: string }>> {

    const { restaurantId } = await params;

    // --- Input Validation ---
    if (!restaurantId || typeof restaurantId !== 'string') {
        return NextResponse.json({ message: 'Invalid restaurant ID provided.' }, { status: 400 });
    }

    console.log(`Fetching all available menu items for restaurant: ${restaurantId}`);

    try {
        // --- Database Query ---
        const menuCollectionRef = adminDb.collection(`Restaurants/${restaurantId}/menu`);

        const menuQuery = menuCollectionRef
            // .where('isAvailable', '==', true)

        const querySnapshot = await menuQuery.get();

        // --- Data Transformation ---
        const menuItems: MenuItem[] = [];
        querySnapshot.forEach((doc) => {
            menuItems.push({
                id: doc.id,
                ...(doc.data() as Omit<MenuItem, 'id'>),
            });
        });

        console.log(`Fetched ${menuItems.length} available menu items for restaurant ${restaurantId}.`);

        // --- Success Response with Caching ---
        return NextResponse.json(menuItems, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });

    } catch (error: any) {
        // --- Error Handling ---
        console.error(`Error fetching menu items for restaurant ${restaurantId}:`, error);
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
             console.error("Firestore index missing! Check the error details in the Firebase console or logs to create the required index.");
             return NextResponse.json({ message: 'Internal Server Error: Database configuration issue (index missing).', error: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: 'Failed to fetch menu items.', error: error.message }, { status: 500 });
    }
}
