'use client';

import React from 'react';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { Plus, Circle, Clock, CheckCircle2 } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onUpdateTask: (taskId: string, input: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onOpenAddTask: (defaultStatus?: TaskStatus) => void;
}

export function KanbanBoard({
  tasks,
  onUpdateStatus,
  onUpdateTask,
  onDeleteTask,
  onOpenAddTask,
}: KanbanBoardProps) {
  const columns: {
    status: TaskStatus;
    title: string;
    icon: React.ElementType;
    badgeColor: string;
    borderAccent: string;
  }[] = [
    {
      status: 'TODO',
      title: 'To Do',
      icon: Circle,
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      borderAccent: 'border-t-slate-500',
    },
    {
      status: 'IN_PROGRESS',
      title: 'In Progress',
      icon: Clock,
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      borderAccent: 'border-t-amber-500',
    },
    {
      status: 'COMPLETED',
      title: 'Completed',
      icon: CheckCircle2,
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      borderAccent: 'border-t-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        const Icon = col.icon;

        return (
          <div
            key={col.status}
            className={`flex flex-col rounded-2xl bg-slate-900/40 border border-slate-800 border-t-2 ${col.borderAccent} p-4 min-h-[500px]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-sm text-white">{col.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${col.badgeColor}`}>
                  {colTasks.length}
                </span>
              </div>

              <button
                onClick={() => onOpenAddTask(col.status)}
                title={`Add task to ${col.title}`}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task List in Column */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {colTasks.length === 0 ? (
                <div className="h-36 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs p-4 text-center">
                  <span>No tasks in {col.title.toLowerCase()}</span>
                  <button
                    onClick={() => onOpenAddTask(col.status)}
                    className="mt-2 text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add a task</span>
                  </button>
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
