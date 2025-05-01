// src/app/api/admin/restaurants/[restaurantId]/categories/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { withStaffAuth } from '@/utils/withAuth';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { category, RestaurantInfo } from '@/constants/types';

// --- POST: Add a New Category ---
export const POST = withStaffAuth<{ success: boolean; message: string; newCategory?: category }>(
    async (request, context, user) => {
        const { restaurantId } = context.params as { restaurantId: string };
        let body: { name: string };

        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
        }

        const { name } = body;
        const trimmedName = name?.trim();

        if (!restaurantId) return NextResponse.json({ success: false, message: 'Missing Restaurant ID.' }, { status: 400 });
        if (!trimmedName) return NextResponse.json({ success: false, message: 'Category name is required.' }, { status: 400 });

        console.log(`POST /categories: Staff ${user.uid} adding category "${trimmedName}" to restaurant ${restaurantId}`);

        try {
            const restaurantRef = adminDb.doc(`Restaurants/${restaurantId}`);

            // Use a transaction to read existing categories and add the new one
            const newCategory = await adminDb.runTransaction(async (transaction) => {
                const restaurantSnap = await transaction.get(restaurantRef);
                if (!restaurantSnap.exists) {
                    throw new Error("Restaurant not found."); // Will result in 404 below
                }
                const restaurantData = restaurantSnap.data() as RestaurantInfo;
                const existingCategories = restaurantData.categories || [];

                // Check for duplicate name (case-insensitive)
                if (existingCategories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
                    throw new Error(`Category "${trimmedName}" already exists.`);
                }

                const categoryToAdd: category = {
                    name: trimmedName,
                    ids: [],
                };

                const updatedCategories = [...existingCategories, categoryToAdd];
                transaction.update(restaurantRef, {
                    categories: updatedCategories,
                    updatedAt: FieldValue.serverTimestamp()
                });

                return categoryToAdd; 
            });

            return NextResponse.json({ success: true, message: 'Category added successfully.', newCategory }, { status: 201 });

        } catch (error: any) {
            console.error(`POST /categories: Error adding category:`, error);
            if (error.message === "Restaurant not found.") {
                 return NextResponse.json({ success: false, message: error.message }, { status: 404 });
            }
            if (error.message.includes("already exists")) {
                 return NextResponse.json({ success: false, message: error.message }, { status: 409 }); // Conflict
            }
            return NextResponse.json({ success: false, message: 'Failed to add category.', error: error.message }, { status: 500 });
        }
    }
);

// --- NOTE: DELETE and PUT routes should be in a dynamic route file ---
// --- Create: src/app/api/admin/restaurants/[restaurantId]/categories/[categoryId]/route.ts ---

