import { NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/db';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    console.error('API Error /api/projects GET:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Project name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Project description is required.' },
        { status: 400 }
      );
    }

    const project = await createProject({
      name: name.trim(),
      description: description.trim(),
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: any) {
    console.error('API Error /api/projects POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
