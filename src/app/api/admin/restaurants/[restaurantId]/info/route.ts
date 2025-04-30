// src/app/api/admin/restaurants/[restaurantId]/info/route.ts 

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin'; 
import { withStaffAuth } from '@/utils/withAuth'; 
import { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { RestaurantInfo } from '@/constants/types'; 

type UpdateInfoRequest = Partial<{
    name: string;
    description: string;
    location: string;
    contact: {
        email: string;
        phone: string;
    };
    openingHours: { day: string; timing: string }[]; 
    social: { 
        facebook: string;
        instagram: string;
    };
    OpeningTime?: string; 
}>;


// Define the structure for the response
interface UpdateInfoResponse {
    success: boolean;
    message: string;
}

// --- PUT Handler to Update Restaurant Info ---
export const PUT = withStaffAuth<UpdateInfoResponse>(
    async (request, context, user) => {
        const { restaurantId } = context.params as { restaurantId: string };
        const staffUserId = user.uid;

        // --- Input Validation ---
        if (!restaurantId) {
            return NextResponse.json({ success: false, message: 'Missing Restaurant ID in URL path.' }, { status: 400 });
        }

        let body: UpdateInfoRequest;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
        }

        if (typeof body !== 'object' || body === null || Object.keys(body).length === 0) {
             return NextResponse.json({ success: false, message: 'Invalid request body: Must be a non-empty object.' }, { status: 400 });
        }

        console.log(`PUT /info: Staff ${staffUserId} updating info for restaurant ${restaurantId}`);

        try {
            const restaurantRef = adminDb.doc(`Restaurants/${restaurantId}`);

            // --- Prepare Update Data (Filter out empty/null values) ---
            const updateData: { [key: string]: any } = {};

            if (body.name && body.name.trim() !== '') {
                updateData['info.name'] = body.name.trim();
            }

            if (typeof body.description === 'string') {
                 updateData['info.description'] = body.description;
            }
             if (typeof body.location === 'string') {
                 updateData['info.location'] = body.location;
            }
             if (typeof body.OpeningTime === 'string') {
                 updateData['info.OpeningTime'] = body.OpeningTime;
            }

            // --- Handle Nested 'contact' Object ---
            if (body.contact) {
                if (body.contact.email && body.contact.email.trim() !== '') {
                    updateData['info.contact.email'] = body.contact.email.trim();
                }
                if (body.contact.phone && body.contact.phone.trim() !== '') {
                    updateData['info.contact.phone'] = body.contact.phone.trim();
                }
            }

            // --- Handle 'openingHours' Array ---
            if (Array.isArray(body.openingHours)) {
                 const validHours = body.openingHours.filter(h =>
                     typeof h.day === 'string' && h.day.trim() !== '' &&
                     typeof h.timing === 'string' && h.timing.trim() !== ''
                 );
                 if (validHours.length > 0) {
                     updateData['info.openingHours'] = validHours;
                 }
            }

            // --- Handle Nested 'social' Object ---
             if (body.social) {
                 // Allow setting empty strings to clear links
                if (typeof body.social.facebook === 'string') {
                    updateData['info.social.facebook'] = body.social.facebook.trim();
                }
                 if (typeof body.social.instagram === 'string') {
                    updateData['info.social.instagram'] = body.social.instagram.trim();
                }
                // Add other social platforms here
            }


            // --- Check if any updates are actually being made ---
            if (Object.keys(updateData).length === 0) {
                 return NextResponse.json({ success: true, message: 'No changes detected to save.' }, { status: 200 });
            }

            // Always update the main document's updatedAt timestamp
            updateData['updatedAt'] = FieldValue.serverTimestamp();

            // --- Database Update ---
            console.log("Applying updates to Firestore:", updateData);
            await restaurantRef.update(updateData);

            console.log(`Info updated successfully for restaurant ${restaurantId}.`);

            // --- Success Response ---
            return NextResponse.json({
                success: true,
                message: 'Restaurant information updated successfully.',
            }, { status: 200 });

        } catch (error: any) {
            console.error(`PUT /info: Error updating info for restaurant ${restaurantId}:`, error);
             if (error.code === 5) { // Firestore code for NOT_FOUND
                 return NextResponse.json({ success: false, message: 'Restaurant not found.' }, { status: 404 });
            }
            return NextResponse.json({ success: false, message: 'Failed to update restaurant information.', error: error.message }, { status: 500 });
        }
    }
);
