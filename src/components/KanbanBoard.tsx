'use client';

import React from 'react';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

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
    headerBg: string;
  }[] = [
    {
      status: 'TODO',
      title: 'TO DO',
      headerBg: 'text-slate-700 dark:text-slate-300',
    },
    {
      status: 'IN_PROGRESS',
      title: 'IN PROGRESS',
      headerBg: 'text-blue-700 dark:text-blue-400',
    },
    {
      status: 'COMPLETED',
      title: 'DONE',
      headerBg: 'text-emerald-700 dark:text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className="flex flex-col rounded-xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 p-3 min-h-[550px] transition-colors"
          >
            {/* Jira Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center space-x-2">
                <h3 className={`font-bold text-xs uppercase tracking-wider ${col.headerBg}`}>
                  {col.title}
                </h3>
                <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {colTasks.length}
                </span>
              </div>

              <button
                onClick={() => onOpenAddTask(col.status)}
                title={`Create issue in ${col.title}`}
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task list */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
              {colTasks.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-xs text-center">
                  <span>No issues</span>
                  <button
                    onClick={() => onOpenAddTask(col.status)}
                    className="mt-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    + Create issue
                  </button>
                </div>
              ) : (
                colTasks.map((task, idx) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={idx + 1}
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
