// middleware/withAuth.ts
import { NextResponse, NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebaseAdmin';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthResult {
  user: DecodedIdToken | null;
  error?: string;
  status?: number;
}

/**
 * Authentication middleware for App Router routes
 * Verifies the session cookie and returns user info or error
 * @param request NextRequest object
 * @param requiredRole Optional role required to access the route
 */
export async function verifyAuth(
  request: NextRequest,
  requiredRole?: string | string[]
): Promise<AuthResult> {
  // Get session cookie from request cookies
  const sessionCookie = request.cookies.get('session')?.value || '';

  console.log("in with auth")
  console.log("session cookie: ", sessionCookie)

  if (!sessionCookie) {
    return {
      user: null,
      error: 'Unauthorized: No session cookie',
      status: 401
    };
  }

  try {
    // Verify the session cookie
    const decodedToken = await adminAuth.verifySessionCookie(
      sessionCookie,
      true // Check for revocation
    );

    // Check for required role if specified
    if (requiredRole) {
      const userRole = decodedToken.role || 'customer'; // Assuming role is a custom claim
      const rolesToCheck = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      if (!rolesToCheck.includes(userRole)) {
        console.warn(`Role check failed: User ${decodedToken.uid} (${userRole}) tried to access route requiring ${rolesToCheck.join('/')}`);
        return {
          user: null,
          error: 'Forbidden: Insufficient permissions',
          status: 403
        };
      }
    }

    // Authentication successful
    return {
      user: decodedToken,
      status: 200
    };

  } catch (error: any) {
    console.error('Error verifying session cookie:', error);
    
    if (error.code === 'auth/session-cookie-revoked') {
      return {
        user: null,
        error: 'Unauthorized: Session revoked',
        status: 401
      };
    }
    if (error.code === 'auth/session-cookie-expired') {
      return {
        user: null,
        error: 'Unauthorized: Session expired',
        status: 401
      };
    }
    
    return {
      user: null,
      error: 'Unauthorized: Invalid session cookie',
      status: 401
    };
  }
}

/**
 * Helper function to create a protected route handler
 * @param handler The function to run if authentication succeeds
 * @param requiredRole Optional role required to access the route
 */
export function withAuth<T>(
  handler: (req: NextRequest, user: DecodedIdToken) => Promise<NextResponse<T>>,
  requiredRole?: string | string[]
) {
  return async (request: NextRequest) => {
    const authResult = await verifyAuth(request, requiredRole);
    
    if (!authResult.user) {
      return NextResponse.json(
        { message: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Call the handler with the authenticated user
    return handler(request, authResult.user);
  };
}

/**
 * Helper specifically for admin-only routes
 */
export function withAdminAuth<T>(
  handler: (req: NextRequest, user: DecodedIdToken) => Promise<NextResponse<T>>
) {
  return withAuth(handler, 'admin');
}