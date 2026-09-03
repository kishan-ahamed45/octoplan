'use client';

import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types';
import {
  MoreVertical,
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  Tag,
  Trash2,
  Edit2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onUpdateTask: (taskId: string, input: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function TaskCard({ task, onUpdateStatus, onUpdateTask, onDeleteTask }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);
  const [editCategory, setEditCategory] = useState(task.category);
  const [saving, setSaving] = useState(false);

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            LOW
          </span>
        );
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'TODO':
        return <Circle className="w-4 h-4 text-slate-400" />;
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
    <div className="group relative bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
      {/* Header with Category & Priority */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getPriorityBadge(task.priority)}
          {task.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
              <Tag className="w-2.5 h-2.5 mr-1 text-slate-400" />
              {task.category}
            </span>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-1 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 text-xs"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setIsEditing(true);
                }}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-700 flex items-center space-x-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Task</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteTask(task.id);
                }}
                className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-rose-950/40 flex items-center space-x-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1.5 leading-snug">
        {task.title}
      </h4>
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer / Quick Status Mover */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 text-slate-400">
          {getStatusIcon(task.status)}
          <span className="capitalize text-[11px] font-medium">
            {task.status.toLowerCase().replace('_', ' ')}
          </span>
        </div>

        {/* Quick Shift Controls */}
        <div className="flex items-center space-x-1">
          {task.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'TODO')}
              title="Move back to TODO"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}

          {task.status === 'TODO' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
              title="Start Working (In Progress)"
              className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium flex items-center space-x-1 transition-colors"
            >
              <span>Start</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {task.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'COMPLETED')}
              title="Mark Completed"
              className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center space-x-1 transition-colors"
            >
              <span>Complete</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {task.status === 'COMPLETED' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
              title="Reopen task"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Edit Modal Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Edit Task</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="e.g. Backend, UI"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !editTitle.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-md disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
