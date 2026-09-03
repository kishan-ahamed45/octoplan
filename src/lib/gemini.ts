import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import {
  getProjectById,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from './db';
import { GeneratePlanResponse, TaskPriority, TaskStatus } from '@/types';

const apiKey = process.env.GEMINI_API_KEY || '';

// Initialize Google GenAI client if key exists
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// ==========================================
// 1. AI Project Planner
// ==========================================

export async function generateProjectPlan(
  projectName: string,
  projectDescription: string
): Promise<GeneratePlanResponse> {
  if (!ai || !apiKey) {
    // High-quality mock plan fallback if API key is not yet set
    return getFallbackPlan(projectName, projectDescription);
  }

  try {
    const prompt = `You are a Senior Technical Project Manager and Software Architect.
Analyze the following project and generate a realistic, structured development breakdown with actionable tasks.

Project Name: ${projectName}
Project Description: ${projectDescription}

For each task, provide:
- title (concise, action-oriented, e.g. "Implement OAuth & Session Tokens")
- description (clear technical scope and acceptance criteria)
- priority ("LOW", "MEDIUM", or "HIGH")
- category ("Backend", "Frontend", "Database", "DevOps", "Security", or "Full Stack")

Provide 5 to 7 high-value development tasks that cover the MVP lifecycle.
Also provide a concise 2-sentence project overview.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            project_overview: {
              type: Type.STRING,
              description: '2-sentence strategic technical overview of the project.',
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: {
                    type: Type.STRING,
                    enum: ['LOW', 'MEDIUM', 'HIGH'],
                  },
                  category: { type: Type.STRING },
                },
                required: ['title', 'description', 'priority', 'category'],
              },
            },
          },
          required: ['project_overview', 'tasks'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini');
    const parsed = JSON.parse(text) as GeneratePlanResponse;
    return parsed;
  } catch (error) {
    console.error('Gemini plan generation error:', error);
    return getFallbackPlan(projectName, projectDescription);
  }
}

function getFallbackPlan(name: string, description: string): GeneratePlanResponse {
  return {
    project_overview: `Strategic roadmap for ${name}. This plan focuses on core MVP delivery, data integrity, user authentication, and seamless user experience.`,
    tasks: [
      {
        title: 'Design Relational Database Schema',
        description: `Set up core database tables, indexing, and relationships required for ${name}.`,
        priority: 'HIGH',
        category: 'Database',
      },
      {
        title: 'Implement Authentication & Authorization',
        description: 'Set up secure user signup, login, session cookies, and role-based route protection.',
        priority: 'HIGH',
        category: 'Security',
      },
      {
        title: 'Develop Core Feature APIs',
        description: `Create robust REST endpoints and validation schemas for ${name} business logic.`,
        priority: 'HIGH',
        category: 'Backend',
      },
      {
        title: 'Build Responsive Frontend UI Components',
        description: 'Develop clean, accessible dashboard layouts and interactive views with Tailwind CSS.',
        priority: 'MEDIUM',
        category: 'Frontend',
      },
      {
        title: 'Integrate Third-Party Services & Webhooks',
        description: 'Connect external payment gateways, notification dispatchers, or external APIs.',
        priority: 'MEDIUM',
        category: 'Full Stack',
      },
      {
        title: 'End-to-End Testing & Production Deployment',
        description: 'Perform unit tests, integration validation, and configure automated CI/CD deployment.',
        priority: 'MEDIUM',
        category: 'DevOps',
      },
    ],
  };
}

// ==========================================
// 2. AI Agent Tool Declarations & Execution
// ==========================================

const agentTools: FunctionDeclaration[] = [
  {
    name: 'get_project_details',
    description: 'Retrieve details and current statistics for the active project.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_tasks',
    description: 'Retrieve all tasks associated with the current project, including their title, status, priority, and category.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in the project.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'The title of the task.' },
        description: { type: Type.STRING, description: 'Optional details about the task.' },
        priority: {
          type: Type.STRING,
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'Task priority level.',
        },
        category: { type: Type.STRING, description: 'Category (e.g., Backend, Frontend, Security).' },
        status: {
          type: Type.STRING,
          enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
          description: 'Initial status of the task (default: TODO).',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task status, priority, title, or category.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: { type: Type.STRING, description: 'The unique ID of the task to update.' },
        title: { type: Type.STRING, description: 'New title if updating.' },
        description: { type: Type.STRING, description: 'New description if updating.' },
        status: {
          type: Type.STRING,
          enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
          description: 'Updated status.',
        },
        priority: {
          type: Type.STRING,
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'Updated priority.',
        },
        category: { type: Type.STRING, description: 'Updated category.' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task from the project.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: { type: Type.STRING, description: 'The unique ID of the task to delete.' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'get_project_statistics',
    description: 'Calculate and return current project completion percentage, pending tasks, and high-priority count.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

export interface AgentExecutionResult {
  message: string;
  actionsExecuted: {
    toolName: string;
    details: string;
    result?: Record<string, unknown> | null;
  }[];
}

export async function runAgentConversation(
  projectId: string,
  userMessage: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<AgentExecutionResult> {
  const actionsExecuted: AgentExecutionResult['actionsExecuted'] = [];

  // If Gemini API is not configured, run smart local agent logic
  if (!ai || !apiKey) {
    return runFallbackAgent(projectId, userMessage);
  }

  try {
    const project = await getProjectById(projectId);
    if (!project) {
      return {
        message: "Error: Project not found.",
        actionsExecuted: [],
      };
    }

    const systemInstruction = `You are an elite, proactive AI Project Manager & Agile Lead for the project "${project.name}".
Project Description: "${project.description}"
Active Project ID: "${projectId}"

You have direct access to tools that query and manipulate the project database.
Guidelines:
1. Always inspect the actual tasks or project stats using tools rather than hallucinating.
2. When the user asks "What should I work on next?" or for task recommendations, call get_tasks() or get_project_statistics(), analyze the incomplete HIGH-priority tasks, and provide a clear, reasoned recommendation.
3. When the user asks to create, update, or delete a task, use create_task(), update_task(), or delete_task(). Confirm the specific action taken clearly in your response.
4. Keep your responses crisp, professional, motivating, and actionable.`;

    // Tool execution handler
    async function executeTool(toolName: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
      switch (toolName) {
        case 'get_project_details': {
          const p = await getProjectById(projectId);
          actionsExecuted.push({
            toolName: 'get_project_details',
            details: `Retrieved project information for "${p?.name}"`,
          });
          return { project: p };
        }
        case 'get_tasks': {
          const tasks = await getTasks(projectId);
          actionsExecuted.push({
            toolName: 'get_tasks',
            details: `Fetched ${tasks.length} tasks from database`,
          });
          return { tasks };
        }
        case 'get_project_statistics': {
          const p = await getProjectById(projectId);
          actionsExecuted.push({
            toolName: 'get_project_statistics',
            details: `Analyzed stats: ${p?.stats.completedTasks}/${p?.stats.totalTasks} completed (${p?.stats.completionPercentage}%)`,
          });
          return { statistics: p?.stats };
        }
        case 'create_task': {
          const title = String(args.title || 'Untitled Task');
          const description = String(args.description || '');
          const priority = (args.priority as TaskPriority) || 'MEDIUM';
          const category = String(args.category || 'General');
          const status = (args.status as TaskStatus) || 'TODO';

          const created = await createTask({
            project_id: projectId,
            title,
            description,
            priority,
            category,
            status,
          });

          actionsExecuted.push({
            toolName: 'create_task',
            details: `Created task: "${created.title}" [Priority: ${created.priority}]`,
            result: { id: created.id, title: created.title },
          });

          return { success: true, createdTask: created };
        }
        case 'update_task': {
          const taskId = String(args.taskId);
          const updated = await updateTask(taskId, {
            title: args.title ? String(args.title) : undefined,
            description: args.description ? String(args.description) : undefined,
            status: args.status ? (args.status as TaskStatus) : undefined,
            priority: args.priority ? (args.priority as TaskPriority) : undefined,
            category: args.category ? String(args.category) : undefined,
          });

          actionsExecuted.push({
            toolName: 'update_task',
            details: updated
              ? `Updated task "${updated.title}" -> Status: ${updated.status}`
              : `Task ${taskId} not found`,
            result: updated ? { id: updated.id, status: updated.status } : null,
          });

          return { success: Boolean(updated), updatedTask: updated };
        }
        case 'delete_task': {
          const taskId = String(args.taskId);
          const ok = await deleteTask(taskId);
          actionsExecuted.push({
            toolName: 'delete_task',
            details: ok ? `Deleted task ID ${taskId}` : `Failed to delete task ${taskId}`,
          });
          return { success: ok };
        }
        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    }

    // Build conversation content
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }> = [];

    for (const msg of chatHistory.slice(-6)) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    // Multi-turn tool execution loop
    let currentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents as any,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: agentTools }],
      },
    });

    let loopCount = 0;
    while (currentResponse.functionCalls && currentResponse.functionCalls.length > 0 && loopCount < 5) {
      loopCount++;
      const call = currentResponse.functionCalls[0];
      const toolName = call.name || '';
      const toolArgs = (call.args || {}) as Record<string, unknown>;

      const toolResult = await executeTool(toolName, toolArgs);

      // Submit tool response back to Gemini
      const followupContents = [
        ...contents,
        {
          role: 'model' as const,
          parts: [{ functionCall: call } as any],
        },
        {
          role: 'user' as const,
          parts: [
            {
              functionResponse: {
                name: toolName,
                response: toolResult,
              },
            } as any,
          ],
        },
      ];

      currentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: followupContents as any,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: agentTools }],
        },
      });
    }

    return {
      message: currentResponse.text || 'I have processed your request.',
      actionsExecuted,
    };
  } catch (error) {
    console.error('Error running agent conversation:', error);
    return runFallbackAgent(projectId, userMessage);
  }
}

// Smart rule-based agent fallback
async function runFallbackAgent(projectId: string, userMessage: string): Promise<AgentExecutionResult> {
  const lower = userMessage.toLowerCase();
  const actionsExecuted: AgentExecutionResult['actionsExecuted'] = [];
  const project = await getProjectById(projectId);
  const tasks = await getTasks(projectId);

  if (lower.includes('create') || lower.includes('add task')) {
    // Extract potential title
    let title = 'New Feature Implementation';
    const match = userMessage.match(/(?:task (?:for|to|called)?\s*["']?([^"'.]+)["']?)/i) ||
                  userMessage.match(/create (?:a )?(?:high-priority |medium-priority |low-priority )?task (?:for |to )?["']?([^"'.]+)["']?/i);
    if (match && match[1]) {
      title = match[1].trim();
    }

    const priority: TaskPriority = lower.includes('high') ? 'HIGH' : lower.includes('low') ? 'LOW' : 'MEDIUM';
    const category = lower.includes('auth') ? 'Security' : lower.includes('ui') || lower.includes('design') ? 'Frontend' : 'Backend';

    const created = await createTask({
      project_id: projectId,
      title,
      description: `Task created via AI Assistant based on user prompt: "${userMessage}"`,
      priority,
      category,
      status: 'TODO',
    });

    actionsExecuted.push({
      toolName: 'create_task',
      details: `Created task: "${created.title}" [Priority: ${created.priority}]`,
      result: { id: created.id, title: created.title },
    });

    return {
      message: `Done! I have created the task **"${created.title}"** with **${created.priority}** priority in the **${created.category}** category. It is now listed in your TODO board.`,
      actionsExecuted,
    };
  }

  if (lower.includes('next') || lower.includes('recommend') || lower.includes('what should i work on')) {
    actionsExecuted.push({
      toolName: 'get_tasks',
      details: `Analyzed ${tasks.length} project tasks`,
    });

    const pending = tasks.filter((t) => t.status !== 'COMPLETED');
    const highPending = pending.filter((t) => t.priority === 'HIGH');
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS');

    if (inProgress.length > 0) {
      return {
        message: `You currently have **"${inProgress[0].title}"** in progress. I recommend finishing or pushing that through before starting new tasks.\n\nNext in line: **${highPending[0]?.title || pending[0]?.title || 'All high-priority tasks complete!'}**`,
        actionsExecuted,
      };
    }

    if (highPending.length > 0) {
      return {
        message: `Your highest-priority pending task is **"${highPending[0].title}"** (${highPending[0].category}). I strongly recommend tackling this next to unblock dependent deliverables.`,
        actionsExecuted,
      };
    }

    if (pending.length > 0) {
      return {
        message: `All high-priority tasks are done! The next recommended task is **"${pending[0].title}"** (${pending[0].category}).`,
        actionsExecuted,
      };
    }

    return {
      message: `🎉 All tasks for **${project?.name || 'this project'}** are completed! You can generate new tasks or create additional stretch goals anytime.`,
      actionsExecuted,
    };
  }

  if (lower.includes('status') || lower.includes('stats') || lower.includes('progress') || lower.includes('summary')) {
    const stats = project?.stats || { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, todoTasks: 0, highPriorityTasks: 0, completionPercentage: 0 };
    actionsExecuted.push({
      toolName: 'get_project_statistics',
      details: `Calculated metrics for "${project?.name}"`,
    });

    return {
      message: `📊 **Project Status Summary:**\n- **Completion:** ${stats.completionPercentage}%\n- **Total Tasks:** ${stats.totalTasks}\n- **Completed:** ${stats.completedTasks}\n- **In Progress:** ${stats.inProgressTasks}\n- **To Do:** ${stats.todoTasks}\n- **High Priority Pending:** ${stats.highPriorityTasks}`,
      actionsExecuted,
    };
  }

  // General helpful response
  actionsExecuted.push({
    toolName: 'get_project_details',
    details: `Context fetched for ${project?.name}`,
  });

  return {
    message: `I'm your AI Project Manager for **${project?.name || 'this project'}**. I have full context of your tasks and board status. You can ask me to:\n- 🎯 *Recommend what to work on next*\n- ➕ *Create a high-priority task (e.g. "Create a task for user onboarding")*\n- 📈 *Summarize progress and statistics*\n- 🔄 *Update or reorganize tasks*`,
    actionsExecuted,
  };
}
