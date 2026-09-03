'use client';

import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { Search, Filter, AlertCircle, Clock, CheckCircle2, Circle, Trash2, Edit2 } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onUpdateTask: (taskId: string, input: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function TaskListView({ tasks, onUpdateStatus, onDeleteTask }: TaskListViewProps) {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchPriority && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks by title, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Task Details</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No tasks matched the filters.
                </td>
              </tr>
            ) : (
              filtered.map((task) => (
                <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 max-w-sm">
                    <div className="font-semibold text-white text-sm">{task.title}</div>
                    {task.description && (
                      <div className="text-slate-400 text-xs line-clamp-1 mt-0.5">
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {task.category || 'General'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {task.priority === 'HIGH' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        HIGH
                      </span>
                    )}
                    {task.priority === 'MEDIUM' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        MEDIUM
                      </span>
                    )}
                    {task.priority === 'LOW' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        LOW
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      value={task.status}
                      onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                      className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      title="Delete Task"
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
