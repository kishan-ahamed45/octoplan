import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to verify session';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
