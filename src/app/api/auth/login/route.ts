// app/api/auth/login/route.ts
import { adminAuth } from '@/lib/firebase/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ message: 'ID token is required.' }, { status: 400 });
    }

    // Set session expiration to 14 days. Adjust as needed.
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds

    // Verify the ID token and decode its claims.
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);

    // Only process if the user just signed in in the last 5 minutes.
    // This helps mitigate replay attacks if the token was somehow stolen.
    if (new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) {
      // Create session cookie.
      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn,
      });

      // Create a new response
      const response = NextResponse.json({ status: true, message: 'Login successful' });
      
      // Set the cookie on the response
      response.cookies.set('session', sessionCookie, {
        maxAge: expiresIn / 1000, // maxAge is in seconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        path: '/',
        sameSite: 'lax',
      });

      return response;
    } else {
      // Token is too old. Require re-authentication.
      return NextResponse.json({ message: 'Recent sign-in required.' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ message: 'Unauthorized', error: error.message }, { status: 401 });
  }
}