    // app/api/auth/register/route.ts
    import { NextRequest, NextResponse } from 'next/server';
    import { adminAuth, adminDb } from '@/lib/firebase/firebaseAdmin'; // Adjust path as needed
    import { cookies } from 'next/headers';

    // Session expiration for auto-login after registration
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    export async function POST(req: NextRequest) {
      console.log("Registering user...");
      try {
        const body = await req.json();
        const { email, password, displayName, phoneNumber } = body;

        // Basic validation
        if (!email || !password || !displayName) {
          return NextResponse.json(
            { message: 'Missing required fields (email, password, displayName)' },
            { status: 400 }
          );
        }

        // 1. Create the user in Firebase Auth
        const userRecord = await adminAuth.createUser({
          email: email,
          emailVerified: false,
          password: password,
          displayName: displayName,

          phoneNumber: phoneNumber,
          disabled: false,
        });

        // 2. Optionally set custom claims (e.g., default role)
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'customer' });

        // 3. Optionally create a user profile document in Firestore
        const userProfile = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            role: 'customer',
            createdAt: new Date().toISOString(),
            loyaltyPoints: 0,
            phoneNumber: phoneNumber,
            phoneVerified: false,
            restaurantId: process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID,
        };
        await adminDb.collection('users').doc(userRecord.uid).set(userProfile);

        return NextResponse.json(
          { message: 'User registered successfully', uid: userRecord.uid },
          { status: 201 } // 201 Created
        );

      } catch (error: any) {
        console.error('Registration Error:', error);
        if (error.code === 'auth/email-already-exists') {
          return NextResponse.json(
            { message: 'Email already in use' },
            { status: 409 }
          );
        }
        if (error.code === 'auth/invalid-email') {
          return NextResponse.json(
            { message: 'Invalid email format' },
            { status: 400 }
          );
        }
        // Add other specific Firebase error checks if needed
        return NextResponse.json(
          { message: 'Internal Server Error during registration' },
          { status: 500 }
        );
      }
    }
    