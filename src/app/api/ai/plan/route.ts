import { NextResponse } from 'next/server';
import { generateProjectPlan } from '@/lib/ai';
import { getProjectById, createBatchTasks } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { GeneratePlanResponse, Task } from '@/types';

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { projectId, projectName, projectDescription, saveToDatabase, tasks: providedTasks } = body;

    let targetName = projectName;
    let targetDesc = projectDescription;

    if (projectId) {
      const project = await getProjectById(projectId);
      if (!project) {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }
      targetName = project.name;
      targetDesc = project.description;
    }

    if (!targetName || !targetDesc) {
      return NextResponse.json(
        { success: false, error: 'Project name and description are required.' },
        { status: 400 }
      );
    }

    const plan: GeneratePlanResponse =
      Array.isArray(providedTasks) && providedTasks.length > 0
        ? { project_overview: '', tasks: providedTasks }
        : await generateProjectPlan(targetName, targetDesc);

    let createdTasks: Task[] = [];
    if (saveToDatabase && projectId) {
      createdTasks = await createBatchTasks(
        projectId,
        plan.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          priority: t.priority,
          category: t.category,
          status: 'TODO',
        }))
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        createdTasks,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate project plan';
    console.error('API Error /api/ai/plan:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
