'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Project, AgentChatMessage } from '@/types';
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  X,
  Zap,
  CheckCircle2,
  ArrowRight,
  Maximize2,
  Minimize2,
  Trash2,
} from 'lucide-react';

interface AIAssistantDrawerProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onProjectDataChanged: () => void;
}

export function AIAssistantDrawer({
  project,
  isOpen,
  onClose,
  onProjectDataChanged,
}: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! I'm your AI Project Manager for **${project.name}**.\n\nI have direct access to your task database via tools. Ask me what to work on next, or tell me to create and modify tasks for you!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const quickPrompts = [
    'What should I work on next?',
    'Create a high-priority task for OAuth authentication',
    'Summarize project progress & bottlenecks',
  ];

  const handleSendMessage = async (userText: string) => {
    const textToSend = userText.trim();
    if (!textToSend || loading) return;

    const userMsg: AgentChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }));

      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          message: textToSend,
          chatHistory: historyPayload,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Agent failed to respond');

      const botMsg: AgentChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'assistant',
        content: data.data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionsExecuted: data.data.actionsExecuted || [],
      };

      setMessages((prev) => [...prev, botMsg]);

      // If agent made database changes, trigger instant board refresh!
      if (
        data.data.actionsExecuted &&
        data.data.actionsExecuted.some((a: any) =>
          ['create_task', 'update_task', 'delete_task'].includes(a.toolName)
        )
      ) {
        onProjectDataChanged();
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Failed to connect to agent.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Chat history cleared. How can I assist with **${project.name}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full z-50 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ${
        expanded ? 'w-full md:w-[650px]' : 'w-full md:w-[420px]'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-sm text-white">AI Project Agent</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {project.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-slate-400">
          <button
            onClick={clearChat}
            title="Clear Chat History"
            className="p-1.5 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
            className="p-1.5 hover:text-white rounded hover:bg-slate-800 transition-colors hidden sm:block"
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
              }`}
            >
              {/* Agent Actions Pills if any */}
              {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                <div className="mb-2.5 pb-2 border-b border-slate-700/70 space-y-1.5">
                  {msg.actionsExecuted.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-1.5 px-2 py-1 rounded bg-indigo-950/60 border border-indigo-500/30 text-[11px] text-indigo-300"
                    >
                      <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span className="font-mono font-semibold">{action.toolName}</span>
                      <span className="text-slate-400">→</span>
                      <span className="truncate text-slate-300">{action.details}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Message text with formatting */}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>

            <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-indigo-400 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 w-fit animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Agent is inspecting project & executing tools...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/80">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400 scrollbar-none">
          <Sparkles className="w-3 h-3 text-indigo-400 flex-shrink-0" />
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask agent to recommend next task, create tasks, etc..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
