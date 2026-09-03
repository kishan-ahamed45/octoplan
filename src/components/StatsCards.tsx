'use client';

import React from 'react';
import { ProjectStats } from '@/types';
import { CheckCircle2, Clock, AlertTriangle, Layers, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  stats: ProjectStats;
  compact?: boolean;
}

export function StatsCards({ stats, compact = false }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Tasks',
      value: stats.totalTasks,
      icon: Layers,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      label: 'In Progress',
      value: stats.inProgressTasks,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Completed',
      value: stats.completedTasks,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'High Priority Pending',
      value: stats.highPriorityTasks,
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border ${c.border} text-xs`}
            >
              <Icon className={`w-3.5 h-3.5 ${c.color}`} />
              <span className="text-slate-400">{c.label}:</span>
              <span className="font-bold text-white">{c.value}</span>
            </div>
          );
        })}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-indigo-300 font-semibold">{stats.completionPercentage}% Done</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`p-4 rounded-xl bg-slate-900/70 border ${card.border} backdrop-blur-sm relative overflow-hidden transition-all hover:bg-slate-900 hover:shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-white tracking-tight">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Overall Completion</span>
          </span>
          <span className="font-bold text-indigo-300">{stats.completionPercentage}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(stats.completionPercentage, 2)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
