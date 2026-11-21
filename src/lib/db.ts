import { supabase, isSupabaseConfigured } from './supabase';
import {
  Project,
  Task,
  ProjectStats,
  ProjectWithStats,
  ActivityLog,
  CreateProjectInput,
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  TaskPriority,
  UserRecord,
} from '@/types';
import fs from 'fs';
import path from 'path';

// Local file-backed database storage fallback
const LOCAL_DB_PATH = process.env.OCTOPLAN_DB_PATH
  ? path.resolve(process.env.OCTOPLAN_DB_PATH)
  : path.join(process.cwd(), '.local-db.json');

interface LocalDB {
  users: UserRecord[];
  projects: Project[];
  tasks: Task[];
  activity_logs: ActivityLog[];
}

function getInitialLocalDB(): LocalDB {
  const initialProjectId = 'demo-project-ecom-101';
  const now = new Date().toISOString();

  const demoProject: Project = {
    id: initialProjectId,
    name: 'AI E-Commerce Platform',
    description: 'A modern AI-powered e-commerce platform with automated product recommendations, smart shopping cart, and one-click checkout.',
    created_at: now,
    updated_at: now,
  };

  const demoTasks: Task[] = [
    {
      id: 'task-1',
      project_id: initialProjectId,
      title: 'Design PostgreSQL Database Schema',
      description: 'Set up tables for users, products, orders, and payment tracking with relational foreign keys.',
      status: 'COMPLETED',
      priority: 'HIGH',
      category: 'Backend',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-2',
      project_id: initialProjectId,
      title: 'Implement OAuth & JWT Authentication',
      description: 'Configure secure user signup, login, and session tokens with NextAuth.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'Security',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-3',
      project_id: initialProjectId,
      title: 'Build Interactive Product Catalog',
      description: 'Create responsive grid with filtering by price, category, and real-time search.',
      status: 'TODO',
      priority: 'MEDIUM',
      category: 'Frontend',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-4',
      project_id: initialProjectId,
      title: 'Implement Stripe Checkout Integration',
      description: 'Integrate payment webhooks and order confirmation workflow.',
      status: 'TODO',
      priority: 'HIGH',
      category: 'Full Stack',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-5',
      project_id: initialProjectId,
      title: 'Add AI Recommendation Engine',
      description: 'Generate real-time personalized product suggestions using vector similarity.',
      status: 'TODO',
      priority: 'MEDIUM',
      category: 'AI / ML',
      created_at: now,
      updated_at: now,
    },
  ];

  const demoLogs: ActivityLog[] = [
    {
      id: 'log-1',
      project_id: initialProjectId,
      action: 'PROJECT_CREATED',
      description: 'Project "AI E-Commerce Platform" initialized with seed tasks.',
      created_at: now,
    },
  ];

  return {
    users: [],
    projects: [demoProject],
    tasks: demoTasks,
    activity_logs: demoLogs,
  };
}

function readLocalDB(): LocalDB {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initial = getInitialLocalDB();
      fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    const parsed = JSON.parse(data) as Partial<LocalDB>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      activity_logs: Array.isArray(parsed.activity_logs) ? parsed.activity_logs : [],
    };
  } catch {
    return getInitialLocalDB();
  }
}

function writeLocalDB(db: LocalDB): void {
  try {
    fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local DB fallback:', err);
  }
}

function calculateStats(tasks: Task[]): ProjectStats {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
  const highPriorityTasks = tasks.filter((t) => t.priority === 'HIGH' && t.status !== 'COMPLETED').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    highPriorityTasks,
    completionPercentage,
  };
}

// ==========================================
// Database Operations Service
// ==========================================

export async function getProjects(): Promise<ProjectWithStats[]> {
  if (isSupabaseConfigured && supabase) {
    const { data: projects, error: pError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (pError) throw new Error(pError.message);
    if (!projects) return [];

    const { data: tasks, error: tError } = await supabase.from('tasks').select('*');
    if (tError) throw new Error(tError.message);

    const allTasks: Task[] = (tasks || []) as Task[];
    return projects.map((p) => {
      const pTasks = allTasks.filter((t) => t.project_id === p.id);
      return {
        ...p,
        stats: calculateStats(pTasks),
      };
    });
  }

  // Fallback to local DB
  const db = readLocalDB();
  return db.projects
    .map((p) => {
      const pTasks = db.tasks.filter((t) => t.project_id === p.id);
      return {
        ...p,
        stats: calculateStats(pTasks),
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getProjectById(id: string): Promise<ProjectWithStats | null> {
  if (isSupabaseConfigured && supabase) {
    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (pError || !project) return null;

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id);

    return {
      ...project,
      stats: calculateStats((tasks || []) as Task[]),
    };
  }

  const db = readLocalDB();
  const project = db.projects.find((p) => p.id === id);
  if (!project) return null;

  const pTasks = db.tasks.filter((t) => t.project_id === id);
  return {
    ...project,
    stats: calculateStats(pTasks),
  };
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: input.name.trim(),
        description: input.description.trim(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    await logActivity(data.id, 'PROJECT_CREATED', `Project "${data.name}" created.`);
    return data;
  }

  const db = readLocalDB();
  const newProject: Project = {
    id: `project-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: input.name.trim(),
    description: input.description.trim(),
    created_at: now,
    updated_at: now,
  };

  db.projects.push(newProject);
  writeLocalDB(db);
  await logActivity(newProject.id, 'PROJECT_CREATED', `Project "${newProject.name}" created.`);
  return newProject;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const updateData: Partial<Project> = { updated_at: now };
    if (input.name) updateData.name = input.name.trim();
    if (input.description) updateData.description = input.description.trim();

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const db = readLocalDB();
  const index = db.projects.findIndex((p) => p.id === id);
  if (index === -1) return null;

  db.projects[index] = {
    ...db.projects[index],
    ...(input.name ? { name: input.name.trim() } : {}),
    ...(input.description ? { description: input.description.trim() } : {}),
    updated_at: now,
  };

  writeLocalDB(db);
  return db.projects[index];
}

export async function deleteProject(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  const db = readLocalDB();
  db.projects = db.projects.filter((p) => p.id !== id);
  db.tasks = db.tasks.filter((t) => t.project_id !== id);
  db.activity_logs = db.activity_logs.filter((a) => a.project_id !== id);
  writeLocalDB(db);
  return true;
}

// ==========================================
// Task Operations
// ==========================================

export async function getTasks(projectId: string): Promise<Task[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  const db = readLocalDB();
  return db.tasks
    .filter((t) => t.project_id === projectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getTaskById(id: string): Promise<Task | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  const db = readLocalDB();
  return db.tasks.find((t) => t.id === id) || null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const now = new Date().toISOString();
  const validStatus: TaskStatus = input.status && ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(input.status)
    ? input.status
    : 'TODO';
  const validPriority: TaskPriority = input.priority && ['LOW', 'MEDIUM', 'HIGH'].includes(input.priority)
    ? input.priority
    : 'MEDIUM';

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: input.project_id,
        title: input.title.trim(),
        description: input.description?.trim() || '',
        status: validStatus,
        priority: validPriority,
        category: input.category?.trim() || 'General',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    await logActivity(input.project_id, 'TASK_CREATED', `Created task: "${data.title}" [${data.priority}]`);
    return data;
  }

  const db = readLocalDB();
  const newTask: Task = {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    project_id: input.project_id,
    title: input.title.trim(),
    description: input.description?.trim() || '',
    status: validStatus,
    priority: validPriority,
    category: input.category?.trim() || 'General',
    created_at: now,
    updated_at: now,
  };

  db.tasks.push(newTask);
  writeLocalDB(db);
  await logActivity(input.project_id, 'TASK_CREATED', `Created task: "${newTask.title}" [${newTask.priority}]`);
  return newTask;
}

export async function createBatchTasks(projectId: string, tasksInput: Omit<CreateTaskInput, 'project_id'>[]): Promise<Task[]> {
  const created: Task[] = [];
  for (const t of tasksInput) {
    const task = await createTask({
      ...t,
      project_id: projectId,
    });
    created.push(task);
  }
  await logActivity(projectId, 'AI_PLAN_APPLIED', `Generated and added ${created.length} tasks via AI Plan.`);
  return created;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const updatePayload: Partial<Task> = { updated_at: now };
    if (input.title !== undefined) updatePayload.title = input.title.trim();
    if (input.description !== undefined) updatePayload.description = input.description.trim();
    if (input.status && ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(input.status)) updatePayload.status = input.status;
    if (input.priority && ['LOW', 'MEDIUM', 'HIGH'].includes(input.priority)) updatePayload.priority = input.priority;
    if (input.category !== undefined) updatePayload.category = input.category.trim();

    const { data, error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    await logActivity(data.project_id, 'TASK_UPDATED', `Updated task "${data.title}" -> Status: ${data.status}`);
    return data;
  }

  const db = readLocalDB();
  const index = db.tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const existing = db.tasks[index];
  const updated: Task = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
    ...(input.status && ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(input.status) ? { status: input.status } : {}),
    ...(input.priority && ['LOW', 'MEDIUM', 'HIGH'].includes(input.priority) ? { priority: input.priority } : {}),
    ...(input.category !== undefined ? { category: input.category.trim() } : {}),
    updated_at: now,
  };

  db.tasks[index] = updated;
  writeLocalDB(db);
  await logActivity(updated.project_id, 'TASK_UPDATED', `Updated task "${updated.title}" -> Status: ${updated.status}`);
  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  const task = await getTaskById(id);
  if (!task) return false;

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logActivity(task.project_id, 'TASK_DELETED', `Deleted task "${task.title}"`);
    return true;
  }

  const db = readLocalDB();
  db.tasks = db.tasks.filter((t) => t.id !== id);
  writeLocalDB(db);
  await logActivity(task.project_id, 'TASK_DELETED', `Deleted task "${task.title}"`);
  return true;
}

// ==========================================
// Activity Logs
// ==========================================

export async function logActivity(projectId: string, action: string, description: string): Promise<ActivityLog> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('activity_logs')
      .insert({
        project_id: projectId,
        action,
        description,
      })
      .select()
      .single();

    if (data) return data;
  }

  const db = readLocalDB();
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    project_id: projectId,
    action,
    description,
    created_at: now,
  };

  db.activity_logs.unshift(newLog);
  if (db.activity_logs.length > 50) db.activity_logs = db.activity_logs.slice(0, 50);
  writeLocalDB(db);
  return newLog;
}

export async function getActivityLogs(projectId: string): Promise<ActivityLog[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20);

    return data || [];
  }

  const db = readLocalDB();
  return db.activity_logs
    .filter((a) => a.project_id === projectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);
}

// ==========================================
// User Operations (Self-Hosted Auth)
// ==========================================

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalized)
      .single();

    if (error || !data) return null;
    return data as UserRecord;
  }

  const db = readLocalDB();
  return db.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as UserRecord;
  }

  const db = readLocalDB();
  return db.users.find((u) => u.id === id) || null;
}

export async function getUserCount(): Promise<number> {
  if (isSupabaseConfigured && supabase) {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }

  const db = readLocalDB();
  return db.users.length;
}

export async function createUser(input: {
  name: string;
  email: string;
  password_hash: string;
  role?: string;
}): Promise<UserRecord> {
  const now = new Date().toISOString();
  const normalizedEmail = input.email.trim().toLowerCase();
  const role = input.role || 'Member';

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: input.name.trim(),
        email: normalizedEmail,
        password_hash: input.password_hash,
        role,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as UserRecord;
  }

  const db = readLocalDB();
  const newUser: UserRecord = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: input.name.trim(),
    email: normalizedEmail,
    password_hash: input.password_hash,
    role,
    created_at: now,
  };

  db.users.push(newUser);
  writeLocalDB(db);
  return newUser;
}

// ==========================================
// Reset / Seed Demo Project
// ==========================================

export async function seedDemoProject(): Promise<Project> {
  const initial = getInitialLocalDB();

  if (isSupabaseConfigured && supabase) {
    const demo = initial.projects[0];
    const { data: createdProject, error: pError } = await supabase
      .from('projects')
      .insert({
        name: demo.name,
        description: demo.description,
      })
      .select()
      .single();

    if (pError) throw new Error(pError.message);

    await createBatchTasks(
      createdProject.id,
      initial.tasks.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        category: t.category,
      }))
    );

    return createdProject;
  }

  const existing = readLocalDB();
  const nextDb: LocalDB = {
    users: existing.users,
    projects: initial.projects,
    tasks: initial.tasks,
    activity_logs: initial.activity_logs,
  };
  writeLocalDB(nextDb);
  return nextDb.projects[0];
}
