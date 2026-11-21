'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { StatsCards } from '@/components/StatsCards';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskListView } from '@/components/TaskListView';
import { AIPlannerModal } from '@/components/AIPlannerModal';
import { AIAssistantDrawer } from '@/components/AIAssistantDrawer';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { AuthScreen } from '@/components/AuthScreen';
import { useAuth } from '@/context/AuthContext';
import { ProjectWithStats, Task, TaskStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Sparkles,
  Bot,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailsPage({ params }: ProjectPageProps) {
  const { isSignedIn, loading: authLoading } = useAuth();
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<ProjectWithStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>('TODO');

  const fetchProjectData = useCallback(async () => {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;

    Promise.all([
      fetch(`/api/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/tasks`).then((r) => r.json()),
    ])
      .then(([pData, tData]) => {
        if (cancelled) return;
        if (!pData.success || !pData.data) {
          setError(pData.error || 'Project not found');
          return;
        }
        setError(null);
        setProject(pData.data);
        setTasks(tData.data || []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load project details');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, isSignedIn]);

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
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

  if (authLoading || !isSignedIn) {
    return <AuthScreen />;
  }

  if (loading && !project) {
    return (
      <AppShell
        activeProjectId={projectId}
        breadcrumb={<span className="text-xs text-muted-foreground">Loading project...</span>}
      >
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 text-foreground animate-spin" />
          <p className="text-xs text-muted-foreground">Loading workspace...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !project) {
    return (
      <AppShell
        activeProjectId={projectId}
        breadcrumb={<span className="text-xs text-muted-foreground">Project Not Found</span>}
      >
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-3 p-4 text-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <h2 className="text-sm font-semibold">Project Not Found</h2>
          <p className="text-xs text-muted-foreground">
            {error || 'The requested project could not be found.'}
          </p>
          <Link href="/">
            <Button size="sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Projects</span>
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeProjectId={project.id}
      breadcrumb={
        <div className="flex items-center space-x-1.5 text-xs">
          <Link href="/" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
            Projects
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-semibold text-foreground truncate">{project.name}</span>
        </div>
      }
      primaryActionLabel="New Issue"
      onPrimaryAction={() => handleOpenAddTaskWithStatus('TODO')}
      onOpenPlanner={() => setIsPlannerOpen(true)}
      onOpenAgent={() => setIsAgentOpen(true)}
    >
      <div className="space-y-4">
        {/* Compact Project Header Row */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-start space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">
                  {project.name}
                </h1>
                <Badge variant="secondary" className="text-[11px] tabular-nums">
                  {tasks.length} issues
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {project.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value === 'list' ? 'list' : 'kanban')}
            >
              <TabsList>
                <TabsTrigger value="kanban" className="text-xs px-2.5 gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Board</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="text-xs px-2.5 gap-1.5">
                  <List className="w-3.5 h-3.5" />
                  <span>List</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button variant="outline" size="sm" onClick={() => setIsPlannerOpen(true)}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Planner</span>
            </Button>

            <Button variant="secondary" size="sm" onClick={() => setIsAgentOpen(true)}>
              <Bot className="w-3.5 h-3.5" />
              <span>OctoPlan AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </Button>
          </div>
        </div>

        {/* Single Compact 5-Cell Bento Metrics Strip */}
        <StatsCards stats={project.stats} />

        {/* Full-Width Sprint Board / Table View */}
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
      </div>

      <AIPlannerModal
        project={project}
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        onPlanApplied={fetchProjectData}
      />

      <AIAssistantDrawer
        project={project}
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        onProjectDataChanged={fetchProjectData}
      />

      <CreateTaskModal
        key={`${defaultTaskStatus}-${isAddTaskOpen}`}
        projectId={project.id}
        defaultStatus={defaultTaskStatus}
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onTaskCreated={fetchProjectData}
      />
    </AppShell>
  );
}
