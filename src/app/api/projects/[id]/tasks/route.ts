import { NextResponse } from 'next/server';
import { getTasks, createTask, getProjectById } from '@/lib/db';
import { TaskPriority, TaskStatus } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tasks = await getTasks(id);
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('API Error /api/projects/[id]/tasks GET:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  } catch (error: any) {
    console.error('API Error /api/projects/[id]/tasks POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create task' },
      { status: 500 }
    );
  }
}
