// middleware/withAuth.ts
import { NextResponse, NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebaseAdmin';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthResult {
  user: DecodedIdToken | null;
  error?: string;
  status?: number;
}

type AppRouteHandlerFn<T = any> = (
  req: NextRequest,
  context: { params: Record<string, string | string[]> },
  user: DecodedIdToken
) => Promise<NextResponse<T>>;

const ROLES = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin',
} as const;

type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Authentication middleware for App Router routes
 * Verifies the session cookie and returns user info or error
 * @param request NextRequest object
 * @param restaurantId Optional role required to access the route
 * @param requiredRoles The ID of the restaurant to check role against
 * @returns AuthResult containing user, error, or status
 */
export async function verifyAuth(
  request: NextRequest,
  restaurantId?: string | undefined,  
  requiredRoles?: string | string[],
): Promise<AuthResult> {
  
  // Get session cookie from request cookies
  const sessionCookie = request.cookies.get('session')?.value || '';

  if (!sessionCookie) {
    return {
      user: null,
      error: 'Unauthorized: No session cookie',
      status: 401
    };
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(
      sessionCookie,
      true 
    );

    const userId = decodedToken.uid;

    if (requiredRoles && requiredRoles.length > 0) {
      const userId = decodedToken.uid;

      if (!restaurantId) {
        console.error(`Role check required (${requiredRoles}) but no restaurantId provided for request: ${request.url}`);
        return { user: null, error: "Internal Server Error: Restaurant context missing for role check.", status: 500 };
      }

      const staffRef = adminDb.doc(`Restaurants/${restaurantId}/users/${userId}`);
      const staffSnap = await staffRef.get();
      const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!staffSnap.exists) {
        return { user: null, error: 'Forbidden: User not associated with this restaurant.', status: 403 };
    }

      const userRole = staffSnap.data()?.role as Role;

      if (!userRole || !rolesToCheck.includes(userRole)) {
        return {
            user: null,
            error: `Forbidden: Requires one of roles [${rolesToCheck.join(', ')}]. User has role '${userRole || 'none'}'.`,
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
      error: 'dead end: with auth middleware failed',
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
  handler: (req: NextRequest, context: { params: Record<string, string | string[]> }, user: DecodedIdToken) => Promise<NextResponse<T>>,
  requiredRoles?: string | string[]
) {
  return async (request: NextRequest, context: { params: Record<string, string | string[]>} ) => {

    const restaurantId = await context.params?.restaurantId as string | undefined;
    const rolesToCheck = requiredRoles ? (Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]) : [];


    const authResult = await verifyAuth(request, restaurantId ,rolesToCheck);
    
    if (!authResult.user) {
      return NextResponse.json(
        { message: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Call the handler with the authenticated user
    try {
      return await handler(request, context, authResult.user);
  } catch (error: any) {
      console.error(`Error in protected route handler (${request.method} ${request.nextUrl.pathname}):`, error);
      return NextResponse.json(
          { message: "Internal Server Error", error: error.message || 'An unexpected error occurred.' },
          { status: 500 }
      );
  };
  };
}

/**
 * Helper specifically for admin-only routes
 */
export function withAdminAuth<T>(
  handler: AppRouteHandlerFn<T>
) {
  return withAuth(handler, ROLES.ADMIN);
}

/**
 * Helper specifically for staff-only routes
 */
export function withStaffAuth<T>(
  handler: AppRouteHandlerFn<T>
) {
  return withAuth(handler, [ROLES.STAFF, ROLES.ADMIN]);
}


/**
 * Helper specifically for customer routes
 */
export function withLoginRequired<T>(
  handler: AppRouteHandlerFn<T>
) {
  return withAuth(handler);
}

