import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { verifyPassword, toUserProfile, attachSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const userRecord = await getUserByEmail(email);
    if (!userRecord || !verifyPassword(password, userRecord.password_hash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const profile = toUserProfile(userRecord);
    const response = NextResponse.json({
      success: true,
      data: { user: profile },
    });
    attachSessionCookie(response, profile);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign in';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
