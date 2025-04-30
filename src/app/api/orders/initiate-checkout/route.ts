// src/app/api/orders/initiate-checkout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin'; // Adjust path
import { withLoginRequired } from '@/utils/withAuth'; // Adjust path for your middleware
import type { MenuItem, CartItem, Address, CartItemOptions } from '@/constants/types'; // Adjust path
import type { DecodedIdToken } from 'firebase-admin/auth';

// --- Initialize Stripe ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
  typescript: true,
});

// --- Type for Request Body ---
interface InitiateCheckoutRequestBody {
    cartItems: CartItem[];
    deliveryAddress: Address;
    restaurantId: string;
}

// --- Helper: Secure Price Calculation (Backend) ---
const calculateBackendPriceForItem = async (
    restaurantId: string,
    cartItem: CartItem 
): Promise<number> => {

    const menuItemRef = adminDb.doc(`Restaurants/${restaurantId}/menu/${cartItem.id}`);
    const menuItemSnap = await menuItemRef.get();

    if (!menuItemSnap.exists) {
        console.error(`MenuItem with ID ${cartItem.id} not found in DB for restaurant ${restaurantId}.`);
        // Handle this error appropriately - maybe skip item or throw error
        throw new Error(`Menu item ${cartItem.name} not found.`);
    }
    const baseMenuItem = menuItemSnap.data() as MenuItem;

    let calculatedPrice = parseFloat(baseMenuItem.price || '0') || 0;

    const normalizedOptionsDefinition = !baseMenuItem.options
        ? []
        : Array.isArray(baseMenuItem.options)
        ? baseMenuItem.options
        : [baseMenuItem.options];

    const selectedOptions = cartItem.selectedOptions || {};
    for (const question in selectedOptions) {
        const selectedChoiceNames = selectedOptions[question];
        const choiceNamesArray = Array.isArray(selectedChoiceNames) ? selectedChoiceNames : [selectedChoiceNames];

        const optionDefinition = normalizedOptionsDefinition.find(opt => opt.Question === question);

        if (optionDefinition) {
            for (const choiceName of choiceNamesArray) {
                const choiceDefinition = optionDefinition.choices.find(choice => choice.name === choiceName);
                if (choiceDefinition && typeof choiceDefinition.price === 'number') {
                    calculatedPrice += choiceDefinition.price;
                }
            }
        } else {
             console.warn(`Option definition for question "${question}" not found for item ${cartItem.id}. Skipping price calculation for this option.`);
        }
    }

    return Math.max(0, calculatedPrice);
};


// --- API Handler ---
const handler = async (
    req: NextRequest,
    context: { params: Record<string, string | string[]> },
    user: DecodedIdToken
): Promise<NextResponse<{ sessionId: string } | { message: string; error?: any }>> => {

    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    const userId = user.uid; // Get userId from authenticated user

    try {
        const body = await req.json() as InitiateCheckoutRequestBody;
        const { cartItems, deliveryAddress, restaurantId } = body;

        // --- Validation ---
        if (!cartItems || cartItems.length === 0) {
            return NextResponse.json({ message: 'Cart is empty.' }, { status: 400 });
        }
        if (!deliveryAddress || !deliveryAddress.address) {
            return NextResponse.json({ message: 'Delivery address is required.' }, { status: 400 });
        }
        if (!restaurantId) {
             return NextResponse.json({ message: 'Restaurant ID is required.' }, { status: 400 });
        }

        console.log(`Initiating backend checkout for user: ${userId}, restaurant: ${restaurantId}`);

        // --- Prepare line items using backend price calculation ---
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        for (const item of cartItems) {
            try {
                const unitAmount = await calculateBackendPriceForItem(restaurantId, item);
                
                // Format options for description
                 let description = '';
                 const optionsDesc = Object.entries(item.selectedOptions || {})
                    .map(([key, value]) => {
                        if (key.startsWith('_')) return null;
                        const valStr = Array.isArray(value) ? value.join(', ') : String(value);
                        return valStr ? `${key}: ${valStr}` : null;
                    })
                    .filter(Boolean)
                    .join('; ');
                 if (optionsDesc) { description = optionsDesc; }

                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: item.name,
                            description: description || undefined,
                            images: item.imageUrl ? [item.imageUrl] : undefined,
                            // Add metadata linking back to your DB items if needed
                            metadata: {
                                menuItemId: item.id,
                                cartItemId: item.cartItemId
                            }
                        },
                        unit_amount: Math.round(unitAmount * 100), // Price in cents
                    },
                    quantity: item.quantity,
                });
            } catch (priceError: any) {
                 console.error(`Error calculating price for item ${item.id} (${item.name}): ${priceError.message}`);
                 return NextResponse.json({ message: `Error processing item: ${item.name}. ${priceError.message}` }, { status: 400 });
            }
        }

        // --- Define Success and Cancel URLs ---
        //  TODO: Use environment variables for URLs in production
        const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000';
        const success_url = `${appBaseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancel_url = `${appBaseUrl}/checkout/cancel`;

        // --- Create Stripe Checkout Session ---
        console.log("Creating Stripe session...");
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            success_url: success_url,
            cancel_url: cancel_url,
            // Associate payment with Stripe Customer if you manage them
            // customer: stripeCustomerId, // Fetch or create Stripe Customer ID based on userId
            // Or pass customer email
            customer_email: user.email, // Get email from authenticated user object
            // --- Metadata for Webhook ---
            metadata: {
                userId: userId,
                restaurantId: restaurantId,
                deliveryAddress: JSON.stringify(deliveryAddress),
                // Store simplified cart info again for easier access in webhook
                cartItems: JSON.stringify(cartItems.map(i => ({
                    itemId: i.id,
                    name: i.name,
                    quantity: i.quantity,
                    options: i.selectedOptions,
                    unitPrice: (line_items.find(li => li.price_data?.product_data?.metadata?.menuItemId === i.id)?.price_data?.unit_amount ?? 0) / 100 // Store calculated unit price
                }))),
            },
        });

        console.log("Stripe session created:", session.id);

        // --- Return Session ID ---
        if (!session.id) {
            throw new Error("Stripe session creation failed (no ID returned).");
        }

        return NextResponse.json({ sessionId: session.id }, { status: 200 });

    } catch (error: any) {
        console.error('API Error /api/orders/initiate-checkout:', error);
        return NextResponse.json({ message: 'Failed to initiate payment.', error: error.message || 'Unknown server error' }, { status: 500 });
    }
};

// Wrap the handler with the authentication middleware
export const POST = withLoginRequired(handler);
