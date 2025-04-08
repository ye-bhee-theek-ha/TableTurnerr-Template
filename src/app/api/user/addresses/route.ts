// app/api/user/addresses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { z } from 'zod';
import { withAuth } from '@/utils/withAuth';

// NOTE: Storing addresses in an array within the user document works for a few addresses.
// For many addresses per user, consider using a subcollection:
// e.g., adminDb.collection('users').doc(userId).collection('addresses')
// This requires changing the logic below significantly (querying collections, adding/updating/deleting docs).

// Define Address type (matching Firestore structure)
interface Address {
    id: string;
    address: string;
    isDefault?: boolean;
    // Add other fields like city, postalCode, country if they exist
}

// Validation schema for adding an address (ID is generated server-side)
const addAddressSchema = z.object({
  address: z.string().min(5, 'Address is too short'),
  isDefault: z.boolean().optional(),
  // Add other fields as needed
});

// --- GET Handler Logic ---
const handleGetAddresses = async (req: NextRequest, user: DecodedIdToken) => {
    const userId = user.uid;
    const userRef = adminDb.collection('users').doc(userId);

    try {
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            // Or potentially create a user doc if appropriate for your flow
            return NextResponse.json({ message: "User profile not found." }, { status: 404 });
        }
        // Assuming 'addresses' is the array field in the user document
        const currentAddresses: Address[] = userDoc.data()?.addresses || [];

        return NextResponse.json({ message: 'Addresses fetched successfully', data: currentAddresses }, { status: 200 });

    } catch (error) {
        console.error(`Error fetching addresses for user ${userId}:`, error);
        return NextResponse.json(
            { message: 'Failed to fetch addresses' },
            { status: 500 }
        );
    }
};


// --- POST Handler Logic ---
const handlePostAddress = async (req: NextRequest, user: DecodedIdToken) => {
    const userId = user.uid;
    const userRef = adminDb.collection('users').doc(userId);

    try {
        const body = await req.json();
        const validationResult = addAddressSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { message: 'Invalid address data', errors: validationResult.error.errors },
                { status: 400 }
            );
        }

        // Fetch current addresses to update the array
        const userDoc = await userRef.get();
         if (!userDoc.exists) {
             return NextResponse.json({ message: "User profile not found." }, { status: 404 });
         }
        const currentAddresses: Address[] = userDoc.data()?.addresses || [];

        const newAddressData = validationResult.data;
        const newAddress: Address = {
            ...newAddressData,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Generate unique ID (consider UUID)
            isDefault: newAddressData.isDefault ?? currentAddresses.length === 0, // Default if first or explicitly set
        };

        let updatedAddresses = [...currentAddresses];

        if (newAddress.isDefault) {
            // Set all others to non-default
            updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
        }
        updatedAddresses.push(newAddress);

        // Update the entire addresses array in Firestore
        await userRef.update({ addresses: updatedAddresses });

        return NextResponse.json({ message: 'Address added successfully', address: newAddress }, { status: 201 }); // Return a consistent response

    } catch (error) {
        console.error(`Error adding address for user ${userId}:`, error);
        return NextResponse.json(
            { message: 'Failed to add address' },
            { status: 500 }
        );
    }
};


// --- Export protected handlers ---
export const GET = withAuth(handleGetAddresses);
export const POST = withAuth(handlePostAddress);
