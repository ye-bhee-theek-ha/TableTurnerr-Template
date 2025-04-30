// app/api/user/likes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { withLoginRequired } from '@/utils/withAuth';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore'; 


// Define the structure for PUT/DELETE request body
interface LikeRequestBody {
    restaurantId: string;
    menuItemId: string;
}

// --- GET Handler ---

export const GET = withLoginRequired<string[] | { message: string }>(
    async (request, context, user) => {

        const userId = user.uid;

        // Get restaurantId from Query Parameters  : /api/user/likes?restaurantId=your-restaurant-id
        const { searchParams } = request.nextUrl;
        const restaurantId = searchParams.get('restaurantId');

        // Input Validation
        if (!restaurantId) {
            return NextResponse.json({ message: 'Missing required query parameter: restaurantId' }, { status: 400 });
        }

        console.log(`GET /api/user/likes: Fetching liked items for user ${userId} in restaurant ${restaurantId}`);

        try {
            // likes are stored within an array field named 'likedMenuItems'.
            const userDocRef = adminDb.doc(`Restaurants/${restaurantId}/users/${userId}`);
            const userDocSnap = await userDocRef.get();

            let likedItemIds: string[] = [];

            if (userDocSnap.exists) {
                likedItemIds = userDocSnap.data()?.likedMenuItems || [];
            } else {
                console.warn(`No user document found at Restaurants/${restaurantId}/users/${userId}. Returning empty likes array.`);
            }

            console.log(`GET /api/user/likes: Found ${likedItemIds.length} liked items for user ${userId} in restaurant ${restaurantId}.`);

            return NextResponse.json(likedItemIds, { status: 200 });

        } catch (error: any) {
            console.error(`GET /api/user/likes: Error fetching liked items for user ${userId}, restaurant ${restaurantId}:`, error);
            return NextResponse.json({ message: 'Failed to fetch liked items.', error: error.message }, { status: 500 });
        }
    }
);

// --- PUT Handler ---

export const PUT = withLoginRequired<{ success: boolean; message?: string }>(
    async (request, context, user) => {
        const userId = user.uid;

        try {

            // --- restaurantId and menuItemId from Request Body ---
            const body: LikeRequestBody = await request.json();
            const { restaurantId, menuItemId } = body;

            // --- Input Validation ---
            if (!restaurantId || !menuItemId) {
                return NextResponse.json({ success: false, message: 'Missing required fields: restaurantId and menuItemId in request body.' }, { status: 400 });
            }

            console.log(`PUT /api/user/likes: User ${userId} liking item ${menuItemId} in restaurant ${restaurantId}`);

            const userDocRef = adminDb.doc(`Restaurants/${restaurantId}/users/${userId}`);

            await userDocRef.update({
                likedMenuItems: FieldValue.arrayUnion(menuItemId)
            });

            console.log(`PUT /api/user/likes: Successfully added like for user ${userId}, item ${menuItemId}.`);

            // --- Success Response ---
            return NextResponse.json({ success: true, message: 'Item liked successfully.' }, { status: 200 });

        } catch (error: any) {
            if (error instanceof SyntaxError) {
                return NextResponse.json({ success: false, message: 'Invalid JSON in request body.' }, { status: 400 });
            }
            console.error(`PUT /api/user/likes: Error liking item for user ${userId}:`, error);
            return NextResponse.json({ success: false, message: 'Failed to like item.', error: error.message }, { status: 500 });
        }
    }
);

// --- DELETE Handler ---

export const DELETE = withLoginRequired<{ success: boolean; message?: string }>(
    async (request, context, user) => {
        const userId = user.uid;

        try {
            // --- Get restaurantId and menuItemId from Request Body ---
            const body: LikeRequestBody = await request.json();
            const { restaurantId, menuItemId } = body;

            // --- Input Validation ---
            if (!restaurantId || !menuItemId) {
                return NextResponse.json({ success: false, message: 'Missing required fields: restaurantId and menuItemId in request body.' }, { status: 400 });
            }

            console.log(`DELETE /api/user/likes: User ${userId} unliking item ${menuItemId} in restaurant ${restaurantId}`);

            // --- Database Update ---
            const userDocRef = adminDb.doc(`Restaurants/${restaurantId}/users/${userId}`);

            await userDocRef.update({
                likedMenuItems: FieldValue.arrayRemove(menuItemId)
            });

            console.log(`DELETE /api/user/likes: Successfully removed like for user ${userId}, item ${menuItemId}.`);

            // --- Success Response ---
            return NextResponse.json({ success: true, message: 'Item unliked successfully.' }, { status: 200 });

        } catch (error: any) {
            if (error instanceof SyntaxError) {
                return NextResponse.json({ success: false, message: 'Invalid JSON in request body.' }, { status: 400 });
            }
            console.error(`DELETE /api/user/likes: Error unliking item for user ${userId}:`, error);
            return NextResponse.json({ success: false, message: 'Failed to unlike item.', error: error.message }, { status: 500 });
        }
    }
);
