// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin'; // Adjust path as needed
import { z } from 'zod'; // Using Zod for validation
import { DecodedIdToken } from 'firebase-admin/auth';

// Import the App Router compatible withAuth HOC from your middleware file
import { withAuth } from '@/utils/withAuth'; // Adjust path if needed

// Define validation schema for profile updates (reused from your snippet)
const profileUpdateSchema = z.object({
  displayName: z.string().min(1, 'Display name cannot be empty').optional(), // Make optional for PUT if not always required
  phoneNumber: z.string().optional(), // Add specific phone validation if needed
  photoURL: z.union([
    z.string().url('Invalid URL format'), // Valid URL
    z.literal(''), // Empty string
    z.null() // Null
  ]).optional()
});

// --- GET Handler Logic ---
const handleGetUserProfile = async (req: NextRequest, user: DecodedIdToken) => {
  const userId = user.uid; // Get user ID from the authenticated user token passed by withAuth

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    // Return only necessary, non-sensitive profile data
    const profileData = userDoc.data() || {};
    const responseData = {
        message: 'User profile fetched successfully', // Add a consistent message field
        uid: userId, // Include UID for reference
        email: profileData.email, // Or user.email from token
        role: profileData.role || user.role, // Prioritize Firestore role, fallback to token claim
        loyaltyPoints: profileData.loyaltyPoints,
        displayName: profileData.displayName,
        phoneNumber: profileData.phoneNumber,
        photoURL: profileData.photoURL,
        // Add other fields as needed
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error(`Error fetching profile for user ${userId}:`, error);
    return NextResponse.json(
        { message: 'Failed to fetch user profile' },
        { status: 500 }
    );
  }
};

// --- PUT Handler Logic ---
const handleUpdateUserProfile = async (req: NextRequest, user: DecodedIdToken) => {
  const userId = user.uid; // Get user ID from the authenticated user token

  try {
    const body = await req.json();

    // Validate incoming data
    const validationResult = profileUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid data', errors: validationResult.error.errors, body: body },
        { status: 400 }
      );
    }

    // Use the validated data
    const profileDataToUpdate = validationResult.data;

    // Explicitly remove fields users should not update (redundant if not in schema, but safe)
    delete (profileDataToUpdate as any).role;
    delete (profileDataToUpdate as any).loyaltyPoints;
    delete (profileDataToUpdate as any).email; // Prevent email changes via profile update

    if (Object.keys(profileDataToUpdate).length === 0) {
      return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      ...profileDataToUpdate,
      updatedAt: new Date().toISOString() // Track updates
    });

    // Optionally update Firebase Auth profile if fields like displayName, photoURL changed
    // await adminAuth.updateUser(userId, { displayName: profileDataToUpdate.displayName, photoURL: profileDataToUpdate.photoURL });

    // Fetch the updated data to return it
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data();


    return NextResponse.json(
        { message: 'Profile updated successfully', data: updatedData }, // Return updated profile
        { status: 200 }
    );

  } catch (error) {
    console.error(`Error updating profile for user ${userId}:`, error);
    return NextResponse.json(
        { message: 'Failed to update user profile' },
        { status: 500 }
    );
  }
};

// --- Export protected handlers ---
// Wrap the handler logic functions with the withAuth HOC from your middleware
export const GET = withAuth(handleGetUserProfile);
export const PUT = withAuth(handleUpdateUserProfile);
// If you want to support POST as an alias for PUT:
// export const POST = withAuth(handleUpdateUserProfile);

