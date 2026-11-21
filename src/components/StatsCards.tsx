'use client';

import React from 'react';
import { ProjectStats } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertTriangle, Layers, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  stats: ProjectStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Issues',
      value: stats.totalTasks,
      icon: Layers,
    },
    {
      label: 'In Progress',
      value: stats.inProgressTasks,
      icon: Clock,
    },
    {
      label: 'Completed',
      value: stats.completedTasks,
      icon: CheckCircle2,
    },
    {
      label: 'High Priority',
      value: stats.highPriorityTasks,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} size="sm">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">{card.label}</p>
                <p className="text-xl font-semibold tracking-tight text-foreground tabular-nums mt-0.5">
                  {card.value}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Icon className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Inline Sprint Progress Cell */}
      <Card size="sm" className="col-span-2 lg:col-span-1">
        <CardContent className="flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-foreground" />
              <span>Progress</span>
            </span>
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {stats.completionPercentage}%
            </span>
          </div>
          <Progress value={stats.completionPercentage} />
        </CardContent>
      </Card>
    </div>
  );
}
