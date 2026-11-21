import { GoogleGenAI, Type, FunctionDeclaration, Content } from '@google/genai';
import {
  getProjectById,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from './db';
import { GeneratePlanResponse, TaskPriority, TaskStatus } from '@/types';

const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || '').trim().replace(/\/$/, '');
const ollamaModel = (process.env.OLLAMA_MODEL || 'llama3.1').trim();
const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
const openRouterApiKey = (process.env.OPENROUTER_API_KEY || '').trim();
const openRouterModel = (process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free').trim();

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

interface OpenAICompatibleConfig {
  endpoint: string;
  model: string;
  apiKey?: string;
  extraHeaders?: Record<string, string>;
}

interface OpenAIToolCall {
  id: string;
  function?: {
    name?: string;
    arguments?: string | Record<string, unknown>;
  };
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: OpenAIToolCall[];
    };
  }>;
}

function getOpenAICompatibleConfigs(): OpenAICompatibleConfig[] {
  const configs: OpenAICompatibleConfig[] = [];

  if (ollamaBaseUrl) {
    configs.push({
      endpoint: `${ollamaBaseUrl}/v1/chat/completions`,
      model: ollamaModel,
    });
  }

  if (openRouterApiKey) {
    configs.push({
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: openRouterModel,
      apiKey: openRouterApiKey,
      extraHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'OctoPlan',
      },
    });
  }

  return configs;
}

async function callOpenAICompatibleChat(
  config: OpenAICompatibleConfig,
  payload: Record<string, unknown>
): Promise<OpenAIChatResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.extraHeaders,
  };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const res = await fetch(config.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      ...payload,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`AI provider error (${res.status}): ${errText}`);
  }

  return res.json();
}

function parseJsonFromContent(content: string): GeneratePlanResponse | null {
  try {
    const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    const jsonText =
      firstBrace !== -1 && lastBrace !== -1 ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;
    const parsed = JSON.parse(jsonText) as GeneratePlanResponse;
    if (parsed && Array.isArray(parsed.tasks)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// ==========================================
// 1. AI Project Planner
// ==========================================

export async function generateProjectPlan(
  projectName: string,
  projectDescription: string
): Promise<GeneratePlanResponse> {
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
Also provide a concise 2-sentence project overview.

Return STRICT JSON in the following schema:
{
  "project_overview": "string",
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "category": "string"
    }
  ]
}`;

  // 1. Try OpenAI-compatible providers (Ollama local AI, then OpenRouter)
  for (const config of getOpenAICompatibleConfigs()) {
    try {
      const data = await callOpenAICompatibleChat(config, {
        messages: [
          {
            role: 'system',
            content: 'You are an expert software architect. You output ONLY valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = data.choices?.[0]?.message?.content;
      if (typeof content === 'string') {
        const parsed = parseJsonFromContent(content);
        if (parsed) return parsed;
      }
    } catch (err) {
      console.error(`Plan generation error (${config.endpoint}):`, err);
    }
  }

  // 2. Try Google Gemini direct if configured
  if (ai && geminiApiKey) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              project_overview: { type: Type.STRING },
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

      if (response.text) {
        return JSON.parse(response.text) as GeneratePlanResponse;
      }
    } catch (error) {
      console.error('Gemini plan generation error:', error);
    }
  }

  // 3. Deterministic offline fallback
  return getFallbackPlan(projectName);
}

function getFallbackPlan(name: string): GeneratePlanResponse {
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
        title: 'Integrate Webhooks & Background Jobs',
        description: 'Connect notification dispatchers, async pipelines, or external integrations.',
        priority: 'MEDIUM',
        category: 'Full Stack',
      },
      {
        title: 'End-to-End Testing & Docker Deployment',
        description: 'Perform integration validation and configure automated self-hosted container deployment.',
        priority: 'MEDIUM',
        category: 'DevOps',
      },
    ],
  };
}

// ==========================================
// 2. AI Agent Tool Declarations & Execution
// ==========================================

const openAITools = [
  {
    type: 'function',
    function: {
      name: 'get_project_details',
      description: 'Retrieve details and statistics for current project.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tasks',
      description: 'Retrieve all tasks associated with current project.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project_statistics',
      description: 'Calculate and return current project completion percentage and pending stats.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task in the database for the project.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The title of the task.' },
          description: { type: 'string', description: 'Description of the task.' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Priority.' },
          category: { type: 'string', description: 'Category (e.g. Backend, Frontend, Security).' },
          status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'], description: 'Status (default TODO).' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Update an existing task status, priority, or details.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Unique ID of the task.' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'] },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          category: { type: 'string' },
        },
        required: ['taskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_task',
      description: 'Delete a task from the project.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'The ID of the task to delete.' },
        },
        required: ['taskId'],
      },
    },
  },
];

const geminiFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_project_details',
    description: 'Retrieve details and statistics for current project.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'get_tasks',
    description: 'Retrieve all tasks associated with current project.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'get_project_statistics',
    description: 'Calculate and return current project completion percentage and pending stats.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'create_task',
    description: 'Create a new task in the database for the project.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'The title of the task.' },
        description: { type: Type.STRING, description: 'Description of the task.' },
        priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Priority.' },
        category: { type: Type.STRING, description: 'Category (e.g. Backend, Frontend, Security).' },
        status: { type: Type.STRING, enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'], description: 'Status (default TODO).' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task status, priority, or details.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: { type: Type.STRING, description: 'Unique ID of the task.' },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        status: { type: Type.STRING, enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'] },
        priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
        category: { type: Type.STRING },
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
        taskId: { type: Type.STRING, description: 'The ID of the task to delete.' },
      },
      required: ['taskId'],
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

  const project = await getProjectById(projectId);
  if (!project) {
    return { message: 'Error: Project not found.', actionsExecuted: [] };
  }

  async function executeTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    switch (toolName) {
      case 'get_project_details': {
        const p = await getProjectById(projectId);
        actionsExecuted.push({
          toolName: 'get_project_details',
          details: `Retrieved project context for "${p?.name}"`,
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
          details: `Calculated completion (${p?.stats.completionPercentage}%)`,
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
            : 'Task not found',
          result: updated ? { id: updated.id, status: updated.status } : null,
        });

        return { success: Boolean(updated), updatedTask: updated };
      }
      case 'delete_task': {
        const taskId = String(args.taskId);
        const ok = await deleteTask(taskId);
        actionsExecuted.push({
          toolName: 'delete_task',
          details: ok ? `Deleted task ID ${taskId}` : 'Failed to delete task',
        });
        return { success: ok };
      }
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  const systemInstruction = `You are OctoPlan AI, an elite, proactive AI Project Manager & Agile Lead for "${project.name}".
Project Description: "${project.description}"
Active Project ID: "${projectId}"

You have direct access to database tools (get_tasks, create_task, update_task, delete_task, get_project_statistics).
Guidelines:
1. When asked what to work on next, call get_tasks(), analyze incomplete HIGH-priority tasks, and provide a clear recommendation.
2. When asked to create, update, or delete tasks, use the tools immediately and confirm the action.
3. Be professional, direct, and concise.`;

  // 1. Try OpenAI-compatible providers (Ollama local AI, then OpenRouter)
  for (const config of getOpenAICompatibleConfigs()) {
    try {
      const openAIMessages: Record<string, unknown>[] = [
        { role: 'system', content: systemInstruction },
        ...chatHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
      ];

      for (let loop = 0; loop < 4; loop++) {
        const data = await callOpenAICompatibleChat(config, {
          messages: openAIMessages,
          tools: openAITools,
          tool_choice: 'auto',
        });

        const message = data.choices?.[0]?.message;
        if (!message) break;

        if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
          openAIMessages.push(message);
          for (const toolCall of message.tool_calls) {
            const funcName = toolCall.function?.name || '';
            let args: Record<string, unknown> = {};
            try {
              const rawArgs = toolCall.function?.arguments;
              args = typeof rawArgs === 'string' ? JSON.parse(rawArgs || '{}') : (rawArgs || {});
            } catch {}

            const toolResult = await executeTool(funcName, args);
            openAIMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });
          }
        } else {
          return {
            message: message.content || 'I have completed your request.',
            actionsExecuted,
          };
        }
      }
    } catch (err) {
      console.error(`Agent error (${config.endpoint}):`, err);
    }
  }

  // 2. Try Google Gemini direct with function calling
  if (ai && geminiApiKey) {
    try {
      const contents: Content[] = [
        ...chatHistory.slice(-6).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        { role: 'user', parts: [{ text: userMessage }] },
      ];

      for (let loop = 0; loop < 4; loop++) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: geminiFunctionDeclarations }],
          },
        });

        const calls = response.functionCalls;
        if (calls && calls.length > 0) {
          const modelParts = response.candidates?.[0]?.content?.parts;
          if (modelParts) {
            contents.push({ role: 'model', parts: modelParts });
          }

          const toolResponseParts = [];
          for (const call of calls) {
            const toolResult = await executeTool(
              call.name || '',
              (call.args || {}) as Record<string, unknown>
            );
            toolResponseParts.push({
              functionResponse: {
                name: call.name || '',
                response: toolResult,
              },
            });
          }
          contents.push({ role: 'user', parts: toolResponseParts });
        } else {
          return {
            message: response.text || 'I have completed your request.',
            actionsExecuted,
          };
        }
      }
    } catch (err) {
      console.error('Gemini Agent Error:', err);
    }
  }

  // 3. Fallback to smart rule-based agent
  return runFallbackAgent(projectId, userMessage, actionsExecuted);
}

async function runFallbackAgent(
  projectId: string,
  userMessage: string,
  existingActions: AgentExecutionResult['actionsExecuted'] = []
): Promise<AgentExecutionResult> {
  const lower = userMessage.toLowerCase();
  const actionsExecuted = [...existingActions];
  const project = await getProjectById(projectId);
  const tasks = await getTasks(projectId);

  if (lower.includes('create') || lower.includes('add task')) {
    let title = 'New Feature Implementation';
    const match =
      userMessage.match(/(?:task (?:for|to|called)?\s*["']?([^"'.]+)["']?)/i) ||
      userMessage.match(
        /create (?:a )?(?:high-priority |medium-priority |low-priority )?task (?:for |to )?["']?([^"'.]+)["']?/i
      );
    if (match && match[1]) {
      title = match[1].trim();
    }

    const priority: TaskPriority = lower.includes('high')
      ? 'HIGH'
      : lower.includes('low')
      ? 'LOW'
      : 'MEDIUM';
    const category = lower.includes('auth')
      ? 'Security'
      : lower.includes('ui') || lower.includes('design')
      ? 'Frontend'
      : 'Backend';

    const created = await createTask({
      project_id: projectId,
      title,
      description: `Task created via OctoPlan AI Assistant based on prompt: "${userMessage}"`,
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
      message: `Done! I have created the task **"${created.title}"** with **${created.priority}** priority in the **${created.category}** category. It is now live in your TODO column.`,
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
        message: `You currently have **"${inProgress[0].title}"** in progress. I recommend completing that before starting new tasks.\n\nNext in line: **${highPending[0]?.title || pending[0]?.title || 'All high-priority tasks complete!'}**`,
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
    const stats = project?.stats || {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      todoTasks: 0,
      highPriorityTasks: 0,
      completionPercentage: 0,
    };
    actionsExecuted.push({
      toolName: 'get_project_statistics',
      details: `Calculated metrics for "${project?.name}"`,
    });

    return {
      message: `📊 **Project Status Summary:**\n- **Completion:** ${stats.completionPercentage}%\n- **Total Tasks:** ${stats.totalTasks}\n- **Completed:** ${stats.completedTasks}\n- **In Progress:** ${stats.inProgressTasks}\n- **To Do:** ${stats.todoTasks}\n- **High Priority Pending:** ${stats.highPriorityTasks}`,
      actionsExecuted,
    };
  }

  actionsExecuted.push({
    toolName: 'get_project_details',
    details: `Context fetched for ${project?.name}`,
  });

  return {
    message: `I'm OctoPlan AI for **${project?.name || 'this project'}**. I have full context of your tasks and board status. You can ask me to:\n- 🎯 *Recommend what to work on next*\n- ➕ *Create a high-priority task (e.g. "Create a task for user onboarding")*\n- 📈 *Summarize progress and statistics*\n- 🔄 *Update or reorganize tasks*`,
    actionsExecuted,
  };
}
