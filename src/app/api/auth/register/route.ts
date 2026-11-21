import { NextResponse } from 'next/server';
import { getUserByEmail, getUserCount, createUser } from '@/lib/db';
import { hashPassword, toUserProfile, attachSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (name.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const existingCount = await getUserCount();
    const role = existingCount === 0 ? 'Workspace Admin' : 'Member';

    const created = await createUser({
      name,
      email,
      password_hash: hashPassword(password),
      role,
    });

    const profile = toUserProfile(created);
    const response = NextResponse.json(
      { success: true, data: { user: profile } },
      { status: 201 }
    );
    attachSessionCookie(response, profile);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create account';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
