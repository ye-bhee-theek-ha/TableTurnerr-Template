// src/lib/firebase/services/payment.ts (Example Path)

import {
    doc,
    collection,
    addDoc,
    onSnapshot,
    Unsubscribe,
    DocumentReference // Import DocumentReference type
} from 'firebase/firestore';
import { db } from '@/lib/firebase/ClientApp'; // Adjust path
import { CartItem, Address } from '@/constants/types'; // Adjust path
import { calculatePriceForItem } from '@/lib/slices/cartSlice';


/**
 * Initiates a Stripe Checkout session via the Firebase Stripe Extension.
 * Writes a document to Firestore which the extension listens to.
 *
 * @param userId - The authenticated user's ID.
 * @param cartItems - Array of items currently in the cart.
 * @param deliveryAddress - The selected delivery address.
 * @returns A Promise resolving with the DocumentReference of the created Firestore document.
 * @throws If writing to Firestore fails.
 */
export const initiateCheckoutSession = async (
    userId: string,
    cartItems: CartItem[],
    deliveryAddress: Address
): Promise<DocumentReference> => {

    if (!userId || !cartItems || cartItems.length === 0 || !deliveryAddress) {
        throw new Error("Missing required data to initiate checkout.");
    }

    console.log(`Initiating checkout for user: ${userId}`);

    // 1. Prepare line items for Firestore/Stripe Extension
    const line_items = cartItems.map((item) => ({
        price_data: {
            currency: 'usd', // Or your currency
            product_data: {
                name: item.name,
                metadata: { itemId: item.id }, // Store original item ID
                images: item.imageUrl ? [item.imageUrl] : undefined,
            },
            unit_amount: Math.round(calculatePriceForItem(item) * 100), // Price in cents
        },
        quantity: item.quantity,
    }));

    // 2. Define Success and Cancel URLs
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000';
    const success_url = `${appBaseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${appBaseUrl}/checkout/cancel`;

    // 3. Reference the Firestore collection monitored by the Stripe extension
    const checkoutSessionCollectionRef = collection(db, 'customers', userId, 'checkout_sessions');

    try {
        // 4. Add the document to trigger the extension
        const docRef = await addDoc(checkoutSessionCollectionRef, {
            client: 'web',
            mode: 'payment',
            line_items: line_items,
            success_url: success_url,
            cancel_url: cancel_url,
            // --- Add necessary metadata ---
            metadata: {
                userId: userId, // Store userId again in metadata for webhook convenience
                deliveryAddress: JSON.stringify(deliveryAddress), // Store delivery address
                // Store simplified cart info for webhook/order creation
                cartItems: JSON.stringify(cartItems.map(i => ({
                    itemId: i.id, name: i.name, quantity: i.quantity,
                    options: i.selectedOptions, unitPrice: calculatePriceForItem(i)
                }))),
                // Add restaurantId if needed for multi-restaurant scenarios
                // restaurantId: process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID
            },
        });

        console.log("Checkout session document written to Firestore with ID: ", docRef.id);
        return docRef; // Return the reference to the document

    } catch (error) {
        console.error("Error writing checkout session document to Firestore:", error);
        // Re-throw a more specific error or handle as needed
        throw new Error("Could not create checkout session document.");
    }
};

/**
 * Listens to a specific checkout session document for updates from the Stripe Extension.
 * Calls callbacks when the session ID or an error is available.
 *
 * @param docRef - The DocumentReference of the checkout session document.
 * @param onSessionUpdate - Callback function when sessionId or error is found.
 * @param onError - Callback function for Firestore listener errors.
 * @returns The Unsubscribe function for the Firestore listener.
 */
export const listenForCheckoutSessionUpdate = (
    docRef: DocumentReference,
    onSessionUpdate: (sessionId: string | null, error: { message: string } | null) => void,
    onError: (error: Error) => void
): Unsubscribe => {

    const unsubscribe = onSnapshot(docRef,
        (snap) => {
            const data = snap.data();
            const sessionId = data?.sessionId;
            const error = data?.error; // Check for error field from extension

            if (error) {
                console.error("Stripe Extension Error received:", error);
                onSessionUpdate(null, { message: error.message || "Payment session creation failed." });
                unsubscribe(); // Stop listening on error
            } else if (sessionId) {
                console.log("Stripe Session ID received via listener:", sessionId);
                onSessionUpdate(sessionId, null);
                unsubscribe(); // Stop listening once session ID is found
            }
            // If neither is present, keep listening
        },
        (err) => { // Handle listener errors
            console.error("Firestore listener error:", err);
            onError(new Error("Error waiting for payment session update."));
            unsubscribe(); // Stop listening on listener error
        }
    );

    return unsubscribe; // Return the unsubscribe function
};
