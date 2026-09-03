'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { ProjectWithStats } from '@/types';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Trash2,
  RefreshCw,
  Search,
} from 'lucide-react';

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
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
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteProject = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${name}" and all its tasks?`)) return;

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

  // Aggregated global statistics
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <Navbar onSeedSuccess={fetchProjects} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/20 p-6 sm:p-8 backdrop-blur-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>Autonomous Agentic Project Planning</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                AI Project Manager Dashboard
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Supercharge your software engineering workflow with multi-turn AI Agent tool execution,
                automated architectural task generation, and real-time task boards.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Projects</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{totalProjects}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Tasks</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{totalTasks}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Completed Tasks</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {totalCompleted}{' '}
              <span className="text-xs font-normal text-emerald-400">({overallPercentage}%)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">High Priority Pending</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-400">{totalHighPriority}</div>
          </div>
        </div>

        {/* Projects Grid Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>My Projects</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {filteredProjects.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage your active engineering roadmaps and interactive boards
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-56 rounded-2xl bg-slate-900/40 border border-slate-800 p-6 animate-pulse"
                />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div className="max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-white">No projects found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Create your first project or seed the pre-built sample project to get started.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20"
                >
                  Create Project
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                        <FolderKanban className="w-5 h-5" />
                      </div>

                      <button
                        onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                        disabled={deletingId === project.id}
                        title="Delete Project"
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-1.5">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-800/80">
                    {/* Metrics Pills */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <span className="block text-[10px] text-slate-400">Tasks</span>
                        <span className="text-xs font-bold text-white">
                          {project.stats?.totalTasks || 0}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/10">
                        <span className="block text-[10px] text-emerald-400">Done</span>
                        <span className="text-xs font-bold text-emerald-300">
                          {project.stats?.completedTasks || 0}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/10">
                        <span className="block text-[10px] text-rose-400">High Pri</span>
                        <span className="text-xs font-bold text-rose-300">
                          {project.stats?.highPriorityTasks || 0}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Progress</span>
                        <span className="font-semibold text-indigo-300">
                          {project.stats?.completionPercentage || 0}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(project.stats?.completionPercentage || 0, 3)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Open Board Link */}
                    <div className="flex items-center justify-between text-xs pt-1 font-semibold text-indigo-400 group-hover:text-indigo-300">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onProjectCreated={fetchProjects}
      />
    </div>
  );
}
