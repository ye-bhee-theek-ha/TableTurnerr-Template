// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { withAuth } from '@/utils/withAuth';

async function meHandler(
  req: NextRequest,
  user: import('firebase-admin/auth').DecodedIdToken
): Promise<NextResponse<{ message: string } | { uid: string; email: string | undefined; displayName: string; role: string; loyaltyPoints: number; photoURL: string | null, phoneNumber: string | null }>> {
  try {
    // Fetch additional profile data from Firestore
    const userRef = adminDb.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn(`Firestore profile not found for authenticated user: ${user.uid}`);
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    const profileData = userDoc.data();

    // Return combined auth claims and profile data
    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      displayName: profileData?.displayName || user.name || '',
      role: profileData?.role || 'customer',
      loyaltyPoints: profileData?.loyaltyPoints || 0,
      photoURL: profileData?.photoURL || user.picture || null,
      phoneNumber: profileData?.phoneNumber || null,

    });

  } catch (error) {
    console.error('Error fetching user profile in /api/auth/me:', error);
    return NextResponse.json({ message: 'Failed to fetch user profile data' }, { status: 500 });
  }
}

// Export the handler wrapped with authentication
export const GET = withAuth(meHandler);