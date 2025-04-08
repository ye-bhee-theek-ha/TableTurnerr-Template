
// pages/api/auth/logout.js
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export default async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('session');

  return NextResponse.json({ status: true, message: 'Logout successful' });
}
