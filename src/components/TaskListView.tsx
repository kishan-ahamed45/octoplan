'use client';

import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, ChevronUp, Equal, ChevronDown, Trash2 } from 'lucide-react';

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
    <div className="space-y-3">
      {/* Search & Filters */}
      <Card size="sm">
        <CardContent className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            <Input
              type="text"
              placeholder="Search issues, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-background border border-input text-foreground text-xs outline-none focus-visible:border-ring"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Done</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-background border border-input text-foreground text-xs outline-none focus-visible:border-ring"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Key &amp; Summary</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No issues matched the filters.
                  </td>
                </tr>
              ) : (
                filtered.map((task, idx) => {
                  const issueKey = `OCTO-${(task.id.replace(/\D/g, '').slice(-3) || String(idx + 101)).padStart(3, '0')}`;
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="px-4 py-3 max-w-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                            {issueKey}
                          </span>
                          <span className="font-medium text-foreground text-xs">
                            {task.title}
                          </span>
                        </div>
                        {task.description && (
                          <div className="text-muted-foreground text-[11px] line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {task.category || 'General'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          {task.priority === 'HIGH' && (
                            <>
                              <ChevronUp className="w-4 h-4 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                              <span className="font-semibold text-rose-600 dark:text-rose-400">High</span>
                            </>
                          )}
                          {task.priority === 'MEDIUM' && (
                            <>
                              <Equal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                              <span className="font-semibold text-amber-600 dark:text-amber-400">Medium</span>
                            </>
                          )}
                          {task.priority === 'LOW' && (
                            <>
                              <ChevronDown className="w-4 h-4 text-muted-foreground stroke-[2.5]" />
                              <span className="font-medium text-muted-foreground">Low</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                          className="h-7 px-2 rounded-md bg-secondary border border-border text-foreground font-medium text-xs outline-none focus-visible:border-ring"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Done</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDeleteTask(task.id)}
                          title="Delete Issue"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
