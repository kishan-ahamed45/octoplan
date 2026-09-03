'use client';

import React, { useState } from 'react';
import { Project, GeneratePlanResponse } from '@/types';
import { Sparkles, Bot, AlertCircle, CheckCircle2, ArrowRight, Loader2, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">AI Project Planner</h3>
              <p className="text-xs text-slate-400">
                Generate structured MVP tasks tailored to "{project.name}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!generatedPlan && !loading && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <Bot className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-bold text-white text-base mb-1">
                  Ready to architect your project?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our Gemini-powered architect will analyze your project description and
                  generate high-impact tasks categorized by architecture layers with optimal priorities.
                </p>
              </div>
              <button
                onClick={handleGeneratePlan}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Project Plan with AI</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
              <div>
                <h4 className="font-semibold text-white text-sm">
                  AI is analyzing your project...
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Architecting components, calculating priorities, and generating development tasks.
                </p>
              </div>
            </div>
          )}

          {generatedPlan && !loading && (
            <div className="space-y-4 animate-fade-in">
              {/* Overview */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                <span className="font-semibold text-white block mb-1">Architectural Overview:</span>
                {generatedPlan.project_overview}
              </div>

              {/* Tasks preview list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Generated Tasks ({generatedPlan.tasks.length})
                </h4>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {generatedPlan.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start justify-between"
                    >
                      <div className="pr-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-white text-xs">
                            {idx + 1}. {task.title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300">
                            {task.category}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs line-clamp-2">
                          {task.description}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                          task.priority === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : task.priority === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {task.priority}
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
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <button
              onClick={handleGeneratePlan}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Regenerate
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyToProject}
                disabled={applying}
                className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
              >
                {applying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{applying ? 'Applying...' : 'Apply Tasks to Project'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
