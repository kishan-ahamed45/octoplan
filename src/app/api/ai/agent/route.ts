import { NextResponse } from 'next/server';
import { runAgentConversation } from '@/lib/ai';
import { getProjectById } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { projectId, message, chatHistory } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required.' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message content is required.' },
        { status: 400 }
      );
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found.' },
        { status: 404 }
      );
    }

    const result = await runAgentConversation(projectId, message.trim(), chatHistory || []);

    return NextResponse.json({
      success: true,
      data: {
        message: result.message,
        actionsExecuted: result.actionsExecuted,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Agent failed to process request';
    console.error('API Error /api/ai/agent:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
