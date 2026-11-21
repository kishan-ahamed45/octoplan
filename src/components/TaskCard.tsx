'use client';

import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  ChevronUp,
  Equal,
  ChevronDown,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  GripVertical,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  index?: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onUpdateTask: (taskId: string, input: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function TaskCard({
  task,
  index = 1,
  onDragStart,
  onDragEnd,
  onUpdateStatus,
  onUpdateTask,
  onDeleteTask,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);
  const [editCategory, setEditCategory] = useState(task.category);
  const [saving, setSaving] = useState(false);

  const issueKey = `OCTO-${(task.id.replace(/\D/g, '').slice(-3) || String(index + 100)).padStart(3, '0')}`;

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span
            title="High Priority"
            className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-medium text-[11px]"
          >
            <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>High</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span
            title="Medium Priority"
            className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium text-[11px]"
          >
            <Equal className="w-3 h-3 stroke-[2.5]" />
            <span>Medium</span>
          </span>
        );
      case 'LOW':
        return (
          <span
            title="Low Priority"
            className="inline-flex items-center gap-0.5 text-muted-foreground font-medium text-[11px]"
          >
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Low</span>
          </span>
        );
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      setSaving(true);
      await onUpdateTask(task.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        priority: editPriority,
        category: editCategory.trim() || 'General',
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card
        size="sm"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="group cursor-grab active:cursor-grabbing transition-all hover:ring-foreground/25 hover:shadow-sm"
      >
        <CardContent className="space-y-2.5">
          {/* Top row: Drag handle, Issue Key, Priority & Menu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                {issueKey}
              </span>
              <span className="text-border">·</span>
              {getPriorityBadge(task.priority)}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100"
                  />
                }
              >
                <MoreHorizontal className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    setEditTitle(task.title);
                    setEditDesc(task.description);
                    setEditPriority(task.priority);
                    setEditCategory(task.category);
                    setIsEditing(true);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Issue</span>
                </DropdownMenuItem>
                {task.status !== 'TODO' && (
                  <DropdownMenuItem onClick={() => onUpdateStatus(task.id, 'TODO')}>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Move to To Do</span>
                  </DropdownMenuItem>
                )}
                {task.status !== 'IN_PROGRESS' && (
                  <DropdownMenuItem onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Move to In Progress</span>
                  </DropdownMenuItem>
                )}
                {task.status !== 'COMPLETED' && (
                  <DropdownMenuItem onClick={() => onUpdateStatus(task.id, 'COMPLETED')}>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Mark Done</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteTask(task.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title & Description */}
          <div>
            <h4 className="text-[13px] font-medium text-foreground leading-snug mb-1">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          {/* Bottom row: Category Tag & Subtle Hover Shift */}
          <div className="flex items-center justify-between pt-1">
            {task.category ? (
              <Badge variant="secondary" className="text-[10px] font-medium">
                {task.category}
              </Badge>
            ) : (
              <span />
            )}

            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {task.status !== 'TODO' && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() =>
                    onUpdateStatus(
                      task.id,
                      task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'TODO'
                    )
                  }
                  title="Move Back"
                >
                  <ArrowLeft className="w-3 h-3" />
                </Button>
              )}
              {task.status !== 'COMPLETED' && (
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() =>
                    onUpdateStatus(
                      task.id,
                      task.status === 'TODO' ? 'IN_PROGRESS' : 'COMPLETED'
                    )
                  }
                  title={task.status === 'TODO' ? 'Move to In Progress' : 'Mark Done'}
                >
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <Card className="w-full max-w-md shadow-2xl">
            <CardContent className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Edit Issue ({issueKey})
              </h3>
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Summary *
                  </label>
                  <Input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Description
                  </label>
                  <Textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Priority
                    </label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                      className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none focus-visible:border-ring"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Category
                    </label>
                    <Input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saving || !editTitle.trim()}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
