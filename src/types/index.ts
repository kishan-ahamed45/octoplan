export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  highPriorityTasks: number;
  completionPercentage: number;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  action: string;
  description: string;
  created_at: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionsExecuted?: {
    toolName: string;
    details: string;
    result?: Record<string, unknown> | null;
  }[];
}

export interface GeneratePlanResponse {
  project_overview: string;
  tasks: {
    title: string;
    description: string;
    priority: TaskPriority;
    category: string;
  }[];
}
