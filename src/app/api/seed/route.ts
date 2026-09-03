import { NextResponse } from 'next/server';
import { seedDemoProject } from '@/lib/db';

export async function POST() {
  try {
    const project = await seedDemoProject();
    return NextResponse.json({
      success: true,
      message: 'Demo project seeded successfully',
      data: project,
    });
  } catch (error: any) {
    console.error('API Error /api/seed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed sample project' },
      { status: 500 }
    );
  }
}
