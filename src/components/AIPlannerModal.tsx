'use client';

import React, { useState } from 'react';
import { Project, GeneratePlanResponse } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Bot,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ChevronUp,
  Equal,
  ChevronDown,
} from 'lucide-react';

interface AIPlannerModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onPlanApplied: () => void;
}

export function AIPlannerModal({
  project,
  isOpen,
  onClose,
  onPlanApplied,
}: AIPlannerModalProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratePlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          saveToDatabase: false,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to generate plan');
      setGeneratedPlan(data.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while generating your project plan.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToProject = async () => {
    if (!generatedPlan) return;
    try {
      setApplying(true);
      setError(null);
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          saveToDatabase: true,
          tasks: generatedPlan.tasks,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to apply plan');
      onPlanApplied();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save generated tasks.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <Card className="w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-muted text-foreground">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">AI Sprint Planner</CardTitle>
              <p className="text-xs text-muted-foreground">
                Architectural backlog synthesis for &ldquo;{project.name}&rdquo;
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto space-y-4 flex-1 py-2">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!generatedPlan && !loading && (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto text-foreground">
                <Bot className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-semibold text-foreground text-base mb-1">
                  Synthesize Sprint Backlog
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Analyze project specifications and generate architectural user stories, tasks, and priority mappings.
                </p>
              </div>
              <Button onClick={handleGeneratePlan} size="lg">
                <Sparkles className="w-4 h-4" />
                <span>Generate Backlog with AI</span>
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12 space-y-3">
              <Loader2 className="w-7 h-7 text-foreground animate-spin mx-auto" />
              <div>
                <h4 className="font-semibold text-foreground text-sm">
                  AI Architect is analyzing requirements...
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Calculating architectural layers and estimation priorities.
                </p>
              </div>
            </div>
          )}

          {generatedPlan && !loading && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-xs text-foreground leading-relaxed">
                <span className="font-semibold block mb-1">Architectural Overview:</span>
                {generatedPlan.project_overview}
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Generated Issues ({generatedPlan.tasks.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {generatedPlan.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-muted/40 border border-border flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-foreground text-xs">
                            {idx + 1}. {task.title}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {task.category}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-[11px] line-clamp-2">
                          {task.description}
                        </p>
                      </div>

                      <Badge variant="outline" className="text-[10px] font-semibold flex-shrink-0 gap-1">
                        {task.priority === 'HIGH' && (
                          <ChevronUp className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                        )}
                        {task.priority === 'MEDIUM' && (
                          <Equal className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
                        )}
                        {task.priority === 'LOW' && (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground stroke-[2.5]" />
                        )}
                        <span>{task.priority}</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {generatedPlan && !loading && (
          <CardFooter className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleGeneratePlan}>
              Regenerate
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleApplyToProject} disabled={applying}>
                {applying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{applying ? 'Applying...' : 'Apply to Board'}</span>
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
