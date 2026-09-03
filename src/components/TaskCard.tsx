'use client';

import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types';
import {
  MoreHorizontal,
  ChevronUp,
  Equal,
  ChevronDown,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Circle,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  index?: number;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onUpdateTask: (taskId: string, input: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function TaskCard({
  task,
  index = 1,
  onUpdateStatus,
  onUpdateTask,
  onDeleteTask,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);
  const [editCategory, setEditCategory] = useState(task.category);
  const [saving, setSaving] = useState(false);

  // Generate clean Jira issue key e.g. "AI-104"
  const issueKey = `AI-${(task.id.replace(/\D/g, '').slice(-3) || String(index + 100)).padStart(3, '0')}`;

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span
            title="High Priority"
            className="inline-flex items-center text-rose-600 dark:text-rose-400 font-bold text-xs"
          >
            <ChevronUp className="w-4 h-4 stroke-[3]" />
          </span>
        );
      case 'MEDIUM':
        return (
          <span
            title="Medium Priority"
            className="inline-flex items-center text-amber-600 dark:text-amber-400 font-bold text-xs"
          >
            <Equal className="w-3.5 h-3.5 stroke-[3]" />
          </span>
        );
      case 'LOW':
        return (
          <span
            title="Low Priority"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 font-bold text-xs"
          >
            <ChevronDown className="w-4 h-4 stroke-[3]" />
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
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 rounded-lg p-3.5 shadow-sm hover:shadow-md transition-all">
      {/* Top row: Issue Key, Category & Menu */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {issueKey}
          </span>
          {task.category && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {task.category}
            </span>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 py-1 text-xs animate-fade-in"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setIsEditing(true);
                }}
                className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-2"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Issue</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteTask(task.id);
                }}
                className="w-full text-left px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug mb-1">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Bottom row: Priority, Assignee Avatar & Quick Status Shift */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getPriorityIcon(task.priority)}
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.title}`}
            alt="Assignee"
            title="Assigned to Engineering"
            className="w-5 h-5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
          />
        </div>

        {/* Quick Shift Controls */}
        <div className="flex items-center space-x-1">
          {task.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'TODO')}
              title="Move to To Do"
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}

          {task.status === 'TODO' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
              title="Start Progress"
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 flex items-center space-x-1 transition-colors"
            >
              <span>Start</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          )}

          {task.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'COMPLETED')}
              title="Mark Done"
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1 transition-colors"
            >
              <span>Done</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          )}

          {task.status === 'COMPLETED' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
              title="Reopen"
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Edit Issue ({issueKey})
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Summary *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !editTitle.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
