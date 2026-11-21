import { NextResponse } from 'next/server';
import { getTasks, createTask, getProjectById } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { TaskPriority, TaskStatus } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const tasks = await getTasks(id);
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
    console.error('API Error /api/projects/[id]/tasks GET:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { id: projectId } = await params;
    const project = await getProjectById(projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, category } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task title is required.' },
        { status: 400 }
      );
    }

    const validStatus: TaskStatus = status && ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(status)
      ? status
      : 'TODO';

    const validPriority: TaskPriority = priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)
      ? priority
      : 'MEDIUM';

    const task = await createTask({
      project_id: projectId,
      title: title.trim(),
      description: description?.trim() || '',
      status: validStatus,
      priority: validPriority,
      category: category?.trim() || 'General',
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create task';
    console.error('API Error /api/projects/[id]/tasks POST:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
