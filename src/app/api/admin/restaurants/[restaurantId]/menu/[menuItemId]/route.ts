// src/app/api/admin/restaurants/[restaurantId]/menu/[menuItemId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin'; 
import { withStaffAuth } from '@/utils/withAuth'; 
import { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { MenuItem, RestaurantInfo } from '@/constants/types'; 

// --- PUT: Update an Existing Menu Item ---
export const PUT = withStaffAuth<{ success: boolean; message: string }>(
    async (request, context, user) => {
        const { restaurantId, menuItemId } = context.params as { restaurantId: string; menuItemId: string };
        let body: Partial<Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>>; // Allow partial updates

        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
        }

        if (!restaurantId || !menuItemId) return NextResponse.json({ success: false, message: 'Missing Restaurant or Menu Item ID.' }, { status: 400 });
        if (Object.keys(body).length === 0) return NextResponse.json({ success: false, message: 'No fields provided for update.' }, { status: 400 });

        console.log(`PUT /menu/${menuItemId}: Staff ${user.uid} updating menu item in restaurant ${restaurantId}`);

        try {
            const restaurantRef = adminDb.doc(`Restaurants/${restaurantId}`);
            const menuItemRef = adminDb.doc(`Restaurants/${restaurantId}/menu/${menuItemId}`);

            await adminDb.runTransaction(async (transaction) => {
                const restaurantSnap = await transaction.get(restaurantRef);
                const menuItemSnap = await transaction.get(menuItemRef);

                if (!restaurantSnap.exists) throw new Error("Restaurant not found.");
                if (!menuItemSnap.exists) throw new Error("Menu item not found.");

                const restaurantData = restaurantSnap.data() as RestaurantInfo;
                const currentItemData = menuItemSnap.data() as MenuItem;
                const categories = restaurantData.categories || [];
                const newCategoryId = body.categoryId; 
                const oldCategoryId = currentItemData.categoryId;
                let updatedCategories = [...categories];

                // --- Handle Category Change ---
                if (newCategoryId && newCategoryId !== oldCategoryId) {
                    console.log(`Category changed for item ${menuItemId}: ${oldCategoryId} -> ${newCategoryId}`);
                    if (!categories.some(cat => cat.name === newCategoryId)) {
                        throw new Error(`New category ID "${newCategoryId}" not found.`);
                    }

                    updatedCategories = categories.map(cat => {
                        // Remove item ID from old category
                        if (cat.name === oldCategoryId) {
                            return { ...cat, ids: (cat.ids || []).filter(id => id !== menuItemId) };
                        }
                        // Add item ID to new category (if not already present)
                        if (cat.name === newCategoryId) {
                            const currentIds = Array.isArray(cat.ids) ? cat.ids : [];
                            if (!currentIds.includes(menuItemId)) {
                                return { ...cat, ids: [...currentIds, menuItemId] };
                            }
                        }
                        return cat;
                    });
                    // Update the categories array in the restaurant document
                    transaction.update(restaurantRef, {
                        categories: updatedCategories,
                        updatedAt: FieldValue.serverTimestamp()
                    });
                }

                // --- Update Menu Item Document ---
                transaction.update(menuItemRef, {
                    ...body,
                    updatedAt: FieldValue.serverTimestamp(),
                });
            });

            return NextResponse.json({ success: true, message: 'Menu item updated successfully.' }, { status: 200 });

        } catch (error: any) {
            console.error(`PUT /menu/${menuItemId}: Error updating menu item:`, error);
            if (error.message.includes("not found")) {
                 return NextResponse.json({ success: false, message: error.message }, { status: 404 });
            }
            return NextResponse.json({ success: false, message: 'Failed to update menu item.', error: error.message }, { status: 500 });
        }
    }
);

// --- DELETE: Remove a Menu Item ---
export const DELETE = withStaffAuth<{ success: boolean; message: string }>(
    async (request, context, user) => {
        const { restaurantId, menuItemId } = context.params as { restaurantId: string; menuItemId: string };

        if (!restaurantId || !menuItemId) return NextResponse.json({ success: false, message: 'Missing Restaurant or Menu Item ID.' }, { status: 400 });

        console.log(`DELETE /menu/${menuItemId}: Staff ${user.uid} deleting menu item from restaurant ${restaurantId}`);

        try {
            const restaurantRef = adminDb.doc(`Restaurants/${restaurantId}`);
            const menuItemRef = adminDb.doc(`Restaurants/${restaurantId}/menu/${menuItemId}`);

            await adminDb.runTransaction(async (transaction) => {
                 const restaurantSnap = await transaction.get(restaurantRef);
                 const menuItemSnap = await transaction.get(menuItemRef);

                 if (!restaurantSnap.exists) throw new Error("Restaurant not found.");
                 if (!menuItemSnap.exists) throw new Error("Menu item not found.");

                 const restaurantData = restaurantSnap.data() as RestaurantInfo;
                 const itemData = menuItemSnap.data() as MenuItem;
                 const categoryId = itemData.categoryId;

                 transaction.delete(menuItemRef);

                 if (categoryId) {
                     const categories = restaurantData.categories || [];
                     const updatedCategories = categories.map(cat => {
                         if (cat.name === categoryId) {
                             return { ...cat, ids: (cat.ids || []).filter(id => id !== menuItemId) };
                         }
                         return cat;
                     });
                     transaction.update(restaurantRef, {
                         categories: updatedCategories,
                         updatedAt: FieldValue.serverTimestamp()
                     });
                 } else {
                      transaction.update(restaurantRef, { updatedAt: FieldValue.serverTimestamp() });
                 }
            });

             return NextResponse.json({ success: true, message: 'Menu item deleted successfully.' }, { status: 200 });

        } catch (error: any) {
             console.error(`DELETE /menu/${menuItemId}: Error deleting menu item:`, error);
             if (error.message.includes("not found")) {
                 return NextResponse.json({ success: false, message: error.message }, { status: 404 });
            }
            return NextResponse.json({ success: false, message: 'Failed to delete menu item.', error: error.message }, { status: 500 });
        }
    }
);
