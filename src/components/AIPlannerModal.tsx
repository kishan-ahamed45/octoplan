'use client';

import React, { useState } from 'react';
import { Project, GeneratePlanResponse } from '@/types';
import { Sparkles, Bot, AlertCircle, CheckCircle2, Loader2, X, ChevronUp, Equal, ChevronDown } from 'lucide-react';

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
    } catch (err: any) {
      setError(err.message || 'Something went wrong while generating your project plan.');
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
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to apply plan');
      onPlanApplied();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save generated tasks.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Sprint Planner</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Architectural backlog synthesis for "{project.name}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!generatedPlan && !loading && (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                <Bot className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                  Synthesize Sprint Backlog
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Analyze project specifications and generate architectural user stories, tasks, and priority mappings.
                </p>
              </div>
              <button
                onClick={handleGeneratePlan}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Backlog with AI</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                  AI Architect is analyzing requirements...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Calculating architectural layers and estimation priorities.
                </p>
              </div>
            </div>
          )}

          {generatedPlan && !loading && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                <span className="font-bold block mb-1">Architectural Overview:</span>
                {generatedPlan.project_overview}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Generated Issues ({generatedPlan.tasks.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {generatedPlan.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between"
                    >
                      <div className="pr-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-slate-900 dark:text-white text-xs">
                            {idx + 1}. {task.title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {task.category}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">
                          {task.description}
                        </p>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 flex-shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {task.priority === 'HIGH' && <ChevronUp className="w-3.5 h-3.5 text-rose-600 stroke-[3]" />}
                        {task.priority === 'MEDIUM' && <Equal className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />}
                        {task.priority === 'LOW' && <ChevronDown className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />}
                        <span>{task.priority}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {generatedPlan && !loading && (
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
            <button
              onClick={handleGeneratePlan}
              className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Regenerate
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyToProject}
                disabled={applying}
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {applying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{applying ? 'Applying...' : 'Apply to Board'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
