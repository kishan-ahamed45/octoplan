'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StatsCards } from '@/components/StatsCards';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskListView } from '@/components/TaskListView';
import { AIPlannerModal } from '@/components/AIPlannerModal';
import { AIAssistantDrawer } from '@/components/AIAssistantDrawer';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { ProjectWithStats, Task, TaskStatus } from '@/types';
import {
  ArrowLeft,
  Sparkles,
  Bot,
  Plus,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailsPage({ params }: ProjectPageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [project, setProject] = useState<ProjectWithStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'kanban' | 'list'
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Modals & Drawers state
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>('TODO');

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pRes, tRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks`),
      ]);

      const pData = await pRes.json();
      const tData = await tRes.json();

      if (!pData.success || !pData.data) {
        throw new Error(pData.error || 'Project not found');
      }

      setProject(pData.data);
      setTasks(tData.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Status transition handler
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Refresh project stats
      const pRes = await fetch(`/api/projects/${projectId}`);
      const pData = await pRes.json();
      if (pData.success) setProject(pData.data);
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchProjectData();
    }
  };

  const handleUpdateTask = async (taskId: string, input: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      fetchProjectData();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Refresh stats
      const pRes = await fetch(`/api/projects/${projectId}`);
      const pData = await pRes.json();
      if (pData.success) setProject(pData.data);
    } catch (err) {
      console.error('Failed to delete task:', err);
      fetchProjectData();
    }
  };

  const handleOpenAddTaskWithStatus = (status: TaskStatus = 'TODO') => {
    setDefaultTaskStatus(status);
    setIsAddTaskOpen(true);
  };

  if (loading && !project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 p-4 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <h2 className="text-sm font-bold">Project Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'The requested project could not be found.'}</p>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Projects</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar onOpenCreateModal={() => setIsAddTaskOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Jira Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 font-medium">
            Projects
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
            {project.name}
          </span>
        </div>

        {/* Project Header Bar */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {project.name.slice(0, 2).toUpperCase()}
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {project.name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-8">
              {project.description}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pl-8 lg:pl-0">
            {/* AI Backlog Planner */}
            <button
              onClick={() => setIsPlannerOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>AI Backlog Planner</span>
            </button>

            {/* AI Agent Assistant */}
            <button
              onClick={() => setIsAgentOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-sm"
            >
              <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>AI Agent</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Create Task Button */}
            <button
              onClick={() => handleOpenAddTaskWithStatus('TODO')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Issue</span>
            </button>
          </div>
        </div>

        {/* Project Statistics */}
        <StatsCards stats={project.stats} />

        {/* Board View Switcher Toolbar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Sprint Board
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {tasks.length} issues
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table / List</span>
            </button>
          </div>
        </div>

        {/* Main Task View */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onUpdateStatus={handleUpdateStatus}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onOpenAddTask={handleOpenAddTaskWithStatus}
          />
        ) : (
          <TaskListView
            tasks={tasks}
            onUpdateStatus={handleUpdateStatus}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </main>

      {/* AI Backlog Planner Modal */}
      <AIPlannerModal
        project={project}
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        onPlanApplied={fetchProjectData}
      />

      {/* AI Assistant Chat Drawer */}
      <AIAssistantDrawer
        project={project}
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        onProjectDataChanged={fetchProjectData}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={project.id}
        defaultStatus={defaultTaskStatus}
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onTaskCreated={fetchProjectData}
      />
    </div>
  );
}
