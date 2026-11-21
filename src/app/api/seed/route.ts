import { NextResponse } from 'next/server';
import { seedDemoProject } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const project = await seedDemoProject();
    return NextResponse.json({
      success: true,
      message: 'Demo project seeded successfully',
      data: project,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to seed sample project';
    console.error('API Error /api/seed:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
