// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json(
    { status: true, message: 'Logout successful' },
    { status: 200 }
  );
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { status: false, message: 'Method Not Allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}