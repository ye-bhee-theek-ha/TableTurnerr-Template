// src/app/api/admin/restaurants/[restaurantId]/categories/[categoryName]/route.ts
// Note: The dynamic parameter in the filename should match the parameter name used below (categoryName)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin'; // Adjust path
import { withStaffAuth } from '@/utils/withAuth'; // Adjust path
import { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
// Corrected type import to lowercase 'category' and removed unused MenuItem
import type { category, RestaurantInfo } from '@/constants/types'; // Adjust path

// --- DELETE: Remove a Category by Name ---
export const DELETE = withStaffAuth<{ success: boolean; message: string }>(
    async (request, context, user) => {
        // Use categoryName from the route parameters
        const { restaurantId, categoryName: encodedCategoryName } = context.params as { restaurantId: string; categoryName: string };
        // Decode the category name from the URL parameter
        const categoryName = decodeURIComponent(encodedCategoryName || '');


        if (!restaurantId || !categoryName) {
            return NextResponse.json({ success: false, message: 'Missing Restaurant ID or Category Name.' }, { status: 400 });
        }

        // Prevent deleting essential categories if needed
        if (categoryName.toLowerCase() === 'popular') {
             return NextResponse.json({ success: false, message: "Cannot delete the 'Popular' category." }, { status: 400 });
        }

        console.log(`DELETE /categories/${categoryName}: Staff ${user.uid} deleting category from restaurant ${restaurantId}`);

        try {
            const restaurantRef = adminDb.doc(`Restaurants/${restaurantId}`);
            const menuCollectionRef = adminDb.collection(`Restaurants/${restaurantId}/menu`);

            // Use a transaction to ensure atomicity
            await adminDb.runTransaction(async (transaction) => {
                const restaurantSnap = await transaction.get(restaurantRef);
                if (!restaurantSnap.exists) {
                    throw new Error("Restaurant not found.");
                }
                const restaurantData = restaurantSnap.data() as RestaurantInfo;
                const categories = restaurantData.categories || [];

                // Find the category by name (case-sensitive match recommended for consistency)
                const categoryExists = categories.some(cat => cat.name === categoryName);
                if (!categoryExists) {
                    throw new Error(`Category "${categoryName}" not found.`);
                }

                // 1. Remove the category from the array by filtering based on name
                const updatedCategories = categories.filter(cat => cat.name !== categoryName);
                transaction.update(restaurantRef, {
                    categories: updatedCategories,
                    updatedAt: FieldValue.serverTimestamp()
                });

                // 2. Update menu items that belonged to this category (set categoryId/name to null)
                // NOTE: This assumes menu items store the category *name* in a field like `categoryName` or `categoryId`.
                // Adjust the 'where' clause field ('categoryId' or 'categoryName') based on your MenuItem structure.
                console.log(`Updating menu items previously in category "${categoryName}"...`);
                const itemsToUpdateQuery = menuCollectionRef.where('categoryName', '==', categoryName); // Adjust field if necessary
                const itemsToUpdateSnap = await transaction.get(itemsToUpdateQuery); // Read within transaction

                itemsToUpdateSnap.forEach(doc => {
                    // Set the category reference field to null
                    transaction.update(doc.ref, { categoryName: null }); // Adjust field if necessary
                });
                console.log(`Updated ${itemsToUpdateSnap.size} menu items.`);
            });

            return NextResponse.json({ success: true, message: `Category "${categoryName}" deleted successfully.` }, { status: 200 });

        } catch (error: any) {
            console.error(`DELETE /categories/${categoryName}: Error deleting category:`, error);
            if (error.message.includes("not found")) {
                 return NextResponse.json({ success: false, message: error.message }, { status: 404 });
            }
            return NextResponse.json({ success: false, message: 'Failed to delete category.', error: error.message }, { status: 500 });
        }
    }
);

// --- PUT: Rename a Category ---
export const PUT = withStaffAuth<{ success: boolean; message: string }>(
    async (request, context, user) => {
        // Use categoryName from route parameters
        const { restaurantId, categoryName: encodedOldCategoryName } = context.params as { restaurantId: string; categoryName: string };
        const oldCategoryName = decodeURIComponent(encodedOldCategoryName || '');

        let body: { name: string }; // Expecting the new name in the body

        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
        }

        const { name: newName } = body;
        const newTrimmedName = newName?.trim();

        if (!restaurantId || !oldCategoryName) return NextResponse.json({ success: false, message: 'Missing Restaurant ID or current Category Name.' }, { status: 400 });
        if (!newTrimmedName) return NextResponse.json({ success: false, message: 'New category name is required.' }, { status: 400 });
        if (newTrimmedName === oldCategoryName) return NextResponse.json({ success: true, message: 'Category name is the same, no update needed.' }, { status: 200 });

        // Prevent renaming essential categories if needed
        if (oldCategoryName.toLowerCase() === 'popular') {
             return NextResponse.json({ success: false, message: "Cannot rename the 'Popular' category." }, { status: 400 });
        }

        console.log(`PUT /categories/${oldCategoryName}: Staff ${user.uid} renaming category to "${newTrimmedName}" in restaurant ${restaurantId}`);

        try {
            const restaurantRef = adminDb.doc(`Restaurants/${restaurantId}`);
            const menuCollectionRef = adminDb.collection(`Restaurants/${restaurantId}/menu`);

            await adminDb.runTransaction(async (transaction) => {
                const restaurantSnap = await transaction.get(restaurantRef);
                if (!restaurantSnap.exists) throw new Error("Restaurant not found.");

                const restaurantData = restaurantSnap.data() as RestaurantInfo;
                const categories = restaurantData.categories || [];
                const categoryIndex = categories.findIndex(cat => cat.name === oldCategoryName); // Find by old name

                if (categoryIndex === -1) throw new Error(`Category "${oldCategoryName}" not found.`);

                // Check if new name already exists (case-insensitive)
                if (categories.some(cat => cat.name.toLowerCase() === newTrimmedName.toLowerCase())) {
                    throw new Error(`Another category with the name "${newTrimmedName}" already exists.`);
                }

                // 1. Update the name in the categories array
                const updatedCategories = categories.map((cat, index) =>
                    index === categoryIndex ? { ...cat, name: newTrimmedName } : cat
                );
                transaction.update(restaurantRef, {
                    categories: updatedCategories,
                    updatedAt: FieldValue.serverTimestamp()
                });

                // 2. Update category reference on associated Menu Items
                // This assumes menu items store the category *name*. Adjust field ('categoryId' or 'categoryName') as needed.
                console.log(`Updating menu items from category "${oldCategoryName}" to "${newTrimmedName}"...`);
                const itemsToUpdateQuery = menuCollectionRef.where('categoryName', '==', oldCategoryName); // Adjust field if necessary
                const itemsToUpdateSnap = await transaction.get(itemsToUpdateQuery);

                itemsToUpdateSnap.forEach(doc => {
                    transaction.update(doc.ref, { categoryName: newTrimmedName }); // Adjust field if necessary
                });
                 console.log(`Updated ${itemsToUpdateSnap.size} menu items.`);
            });

            return NextResponse.json({ success: true, message: 'Category renamed successfully.' }, { status: 200 });

        } catch (error: any) {
             console.error(`PUT /categories/${oldCategoryName}: Error renaming category:`, error);
            if (error.message.includes("not found")) {
                 return NextResponse.json({ success: false, message: error.message }, { status: 404 });
            }
             if (error.message.includes("already exists")) {
                 return NextResponse.json({ success: false, message: error.message }, { status: 409 }); // Conflict
            }
            return NextResponse.json({ success: false, message: 'Failed to rename category.', error: error.message }, { status: 500 });
        }
    }
);
