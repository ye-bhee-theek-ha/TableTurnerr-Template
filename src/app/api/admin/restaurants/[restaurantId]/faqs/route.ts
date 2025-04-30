// src/app/api/admin/restaurants/[restaurantId]/faqs/route.ts (Example Path)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin'; // Adjust path
import { withStaffAuth } from '@/utils/withAuth'; // Use staff/admin auth middleware
import { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { FAQItem } from '@/constants/types'; // Adjust path

// Define the expected request body structure
interface UpdateFaqsRequest {
    faqs: FAQItem[]; // Expect the full new array of FAQs
}

// Define the structure for the response
interface UpdateFaqsResponse {
    success: boolean;
    message: string;
}

// --- PUT Handler to Update/Replace FAQs ---
export const PUT = withStaffAuth<UpdateFaqsResponse>(
    async (request, context, user) => {
        const { restaurantId } = context.params as { restaurantId: string };
        const staffUserId = user.uid;

        // --- Input Validation ---
        if (!restaurantId) {
            return NextResponse.json({ success: false, message: 'Missing Restaurant ID in URL path.' }, { status: 400 });
        }

        let body: UpdateFaqsRequest;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
        }

        // Validate the faqs array structure
        if (!Array.isArray(body.faqs)) {
             return NextResponse.json({ success: false, message: 'Invalid request body: "faqs" must be an array.' }, { status: 400 });
        }

        // Basic validation for each FAQ item
        const isValidFaqs = body.faqs.every(faq =>
            faq && typeof faq.question === 'string' && faq.question.trim() !== '' &&
            typeof faq.answer === 'string' && faq.answer.trim() !== '' &&
            // Ensure each FAQ has a unique ID (or generate one here if needed)
            typeof faq.id === 'string' && faq.id.trim() !== ''
        );
         if (!isValidFaqs) {
             return NextResponse.json({ success: false, message: 'Invalid FAQ item structure. Each FAQ must have non-empty id, question, and answer.' }, { status: 400 });
         }


        console.log(`PUT /faqs: Staff ${staffUserId} updating FAQs for restaurant ${restaurantId}`);

        try {
            const restaurantRef = adminDb.doc(`Restaurants/${restaurantId}`);

            await restaurantRef.update({
                faqs: body.faqs,
                updatedAt: FieldValue.serverTimestamp()
            });

            console.log(`FAQs updated successfully for restaurant ${restaurantId}.`);

            return NextResponse.json({
                success: true,
                message: 'FAQs updated successfully.',
            }, { status: 200 });

        } catch (error: any) {
            console.error(`PUT /faqs: Error updating FAQs for restaurant ${restaurantId}:`, error);
             if (error.code === 5) {
                 return NextResponse.json({ success: false, message: 'Restaurant not found.' }, { status: 404 });
            }
            return NextResponse.json({ success: false, message: 'Failed to update FAQs.', error: error.message }, { status: 500 });
        }
    }
);
