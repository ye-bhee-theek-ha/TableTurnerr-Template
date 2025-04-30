// app/api/restaurants/[restaurantId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import type { RestaurantInfo, MenuItem } from '@/constants/types';
import { FieldValue } from 'firebase-admin/firestore';


// API response structure
interface RestaurantPublicDataResponse {
    restaurantInfo: RestaurantInfo | null;
    popularItems: MenuItem[];
}

// --- Configuration ---
const POPULAR_CATEGORY_NAME = "Popular"; 
const MAX_POPULAR_ITEMS = 10;

// --- GET Handler ---
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ restaurantId: string }> }
): Promise<NextResponse<RestaurantPublicDataResponse | { message: string }>> {

    const { restaurantId } = await params;

    // --- Input Validation ---
    if (!restaurantId || typeof restaurantId !== 'string') {
        return NextResponse.json({ message: 'Invalid restaurant ID provided.' }, { status: 400 });
    }

    console.log(`Fetching public data for restaurant: ${restaurantId}`);

    try {
        // --- Fetch Restaurant Info ---
        const restaurantRef = adminDb.doc(`Restaurants/${restaurantId}`);
        const restaurantSnap = await restaurantRef.get();

        if (!restaurantSnap.exists) {
            console.log(`Restaurant ${restaurantId} not found.`);
            return NextResponse.json({ message: 'Restaurant not found.' }, { status: 404 });
        }

        const restaurantInfo = restaurantSnap.data() as RestaurantInfo;

        const popularCategory = restaurantInfo.categories?.find(
            cat => cat.name === POPULAR_CATEGORY_NAME
        );

        let popularCategoryId: string | null = null;

        if (popularCategory && 'name' in popularCategory) {
            // name is the id
             popularCategoryId = (popularCategory as any).name;

        } else {
            console.warn(`"${POPULAR_CATEGORY_NAME}" category not found or missing 'id' field for restaurant ${restaurantId}.`);
        }


        // --- Fetch Popular Menu Items (if category found) ---
        let popularItems: MenuItem[] = [];
        if (popularCategoryId) {
            const menuCollectionRef = adminDb.collection(`Restaurants/${restaurantId}/menu`);
            const popularItemsQuery = menuCollectionRef
                .where('categoryId', '==', popularCategoryId)
                .where('isAvailable', '==', true)
                .orderBy('name', 'asc') 
                .limit(MAX_POPULAR_ITEMS);

            const popularItemsSnap = await popularItemsQuery.get();

            popularItemsSnap.forEach((doc) => {
                popularItems.push({
                    id: doc.id,
                    ...(doc.data() as Omit<MenuItem, 'id'>),
                });
            });
            console.log(`Fetched ${popularItems.length} popular menu items.`);
        }

        const responseData: RestaurantPublicDataResponse = {
            restaurantInfo: restaurantInfo,
            popularItems: popularItems,
        };

        // --- Success Response ---
        // --- Industry Practice: Caching Headers ---
        // For public, relatively static data, add caching headers.
        // 's-maxage' is for shared caches (like CDNs), 'stale-while-revalidate' allows serving stale data
        // while fetching fresh data in the background. Adjust times as needed.

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });

    } catch (error: any) {
        console.error(`Error fetching public data for restaurant ${restaurantId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch restaurant data.', error: error.message }, { status: 500 });
    }
}
