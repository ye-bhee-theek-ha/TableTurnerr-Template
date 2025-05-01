// src/app/api/admin/restaurants/[restaurantId]/menu/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin'; 
import { withStaffAuth } from '@/utils/withAuth';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
// Ensure Category type is imported if used
import type { MenuItem, RestaurantInfo, category } from '@/constants/types'; 
import { v4 as uuidv4 } from 'uuid'; // For generating category IDs

// --- POST: Add a New Menu Item (Creates Category if not found) ---
export const POST = withStaffAuth<{ success: boolean; message: string; menuItemId?: string }>(
    async (request, context, user) => {
        const { restaurantId } = context.params as { restaurantId: string };
        // Expect categoryId to be the *name* or *ID* of the target category
        let body: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'> & { categoryId: string };

        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
        }

        // --- Validation ---
        if (!restaurantId) return NextResponse.json({ success: false, message: 'Missing Restaurant ID.' }, { status: 400 });
        // categoryId now represents the target category (name or ID)
        if (!body.name || !body.categoryId || !body.price) {
            return NextResponse.json({ success: false, message: 'Missing required fields: name, categoryId, price.' }, { status: 400 });
        }
        const targetCategoryIdentifier = body.categoryId.trim(); // This is the name or ID we look for/create
        if (!targetCategoryIdentifier) {
             return NextResponse.json({ success: false, message: 'Category identifier cannot be empty.' }, { status: 400 });
        }


        console.log(`POST /menu: Staff ${user.uid} adding menu item "${body.name}" to category "${targetCategoryIdentifier}" in restaurant ${restaurantId}`);

        try {
            const restaurantRef = adminDb.doc(`Restaurants/${restaurantId}`);
            const menuCollectionRef = adminDb.collection(`Restaurants/${restaurantId}/menu`);
            const newItemRef = menuCollectionRef.doc(); // Generate new menu item ID
            let categoryExisted = false;

            // Use transaction to add item and update/create category array
            await adminDb.runTransaction(async (transaction) => {
                const restaurantSnap = await transaction.get(restaurantRef);
                if (!restaurantSnap.exists) throw new Error("Restaurant not found.");

                const restaurantData = restaurantSnap.data() as RestaurantInfo;
                let categories = restaurantData.categories || [];
                let targetCategoryId: string; // The actual ID to store on the menu item

                // Try to find existing category by ID or Name
                let categoryIndex = categories.findIndex(cat => cat.name === targetCategoryIdentifier || cat.name === targetCategoryIdentifier);

                if (categoryIndex !== -1) {
                    // --- Category Found ---
                    targetCategoryId = categories[categoryIndex].name;
                    console.log(`Found existing category: ID=${targetCategoryId}, Name=${categories[categoryIndex].name}`);
                    categoryExisted = true;
                    categories = categories.map((cat, index) => {
                        if (index === categoryIndex) {
                            const currentIds = Array.isArray(cat.ids) ? cat.ids : [];
                            if (!currentIds.includes(newItemRef.id)) {
                                return { ...cat, ids: [...currentIds, newItemRef.id] };
                            }
                        }
                        return cat;
                    });
                } else {
                    // --- Category Not Found - Create New One ---

                    console.log(`Category "${targetCategoryIdentifier}" not found. Creating new category.`);
                    const newCategory: category = {
                        name: targetCategoryIdentifier, 
                        ids: [newItemRef.id],
                    };
                    targetCategoryId = newCategory.name;
                    categories = [...categories, newCategory]; 
                }

                // --- Set the new menu item data ---

                transaction.set(newItemRef, {
                    ...body,
                    categoryId: targetCategoryId, 
                    id: newItemRef.id, 
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });

                transaction.update(restaurantRef, {
                    categories: categories, 
                    updatedAt: FieldValue.serverTimestamp()
                });
            });

            const successMessage = categoryExisted
                ? 'Menu item added successfully.'
                : `New category "${targetCategoryIdentifier}" created and menu item added successfully.`;
            return NextResponse.json({ success: true, message: successMessage, menuItemId: newItemRef.id }, { status: 201 });

        } catch (error: any) {
            console.error(`POST /menu: Error adding menu item:`, error);
             if (error.message.includes("not found")) {
                 return NextResponse.json({ success: false, message: error.message }, { status: 404 }); 
            }
            return NextResponse.json({ success: false, message: 'Failed to add menu item.', error: error.message }, { status: 500 });
        }
    }
);
