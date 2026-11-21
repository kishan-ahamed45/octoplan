'use client';

import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const columns: {
    status: TaskStatus;
    title: string;
    dotClass: string;
  }[] = [
    {
      status: 'TODO',
      title: 'To Do',
      dotClass: 'bg-neutral-400 dark:bg-neutral-500',
    },
    {
      status: 'IN_PROGRESS',
      title: 'In Progress',
      dotClass: 'bg-amber-500',
    },
    {
      status: 'COMPLETED',
      title: 'Done',
      dotClass: 'bg-emerald-500',
    },
  ];

  const handleDrop = async (targetStatus: TaskStatus) => {
    setDragOverStatus(null);
    if (!draggedTaskId) return;
    const task = tasks.find((t) => t.id === draggedTaskId);
    setDraggedTaskId(null);
    if (task && task.status !== targetStatus) {
      await onUpdateStatus(task.id, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        const isDropTarget = dragOverStatus === col.status;

        return (
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverStatus !== col.status) setDragOverStatus(col.status);
            }}
            onDragLeave={() => {
              if (dragOverStatus === col.status) setDragOverStatus(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(col.status);
            }}
            className={`flex flex-col rounded-xl border p-3 min-h-[calc(100vh-18rem)] transition-all ${
              isDropTarget
                ? 'bg-muted border-foreground/30 ring-2 ring-foreground/10'
                : 'bg-muted/60 border-border'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
                <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                  {col.title}
                </h3>
                <Badge variant="secondary" className="text-[11px] tabular-nums">
                  {colTasks.length}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onOpenAddTask(col.status)}
                title={`Create issue in ${col.title}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Task list */}
            <div className="flex-1 space-y-2.5">
              {colTasks.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground text-xs text-center">
                  <span>{isDropTarget ? 'Drop issue here' : 'No issues'}</span>
                  {!isDropTarget && (
                    <button
                      onClick={() => onOpenAddTask(col.status)}
                      className="mt-1 text-foreground hover:underline font-medium"
                    >
                      + Create issue
                    </button>
                  )}
                </div>
              ) : (
                colTasks.map((task, idx) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={idx + 1}
                    onDragStart={() => setDraggedTaskId(task.id)}
                    onDragEnd={() => {
                      setDraggedTaskId(null);
                      setDragOverStatus(null);
                    }}
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
