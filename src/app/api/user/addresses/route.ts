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

// Highlight: Added validation schema for updating
const updateAddressSchema = z.object({
    id: z.string().min(1, 'Address ID is required'), // Require ID for updates
    address: z.string().min(5, 'Address is too short').optional(), // Make fields optional for partial updates
    isDefault: z.boolean().optional(),
     // Add other fields as needed, make them optional
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

// --- POST Handler ---
const handlePostAddress = async (req: NextRequest, user: DecodedIdToken) => {
    const userId = user.uid;
    const userRef = adminDb.collection('users').doc(userId);
    try {
        const body = await req.json();
        const validationResult = addAddressSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json({ message: 'Invalid address data', errors: validationResult.error.errors }, { status: 400 });
        }

        const userDoc = await userRef.get();
         if (!userDoc.exists) {
            return NextResponse.json({ message: "User profile not found." }, { status: 404 });
         }
        const currentAddresses: Address[] = userDoc.data()?.addresses || [];
        const newAddressData = validationResult.data;
        const newAddress: Address = {
            ...newAddressData,
            // Highlight: Consider using a more robust UUID library if available
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            isDefault: newAddressData.isDefault ?? currentAddresses.length === 0,
        };

        let updatedAddresses = [...currentAddresses];
        if (newAddress.isDefault) {
            updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
        }
        updatedAddresses.push(newAddress);

        await userRef.update({ addresses: updatedAddresses });
        // Highlight: Return the structure expected by the fixed frontend thunk
        return NextResponse.json({ message: 'Address added successfully', address: newAddress }, { status: 201 });
    } catch (error) {
        console.error(`Error adding address for user ${userId}:`, error);
        return NextResponse.json({ message: 'Failed to add address' }, { status: 500 });
    }
};

// --- PUT Handler (Highlight: Added This Entire Handler) ---
const handlePutAddress = async (req: NextRequest, user: DecodedIdToken) => {
    const userId = user.uid;
    const userRef = adminDb.collection('users').doc(userId);

    try {
        const body = await req.json();
        const validationResult = updateAddressSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json({ message: 'Invalid address data for update', errors: validationResult.error.errors }, { status: 400 });
        }

        const addressToUpdate = validationResult.data;
        const addressIdToUpdate = addressToUpdate.id;

        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return NextResponse.json({ message: "User profile not found." }, { status: 404 });
        }
        const currentAddresses: Address[] = userDoc.data()?.addresses || [];

        let addressFound = false;
        let updatedAddresses = currentAddresses.map(addr => {
            if (addr.id === addressIdToUpdate) {
                addressFound = true;
                // Merge existing address with validated update data
                return { ...addr, ...addressToUpdate };
            }
            return addr;
        });

        if (!addressFound) {
            return NextResponse.json({ message: `Address with ID ${addressIdToUpdate} not found.` }, { status: 404 });
        }

        // Handle 'isDefault' logic after mapping
        const isUpdatingToDefault = addressToUpdate.isDefault === true;

        if (isUpdatingToDefault) {
             updatedAddresses = updatedAddresses.map(addr => ({
                 ...addr,
                 isDefault: addr.id === addressIdToUpdate // Set current one to default, others to false
             }));
        } else if (addressToUpdate.isDefault === false) {
             // If explicitly setting to false, check if it was the only default
             const wasOriginallyDefault = currentAddresses.find(a => a.id === addressIdToUpdate)?.isDefault;
             if (wasOriginallyDefault && updatedAddresses.length > 0 && !updatedAddresses.some(a => a.id !== addressIdToUpdate && a.isDefault)) {
                 // If removing the only default, make another one default (e.g., the first)
                 const firstOtherAddressIndex = updatedAddresses.findIndex(a => a.id !== addressIdToUpdate);
                 if (firstOtherAddressIndex !== -1) {
                     updatedAddresses[firstOtherAddressIndex].isDefault = true;
                 } else {
                    // Only one address existed, and it's being set to non-default, keep it default
                     updatedAddresses = updatedAddresses.map(addr => addr.id === addressIdToUpdate ? { ...addr, isDefault: true } : addr);
                 }
             }
        }
        // Ensure at least one default if addresses exist and none is marked default
        if (updatedAddresses.length > 0 && !updatedAddresses.some(addr => addr.isDefault)) {
            updatedAddresses[0].isDefault = true;
        }

        await userRef.update({ addresses: updatedAddresses });

        const finalUpdatedAddress = updatedAddresses.find(a => a.id === addressIdToUpdate);
        // Return structure expected by frontend thunk
        return NextResponse.json({ message: 'Address updated successfully', address: finalUpdatedAddress }, { status: 200 });

    } catch (error) {
        console.error(`Error updating address for user ${userId}:`, error);
        return NextResponse.json({ message: 'Failed to update address' }, { status: 500 });
    }
};


// --- DELETE Handler (Highlight: Added This Entire Handler) ---
const handleDeleteAddress = async (req: NextRequest, user: DecodedIdToken) => {
    const userId = user.uid;
    const userRef = adminDb.collection('users').doc(userId);

    // Get address ID from query parameters
    const addressIdToDelete = req.nextUrl.searchParams.get('id');

    if (!addressIdToDelete) {
        return NextResponse.json({ message: 'Address ID is required in query parameters.' }, { status: 400 });
    }

    try {
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return NextResponse.json({ message: "User profile not found." }, { status: 404 });
        }
        const currentAddresses: Address[] = userDoc.data()?.addresses || [];

        const initialLength = currentAddresses.length;
        let updatedAddresses = currentAddresses.filter(addr => addr.id !== addressIdToDelete);

        if (updatedAddresses.length === initialLength) {
           return NextResponse.json({ message: `Address with ID ${addressIdToDelete} not found.` }, { status: 404 });
        }

         // Ensure at least one address is default if addresses remain
         if (updatedAddresses.length > 0 && !updatedAddresses.some(addr => addr.isDefault)) {
             updatedAddresses[0].isDefault = true; // Make the first remaining address default
         }

        await userRef.update({ addresses: updatedAddresses });

        // Return structure expected by frontend thunk
        return NextResponse.json({ message: 'Address deleted successfully' }, { status: 200 });

    } catch (error) {
        console.error(`Error deleting address for user ${userId}:`, error);
        return NextResponse.json({ message: 'Failed to delete address' }, { status: 500 });
    }
};

// --- Export protected handlers ---
export const GET = withAuth(handleGetAddresses);
export const POST = withAuth(handlePostAddress);
// Highlight: Export new PUT handler
export const PUT = withAuth(handlePutAddress);
// Highlight: Export new DELETE handler
export const DELETE = withAuth(handleDeleteAddress);