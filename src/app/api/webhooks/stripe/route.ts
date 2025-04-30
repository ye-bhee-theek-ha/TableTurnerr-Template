// src/app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin'; 
import { FieldValue } from 'firebase-admin/firestore';
import type { Order, OrderItem, Address } from '@/constants/types'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
  typescript: true,
});

// --- Get Webhook Secret 
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// --- Helper: Parse Metadata Safely ---
const parseMetadata = (metadata: Stripe.Metadata | null | undefined): {
    userId: string | null;
    restaurantId: string | null;
    deliveryAddress: Address | null;
    cartItems: { itemId: string; name: string; quantity: number; options: Record<string, any>; unitPrice: number; }[] | null;
 } | null => {
    if (!metadata) return null;
    try {
        if (!metadata.userId || !metadata.restaurantId || !metadata.deliveryAddress || !metadata.cartItems) {
            console.warn("Webhook metadata missing required fields:", Object.keys(metadata));
            return null;
        }
        return {
            userId: metadata.userId,
            restaurantId: metadata.restaurantId,
            deliveryAddress: JSON.parse(metadata.deliveryAddress) as Address,
            cartItems: JSON.parse(metadata.cartItems) as { itemId: string; name: string; quantity: number; options: Record<string, any>; unitPrice: number; }[],
        };
    } catch (e) {
        console.error("Error parsing webhook metadata:", e, metadata);
        return null;
    }
};

// --- Main Webhook Handler Function ---
export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('Stripe webhook secret is not configured.');
    return NextResponse.json({ message: 'Webhook error: Server configuration issue.' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature || '', webhookSecret);
    console.log(`Webhook received and verified: ${event.type}`);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ message: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.id;

    const orderDocRef = adminDb.collectionGroup('orders').where('payment.transactionId', '==', paymentIntentId);
    try {
        const existingOrderSnap = await orderDocRef.get();
        if (!existingOrderSnap.empty) {
            console.log(`Order already processed for payment: ${paymentIntentId}`);
            return NextResponse.json({ received: true, message: 'Order already processed.' }, { status: 200 });
        }
    } catch (dbCheckError) {
         console.error(`Error checking for existing order ${paymentIntentId}:`, dbCheckError);
         return NextResponse.json({ message: 'Webhook error: Failed to check for existing order.' }, { status: 500 });
    }

    const metadata = parseMetadata(session.metadata);
    if (!metadata || !metadata.userId || !metadata.restaurantId || !metadata.cartItems || !metadata.deliveryAddress) {
        console.error('Webhook Error: Missing or invalid metadata in session:', session.id);
        return NextResponse.json({ message: 'Webhook Error: Missing or invalid metadata.' }, { status: 400 });
    }

    const { userId, restaurantId, cartItems, deliveryAddress } = metadata;

    try {
        const orderItems: OrderItem[] = cartItems.map(item => ({
            menuItemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: parseFloat((item.unitPrice * item.quantity).toFixed(2)),
            selectedOptions: item.options || {},
        }));

        const subTotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const discountAmount = 0; // TODO: Implement discount logic if needed
        const totalAmount = subTotal - discountAmount;

        // Verify amount if possible
        if (session.amount_total && Math.round(totalAmount * 100) !== session.amount_total) {
            console.warn(`Webhook Amount Mismatch! Calculated: ${totalAmount * 100}, Stripe: ${session.amount_total}. Session: ${session.id}. Proceeding with Stripe amount.`);
        }

        // Fetch user info
        let customerInfo = { name: 'N/A', email: session.customer_email || 'N/A', phoneNumber: 'N/A' };
        try {
            const userRecord = await adminAuth.getUser(userId);
            customerInfo = {
                name: userRecord.displayName || 'N/A',
                email: userRecord.email || session.customer_email || 'N/A',
                phoneNumber: userRecord.phoneNumber || 'N/A',
            };
        } catch (userError) {
            console.warn(`Could not fetch user record ${userId} for order ${paymentIntentId}:`, userError);
        }

        const newOrderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderNumber'> = {
            userId: userId,
            restaurantId: restaurantId,
            customerInfo: customerInfo,
            items: orderItems,
            subTotal: parseFloat(subTotal.toFixed(2)),
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            totalAmount: parseFloat(((session.amount_total ?? 0) / 100).toFixed(2)),
            status: 'pending',
            orderType: 'delivery',
            deliveryAddress: deliveryAddress,
            payment: {
                method: session.payment_method_types?.[0] || 'card',
                status: 'paid',
                transactionId: paymentIntentId,
            },
            specialInstructions: metadata.cartItems.find(item => item.options?._additionalNote)?.options?._additionalNote || '',
        };

        const finalOrderDocRef = adminDb.collection(`Restaurants/${restaurantId}/orders`).doc(paymentIntentId);
        await finalOrderDocRef.set({
            ...newOrderData,
            orderNumber: paymentIntentId.substring(paymentIntentId.length - 8).toUpperCase(),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`Order ${finalOrderDocRef.id} successfully created via webhook.`);

        // TODO: Trigger post-order actions (notifications, etc.)

    } catch (processingError: any) {
        console.error(`Webhook Error: Failed to process order ${paymentIntentId}:`, processingError);
        return NextResponse.json({ message: 'Webhook Error: Failed to process order.' }, { status: 500 });
    }

  } else {
    console.log(`Webhook received unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
