'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ProjectWithStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderKanban,
  Sun,
  Moon,
  Plus,
  RefreshCw,
  CheckCircle2,
  LogOut,
  ChevronsUpDown,
  ShieldCheck,
  Bot,
  Sparkles,
  MessageSquare,
  Video,
  Menu,
  X,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  projects?: ProjectWithStats[];
  activeProjectId?: string;
  breadcrumb?: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSeedSuccess?: () => void;
  onOpenPlanner?: () => void;
  onOpenAgent?: () => void;
}

function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'OP'
  );
}

export function AppShell({
  children,
  projects: externalProjects,
  activeProjectId,
  breadcrumb,
  primaryActionLabel,
  onPrimaryAction,
  onSeedSuccess,
  onOpenPlanner,
  onOpenAgent,
}: AppShellProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const [fetchedProjects, setFetchedProjects] = useState<ProjectWithStats[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarProjects = externalProjects ?? fetchedProjects;

  useEffect(() => {
    if (externalProjects) return;
    let cancelled = false;
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success && Array.isArray(d.data)) {
          setFetchedProjects(d.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [externalProjects]);

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedSuccessMsg(true);
        setTimeout(() => setSeedSuccessMsg(false), 2500);
        if (onSeedSuccess) {
          onSeedSuccess();
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Failed to seed demo:', err);
    } finally {
      setSeeding(false);
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-neutral-950 text-neutral-100 border-r border-neutral-800/80 select-none">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-800/80">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center space-x-2.5 group"
        >
          <div className="w-7 h-7 rounded-lg bg-white text-neutral-950 flex items-center justify-center text-sm shadow-xs">
            🐙
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            OctoPlan
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
            v1
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 text-neutral-400 hover:text-white rounded"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            Workspace
          </p>

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              pathname === '/'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <span className="flex items-center space-x-2.5">
              <FolderKanban className="w-4 h-4" />
              <span>Projects</span>
            </span>
            <span className="text-[11px] tabular-nums text-neutral-500">
              {sidebarProjects.length}
            </span>
          </Link>

          {onOpenPlanner && (
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenPlanner();
              }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Sprint Planner</span>
            </button>
          )}

          {onOpenAgent && (
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenAgent();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <span className="flex items-center space-x-2.5">
                <Bot className="w-4 h-4" />
                <span>OctoPlan AI</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>
          )}
        </div>

        {/* Projects Quick Switcher */}
        <div className="space-y-1">
          <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            Boards
          </p>
          {sidebarProjects.length === 0 ? (
            <p className="px-2.5 py-1.5 text-[11px] text-neutral-600">No projects yet</p>
          ) : (
            sidebarProjects.slice(0, 8).map((proj) => {
              const isActive = activeProjectId === proj.id;
              return (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    isActive
                      ? 'bg-neutral-800 text-white font-medium'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <span className="flex items-center space-x-2 min-w-0">
                    <span className="w-5 h-5 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-semibold flex items-center justify-center flex-shrink-0 text-neutral-200">
                      {proj.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="truncate">{proj.name}</span>
                  </span>
                  <span className="text-[10px] tabular-nums text-neutral-500 ml-2">
                    {proj.stats?.totalTasks ?? 0}
                  </span>
                </Link>
              );
            })
          )}
        </div>

        {/* v2 Roadmap Preview */}
        <div className="space-y-1">
          <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            Coming in v2
          </p>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-600 cursor-not-allowed">
            <span className="flex items-center space-x-2.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Team Chat</span>
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-500">
              v2
            </span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-600 cursor-not-allowed">
            <span className="flex items-center space-x-2.5">
              <Video className="w-3.5 h-3.5" />
              <span>Video Rooms</span>
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-500">
              v2
            </span>
          </div>
        </div>
      </div>

      {/* Bottom User Menu */}
      {user && (
        <div className="p-3 border-t border-neutral-800/80">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900 transition-colors outline-none cursor-pointer">
              <div className="flex items-center space-x-2.5 min-w-0">
                <Avatar size="sm">
                  <AvatarFallback className="bg-neutral-800 text-neutral-100 text-[11px] font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left min-w-0">
                  <p className="text-xs font-medium text-white truncate leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate leading-tight">
                    {user.role}
                  </p>
                </div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold truncate">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    <span className="inline-flex w-fit items-center gap-1 text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      {user.role}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full flex bg-muted/40 text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Fluid Full-Width Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Compact Top Bar */}
        <header className="sticky top-0 z-30 h-14 px-4 sm:px-6 border-b border-border bg-background/95 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </Button>

            <div className="min-w-0 truncate">{breadcrumb}</div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {seedSuccessMsg ? (
              <Badge variant="secondary" className="h-7 px-2.5 gap-1.5 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Demo Seeded</span>
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDemo}
                disabled={seeding}
                title="Reset or seed sample project"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Seed Demo</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {onPrimaryAction && primaryActionLabel && (
              <Button size="sm" onClick={onPrimaryAction}>
                <Plus className="w-3.5 h-3.5" />
                <span>{primaryActionLabel}</span>
              </Button>
            )}
          </div>
        </header>

        {/* Full-width page body */}
        <main className="flex-1 w-full px-4 sm:px-6 py-5">{children}</main>
      </div>
    </div>
  );
}
