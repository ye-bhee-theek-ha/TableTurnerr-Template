// app/api/auth/verify-phone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebaseAdmin'; // Adjust path as needed
import { DecodedIdToken } from 'firebase-admin/auth';
import { z } from 'zod'; // Using Zod for validation

// Import the App Router compatible withAuth HOC from your middleware file
import { withAuth } from '@/utils/withAuth'; // Adjust path if needed

// Define validation schema for the request body
const verifyPhoneSchema = z.object({
  // Using refine for E.164 format validation (basic example)
  phoneNumber: z.string().refine((phone) => /^\+[1-9]\d{1,14}$/.test(phone), {
    message: "Phone number must be in E.164 format (e.g., +12125551234)",
  }),
});


// --- POST Handler Logic ---
// This function will be wrapped by withAuth
const handleVerifyPhone = async (req: NextRequest, user: DecodedIdToken) => {
  const userId = user.uid; // Get user ID from the authenticated user token passed by withAuth
  let body;

  try {
    body = await req.json();

    // Validate incoming data
    const validationResult = verifyPhoneSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid data', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Use the validated phone number
    const { phoneNumber } = validationResult.data;

    // --- Main Logic ---
    try {
      // 1. Update the phone number in Firebase Authentication
      // This assumes the client handled the actual OTP verification flow.
      // This step links the verified number to the user's Auth record.
      await adminAuth.updateUser(userId, {
        phoneNumber: phoneNumber,
        // Consider adding a custom claim if needed: e.g., phoneVerified: true
      });

      // 2. Optionally, update the phone number in the Firestore profile
      const userRef = adminDb.collection('users').doc(userId);
      await userRef.update({
        phoneNumber: phoneNumber,
        phoneVerified: true, // Add/update a flag to track verification status
        updatedAt: new Date().toISOString()
      });

      return NextResponse.json({ message: 'Phone number updated successfully' }, { status: 200 });

    } catch (error: any) {
      console.error(`Error updating phone number for user ${userId}:`, error);
      if (error.code === 'auth/phone-number-already-exists') {
        return NextResponse.json({ message: 'Phone number already in use by another account.' }, { status: 409 }); // Conflict
      }
       if (error.code === 'auth/invalid-phone-number') {
           return NextResponse.json({ message: 'Invalid phone number format provided.' }, { status: 400 });
       }
      // Handle other potential errors (e.g., Firestore errors)
      return NextResponse.json(
        { message: 'Internal Server Error updating phone number' },
        { status: 500 }
      );
    }
    // --- End Main Logic ---

  } catch (e) {
    // Error parsing JSON body
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
};


// --- Export protected handler ---
// Wrap the handler logic function with the withAuth HOC from your middleware
export const POST = withAuth(handleVerifyPhone);
