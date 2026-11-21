import { NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/db';
import { hashPassword, toUserProfile, attachSessionCookie } from '@/lib/auth';

const DEMO_EMAIL = 'demo@octoplan.dev';

export async function POST() {
  try {
    let demoUser = await getUserByEmail(DEMO_EMAIL);
    if (!demoUser) {
      demoUser = await createUser({
        name: 'Octo Demo',
        email: DEMO_EMAIL,
        password_hash: hashPassword('octoplan-demo'),
        role: 'Workspace Admin',
      });
    }

    const profile = toUserProfile(demoUser);
    const response = NextResponse.json({
      success: true,
      data: { user: profile },
    });
    attachSessionCookie(response, profile);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to launch demo session';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
