import { desc, eq, count } from 'drizzle-orm';
import {
  pgDb,
  isDatabaseConfigured,
  users,
  projects,
  tasks,
  activityLogs,
} from '@/db';
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

// Local file-backed database storage fallback when DATABASE_URL is not configured
const LOCAL_DB_PATH = process.env.OCTOPLAN_DB_PATH
  ? path.resolve(process.env.OCTOPLAN_DB_PATH)
  : path.join(process.cwd(), '.local-db.json');

interface LocalDB {
  users: UserRecord[];
  projects: Project[];
  tasks: Task[];
  activity_logs: ActivityLog[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

function normalizeTask(row: typeof tasks.$inferSelect): Task {
  return {
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    description: row.description,
    status: (['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(row.status)
      ? row.status
      : 'TODO') as TaskStatus,
    priority: (['LOW', 'MEDIUM', 'HIGH'].includes(row.priority)
      ? row.priority
      : 'MEDIUM') as TaskPriority,
    category: row.category,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function getInitialLocalDB(): LocalDB {
  const initialProjectId = 'demo-project-ecom-101';
  const now = new Date().toISOString();

  const demoProject: Project = {
    id: initialProjectId,
    name: 'AI E-Commerce Platform',
    description:
      'A modern AI-powered e-commerce platform with automated product recommendations, smart shopping cart, and one-click checkout.',
    created_at: now,
    updated_at: now,
  };

  const demoTasks: Task[] = [
    {
      id: 'task-1',
      project_id: initialProjectId,
      title: 'Design PostgreSQL Database Schema',
      description:
        'Set up tables for users, products, orders, and payment tracking with relational foreign keys.',
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
      description:
        'Configure secure user signup, login, and session tokens with built-in auth.',
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
      description:
        'Create responsive grid with filtering by price, category, and real-time search.',
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
      description:
        'Generate real-time personalized product suggestions using vector similarity.',
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

function calculateStats(taskList: Task[]): ProjectStats {
  const totalTasks = taskList.length;
  const completedTasks = taskList.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = taskList.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoTasks = taskList.filter((t) => t.status === 'TODO').length;
  const highPriorityTasks = taskList.filter(
    (t) => t.priority === 'HIGH' && t.status !== 'COMPLETED'
  ).length;
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
// Project Operations
// ==========================================

export async function getProjects(): Promise<ProjectWithStats[]> {
  if (isDatabaseConfigured && pgDb) {
    const [allProjects, allTaskRows] = await Promise.all([
      pgDb.select().from(projects).orderBy(desc(projects.created_at)),
      pgDb.select().from(tasks),
    ]);

    const allTasks = allTaskRows.map(normalizeTask);
    return allProjects.map((p) => {
      const pTasks = allTasks.filter((t) => t.project_id === p.id);
      return {
        ...p,
        stats: calculateStats(pTasks),
      };
    });
  }

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
  if (isDatabaseConfigured && pgDb) {
    if (!isValidUuid(id)) return null;

    const [project] = await pgDb
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!project) return null;

    const taskRows = await pgDb.select().from(tasks).where(eq(tasks.project_id, id));
    return {
      ...project,
      stats: calculateStats(taskRows.map(normalizeTask)),
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

  if (isDatabaseConfigured && pgDb) {
    const [created] = await pgDb
      .insert(projects)
      .values({
        name: input.name.trim(),
        description: input.description.trim(),
      })
      .returning();

    await logActivity(created.id, 'PROJECT_CREATED', `Project "${created.name}" created.`);
    return created;
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

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project | null> {
  const now = new Date().toISOString();

  if (isDatabaseConfigured && pgDb) {
    if (!isValidUuid(id)) return null;

    const updateData: { name?: string; description?: string; updated_at: string } = {
      updated_at: now,
    };
    if (input.name) updateData.name = input.name.trim();
    if (input.description) updateData.description = input.description.trim();

    const [updated] = await pgDb
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    return updated || null;
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
  if (isDatabaseConfigured && pgDb) {
    if (!isValidUuid(id)) return false;
    await pgDb.delete(projects).where(eq(projects.id, id));
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
  if (isDatabaseConfigured && pgDb) {
    if (!isValidUuid(projectId)) return [];
    const rows = await pgDb
      .select()
      .from(tasks)
      .where(eq(tasks.project_id, projectId))
      .orderBy(desc(tasks.created_at));

    return rows.map(normalizeTask);
  }

  const db = readLocalDB();
  return db.tasks
    .filter((t) => t.project_id === projectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getTaskById(id: string): Promise<Task | null> {
  if (isDatabaseConfigured && pgDb) {
    if (!isValidUuid(id)) return null;
    const [row] = await pgDb.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return row ? normalizeTask(row) : null;
  }

  const db = readLocalDB();
  return db.tasks.find((t) => t.id === id) || null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const now = new Date().toISOString();
  const validStatus: TaskStatus =
    input.status && ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(input.status)
      ? input.status
      : 'TODO';
  const validPriority: TaskPriority =
    input.priority && ['LOW', 'MEDIUM', 'HIGH'].includes(input.priority)
      ? input.priority
      : 'MEDIUM';

  if (isDatabaseConfigured && pgDb) {
    const [created] = await pgDb
      .insert(tasks)
      .values({
        project_id: input.project_id,
        title: input.title.trim(),
        description: input.description?.trim() || '',
        status: validStatus,
        priority: validPriority,
        category: input.category?.trim() || 'General',
      })
      .returning();

    const task = normalizeTask(created);
    await logActivity(
      input.project_id,
      'TASK_CREATED',
      `Created task: "${task.title}" [${task.priority}]`
    );
    return task;
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
  await logActivity(
    input.project_id,
    'TASK_CREATED',
    `Created task: "${newTask.title}" [${newTask.priority}]`
  );
  return newTask;
}

export async function createBatchTasks(
  projectId: string,
  tasksInput: Omit<CreateTaskInput, 'project_id'>[]
): Promise<Task[]> {
  const created: Task[] = [];
  for (const t of tasksInput) {
    const task = await createTask({
      ...t,
      project_id: projectId,
    });
    created.push(task);
  }
  await logActivity(
    projectId,
    'AI_PLAN_APPLIED',
    `Generated and added ${created.length} tasks via AI Plan.`
  );
  return created;
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<Task | null> {
  const now = new Date().toISOString();

  if (isDatabaseConfigured && pgDb) {
    if (!isValidUuid(id)) return null;

    const updatePayload: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      category?: string;
      updated_at: string;
    } = { updated_at: now };

    if (input.title !== undefined) updatePayload.title = input.title.trim();
    if (input.description !== undefined) updatePayload.description = input.description.trim();
    if (input.status && ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(input.status)) {
      updatePayload.status = input.status;
    }
    if (input.priority && ['LOW', 'MEDIUM', 'HIGH'].includes(input.priority)) {
      updatePayload.priority = input.priority;
    }
    if (input.category !== undefined) updatePayload.category = input.category.trim();

    const [updated] = await pgDb
      .update(tasks)
      .set(updatePayload)
      .where(eq(tasks.id, id))
      .returning();

    if (!updated) return null;
    const task = normalizeTask(updated);
    await logActivity(
      task.project_id,
      'TASK_UPDATED',
      `Updated task "${task.title}" -> Status: ${task.status}`
    );
    return task;
  }

  const db = readLocalDB();
  const index = db.tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const existing = db.tasks[index];
  const updated: Task = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
    ...(input.status && ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(input.status)
      ? { status: input.status }
      : {}),
    ...(input.priority && ['LOW', 'MEDIUM', 'HIGH'].includes(input.priority)
      ? { priority: input.priority }
      : {}),
    ...(input.category !== undefined ? { category: input.category.trim() } : {}),
    updated_at: now,
  };

  db.tasks[index] = updated;
  writeLocalDB(db);
  await logActivity(
    updated.project_id,
    'TASK_UPDATED',
    `Updated task "${updated.title}" -> Status: ${updated.status}`
  );
  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  const task = await getTaskById(id);
  if (!task) return false;

  if (isDatabaseConfigured && pgDb) {
    if (!isValidUuid(id)) return false;
    await pgDb.delete(tasks).where(eq(tasks.id, id));
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

export async function logActivity(
  projectId: string,
  action: string,
  description: string
): Promise<ActivityLog> {
  const now = new Date().toISOString();

  if (isDatabaseConfigured && pgDb) {
    const [created] = await pgDb
      .insert(activityLogs)
      .values({
        project_id: projectId,
        action,
        description,
      })
      .returning();

    return created;
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
  if (isDatabaseConfigured && pgDb) {
    if (!isValidUuid(projectId)) return [];
    return pgDb
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.project_id, projectId))
      .orderBy(desc(activityLogs.created_at))
      .limit(20);
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

  if (isDatabaseConfigured && pgDb) {
    const [user] = await pgDb
      .select()
      .from(users)
      .where(eq(users.email, normalized))
      .limit(1);

    return user || null;
  }

  const db = readLocalDB();
  return db.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  if (isDatabaseConfigured && pgDb) {
    if (!isValidUuid(id)) return null;
    const [user] = await pgDb
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  }

  const db = readLocalDB();
  return db.users.find((u) => u.id === id) || null;
}

export async function getUserCount(): Promise<number> {
  if (isDatabaseConfigured && pgDb) {
    const [result] = await pgDb.select({ value: count() }).from(users);
    return result?.value || 0;
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

  if (isDatabaseConfigured && pgDb) {
    const [created] = await pgDb
      .insert(users)
      .values({
        name: input.name.trim(),
        email: normalizedEmail,
        password_hash: input.password_hash,
        role,
      })
      .returning();

    return created;
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

  if (isDatabaseConfigured && pgDb) {
    const demo = initial.projects[0];
    const [createdProject] = await pgDb
      .insert(projects)
      .values({
        name: demo.name,
        description: demo.description,
      })
      .returning();

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
