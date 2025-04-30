// app/api/user/verify-phone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebaseAdmin'; // Adjust path
import { DecodedIdToken } from 'firebase-admin/auth';

// Import the App Router compatible withAuth HOC
import { withLoginRequired } from '@/utils/withAuth'; // Adjust path

const handleConfirmPhoneVerification = async (
  req: NextRequest,
  context: { params: Record<string, string | string[]> },
  user: DecodedIdToken
  ) => {
  const userId = user.uid; // Get user ID from the validated session cookie token

  console.log(`Confirming phone verification status for user ${userId} in VERIFY-PHONE API...`);

  try {
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      phoneVerified: true,
      updatedAt: new Date().toISOString()
    });
    console.log(`Firestore profile updated for user ${userId}: phoneVerified=true`);

    // 2. Set Custom Claim (Optional: Useful for security rules or client-side checks)
    const currentClaims = (await adminAuth.getUser(userId)).customClaims || {};
    await adminAuth.setCustomUserClaims(userId, {
      ...currentClaims, // Preserve existing claims
      phoneVerified: true
    });
    console.log(`Custom claim set for user ${userId}: phoneVerified=true`);

    // --- End Main Logic ---

    return NextResponse.json({ message: 'Phone verification status confirmed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error(`Error confirming phone verification status for user ${userId}:`, error);
    // Handle potential errors (e.g., Firestore errors, user not found - though unlikely if withAuth passed)
    return NextResponse.json(
      { message: 'Internal Server Error confirming phone verification status' },
      { status: 500 }
    );
  }
};

// --- Export protected handler ---
export const POST = withLoginRequired(handleConfirmPhoneVerification);

