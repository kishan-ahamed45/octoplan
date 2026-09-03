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
import { ProjectWithStats, Task, TaskPriority, TaskStatus } from '@/types';
import {
  ArrowLeft,
  Sparkles,
  Bot,
  Plus,
  LayoutGrid,
  List,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
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

  // Handler for updating status (TODO -> IN_PROGRESS -> COMPLETED)
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
      // Revert on error
      fetchProjectData();
    }
  };

  // Handler for updating task details
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

  // Handler for deleting a task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading project workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-4 text-center">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <h2 className="text-base font-bold">Project Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'The requested project could not be found.'}</p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 text-xs font-semibold text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </Link>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Project ID:</span>
            <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {project.id.slice(0, 12)}...
            </span>
          </div>
        </div>

        {/* Project Header Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* AI Plan Generator Button */}
            <button
              onClick={() => setIsPlannerOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Generate AI Plan</span>
            </button>

            {/* AI Assistant Chat Toggle */}
            <button
              onClick={() => setIsAgentOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition-all shadow-sm relative group"
            >
              <Bot className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
              <span>AI Agent Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </button>

            {/* Add Task Button */}
            <button
              onClick={() => handleOpenAddTaskWithStatus('TODO')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Project Statistics Bar */}
        <StatsCards stats={project.stats} />

        {/* Tasks Section Header & View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Task Management</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {tasks.length} Tasks
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Track progress, manage priority queues, and coordinate with the AI agent
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
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

      {/* AI Project Planner Modal */}
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
