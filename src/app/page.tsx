'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { AuthScreen } from '@/components/AuthScreen';
import { useAuth } from '@/context/AuthContext';
import { ProjectWithStats } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FolderKanban,
  ArrowUpRight,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Search,
} from 'lucide-react';

export default function DashboardPage() {
  const { isSignedIn, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;

    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setProjects(data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch projects:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const handleDeleteProject = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${name}" and all its issues?`)) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const totalProjects = projects.length;
  const totalTasks = projects.reduce((acc, p) => acc + (p.stats?.totalTasks || 0), 0);
  const totalCompleted = projects.reduce((acc, p) => acc + (p.stats?.completedTasks || 0), 0);
  const totalHighPriority = projects.reduce((acc, p) => acc + (p.stats?.highPriorityTasks || 0), 0);
  const overallPercentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || !isSignedIn) {
    return <AuthScreen />;
  }

  return (
    <AppShell
      projects={projects}
      breadcrumb={
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-foreground">Projects Directory</span>
          <Badge variant="secondary" className="text-[11px] tabular-nums">
            {totalProjects}
          </Badge>
        </div>
      }
      primaryActionLabel="New Project"
      onPrimaryAction={() => setCreateModalOpen(true)}
      onSeedSuccess={fetchProjects}
    >
      <div className="space-y-6">
        {/* Global Bento Metrics */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
          <Card size="sm">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums mt-0.5">
                  {totalProjects}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <FolderKanban className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Backlog Issues</p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums mt-0.5">
                  {totalTasks}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Layers className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted-foreground">Completion</p>
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">
                  {overallPercentage}%
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {totalCompleted}/{totalTasks} done
                </span>
              </div>
              <Progress value={overallPercentage} />
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">High Priority Open</p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums mt-0.5">
                  {totalHighPriority}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Active Workspaces
            </h2>
            <p className="text-xs text-muted-foreground">
              Open a sprint board to manage issues or run the AI Backlog Planner.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs bg-background"
            />
          </div>
        </div>

        {/* Full-Width Project Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">No projects found</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create your project space or click &ldquo;Seed Demo&rdquo; in the top bar.
                </p>
              </div>
              <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group block">
                <Card className="h-full justify-between transition-all hover:ring-foreground/25 hover:shadow-md">
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs flex-shrink-0">
                          {project.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate group-hover:underline underline-offset-4">
                            {project.name}
                          </h3>
                          <p className="text-[11px] text-muted-foreground tabular-nums">
                            {project.stats?.totalTasks || 0} issues
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                        disabled={deletingId === project.id}
                        title="Delete Project"
                        className="text-muted-foreground hover:text-destructive opacity-60 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </CardContent>

                  <CardContent className="space-y-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 text-muted-foreground tabular-nums">
                        <span>{project.stats?.todoTasks || 0} To Do</span>
                        <span>·</span>
                        <span>{project.stats?.inProgressTasks || 0} Active</span>
                        <span>·</span>
                        <span>{project.stats?.completedTasks || 0} Done</span>
                      </div>
                      <span className="font-semibold text-foreground tabular-nums">
                        {project.stats?.completionPercentage || 0}%
                      </span>
                    </div>

                    <Progress value={project.stats?.completionPercentage || 0} />

                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>Open Sprint Board</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onProjectCreated={fetchProjects}
      />
    </AppShell>
  );
}
