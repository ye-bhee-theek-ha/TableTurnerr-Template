// // File: app/api/orders/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import { adminAuth, adminDb } from '@/lib/firebase/firebaseAdmin';
// import { withLoginRequired } from '@/utils/withAuth';
// import { DecodedIdToken } from 'firebase-admin/auth';
// import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// import type { Order, OrderItem, Address, MenuItem } from '@/constants/types';

// // Define the expected request body structure from the frontend cart
// interface CreateOrderRequest {
//     restaurantId: string;
//     items: {
//         menuItemId: string;
//         quantity: number;
//         selectedOptions?: Record<string, any>;
//     }[];
//     orderType: 'pickup' | 'delivery';
//     deliveryAddress?: Address | null;
//     specialInstructions?: string;
//     loyaltyPointsToApply?: number;

// }

// // Define the structure of the response
// interface CreateOrderResponse {
//     success: boolean;
//     orderId?: string;
//     message: string;
// }

// // --- POST: Create a New Order ---
// export const POST = withLoginRequired<CreateOrderResponse>(
//     async (request, context, user) => {
//         const userId = user.uid;

//         try {
//             // --- Parse Request Body ---
//             const body: CreateOrderRequest = await request.json();
//             const {
//                 restaurantId,
//                 items,
//                 orderType,
//                 deliveryAddress,
//                 specialInstructions,
//             } = body;

//             // --- Input Validation ---
//             if (!restaurantId || !items || items.length === 0 || !orderType) {
//                 return NextResponse.json({ success: false, message: 'Missing required fields: restaurantId, items, orderType.' }, { status: 400 });
//             }
//             if (orderType === 'delivery' && !deliveryAddress) {
//                 return NextResponse.json({ success: false, message: 'Delivery address is required for delivery orders.' }, { status: 400 });
//             }
//             if (!['pickup', 'delivery'].includes(orderType)) {
//                  return NextResponse.json({ success: false, message: 'Invalid orderType. Must be "pickup" or "delivery".' }, { status: 400 });
//             }

//             // Add validation for item quantity (must be positive)
//             if (items.some(item => !item.menuItemId || !item.quantity || item.quantity <= 0)) {
//                  return NextResponse.json({ success: false, message: 'Invalid items data. Each item must have menuItemId and positive quantity.' }, { status: 400 });
//             }

//             console.log(`POST /api/orders: User ${userId} creating order for restaurant ${restaurantId}`);

//             // --- Fetch Menu Item Details & Validate Prices (CRITICAL) ---
//             // Fetch details for all items in the cart from the backend to ensure data integrity.
//             // This prevents users from manipulating prices/details on the frontend.
//             const itemFetchPromises = items.map(item =>
//                 adminDb.doc(`Restaurants/${restaurantId}/menu/${item.menuItemId}`).get()
//             );
//             const itemSnapshots = await Promise.all(itemFetchPromises);

//             const validatedOrderItems: OrderItem[] = [];
//             let subTotal = 0;

//             for (let i = 0; i < itemSnapshots.length; i++) {
//                 const docSnap = itemSnapshots[i];
//                 const requestedItem = items[i];

//                 if (!docSnap.exists) {
//                     throw new Error(`Menu item with ID ${requestedItem.menuItemId} not found in restaurant ${restaurantId}.`);
//                 }

//                 const menuItemData = docSnap.data() as MenuItem;

//                 // --- Edge Case: Item not available ---
//                 if (!menuItemData.isAvailable) {
//                      throw new Error(`Menu item "${menuItemData.name}" (ID: ${requestedItem.menuItemId}) is currently unavailable.`);
//                 }

//                 // --- Price Calculation (Basic) ---
//                 // TODO: Implement detailed price calculation based on selectedOptions if applicable
//                 const unitPrice = parseFloat(menuItemData.price || '0'); // Handle potential string price
//                 if (isNaN(unitPrice)) {
//                      throw new Error(`Invalid price format for menu item "${menuItemData.name}".`);
//                 }
//                 const itemTotalPrice = unitPrice * requestedItem.quantity;
//                 subTotal += itemTotalPrice;

//                 validatedOrderItems.push({
//                     menuItemId: requestedItem.menuItemId,
//                     name: menuItemData.name,
//                     quantity: requestedItem.quantity,
//                     unitPrice: unitPrice,
//                     totalPrice: itemTotalPrice,
//                     selectedOptions: requestedItem.selectedOptions || {},
//                 });
//             }

//             const totalAmount = subTotal;

//             // --- TODO: Apply Promotions ---
//             // If promotionId or couponCode is provided in the body:
//             // 1. Fetch the promotion document.
//             // 2. Validate (active, date range, usage limits, applicable items/min amount).
//             // 3. Calculate discountAmount.
//             // 4. Adjust totalAmount.
//             const discountAmount = 0; // Placeholder

//             // --- Fetch User Info (Denormalize for easy access in order doc) ---
//             const userRecord = await adminAuth.getUser(userId);
//             const customerInfo = {
//                 name: userRecord.displayName || 'N/A',
//                 email: userRecord.email || 'N/A',
//                 phoneNumber: userRecord.phoneNumber || 'N/A',
//             };

//             // --- Prepare Order Document Data ---
//             const newOrderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = { // Exclude fields set by server/DB
//                 orderNumber: null, // Set below or generate differently
//                 userId: userId,
//                 restaurantId: restaurantId, // Store for potential global queries
//                 customerInfo: customerInfo,
//                 items: validatedOrderItems,
//                 subTotal: parseFloat(subTotal.toFixed(2)),
//                 discountAmount: parseFloat(discountAmount.toFixed(2)),
//                 totalAmount: parseFloat(totalAmount.toFixed(2)),
//                 status: 'pending', // Initial status
//                 orderType: orderType,
//                 deliveryAddress: orderType === 'delivery' ? (deliveryAddress ?? null) : null,
//                 // TODO: add payment details here if needed
//                 payment: { // Placeholder - Integrate with actual payment gateway later
//                     method: 'pending', 
//                     status: 'pending', // e.g., 'paid', 'failed'
//                 },
//                 specialInstructions: specialInstructions || '',
//             };

//             // --- Database Add ---
//             const ordersCollectionRef = adminDb.collection(`Restaurants/${restaurantId}/orders`);
//             const newOrderRef = await ordersCollectionRef.add({
//                 ...newOrderData,
//                 createdAt: FieldValue.serverTimestamp(),
//                 updatedAt: FieldValue.serverTimestamp(),
//             });

//             // Set orderNumber (using doc ID for simplicity, could be generated differently)
//             await newOrderRef.update({ orderNumber: newOrderRef.id });

//             console.log(`Order ${newOrderRef.id} created successfully for user ${userId}.`);

//             // TODO Optional: Trigger Post-Order Actions ---
//             // - Send order confirmation email/notification (via Cloud Function?)
//             // - Notify restaurant staff (e.g., via WebSocket, Push Notification, Firestore listener on admin dashboard)

//             // --- Success Response ---
//             return NextResponse.json({
//                 success: true,
//                 orderId: newOrderRef.id,
//                 message: 'Order placed successfully.'
//             }, { status: 201 }); // 201 Created

//         } catch (error: any) {
//             // Handle JSON parsing errors
//             if (error instanceof SyntaxError) {
//                 return NextResponse.json({ success: false, message: 'Invalid JSON in request body.' }, { status: 400 });
//             }
//             // Handle specific validation errors thrown above
//             if (error.message.includes('Menu item') || error.message.includes('Invalid price') || error.message.includes('unavailable')) {
//                  return NextResponse.json({ success: false, message: error.message }, { status: 400 });
//             }

//             console.error(`POST /api/orders: Error creating order for user ${userId}:`, error);
//             return NextResponse.json({ success: false, message: 'Failed to place order.', error: error.message }, { status: 500 });
//         }
//     }
// );

