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
      content: `Hello! I'm your AI Project Manager & Agile Lead for **${project.name}**.\n\nI have direct access to your PostgreSQL database tools. Ask me what to work on next, or tell me to create, update, or reorganize issues for you!`,
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
    'Create high-priority task for Redis caching',
    'Summarize sprint progress & bottlenecks',
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

      // Refresh board if database tools executed
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
      className={`fixed top-0 right-0 h-full z-50 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ${
        expanded ? 'w-full md:w-[650px]' : 'w-full md:w-[420px]'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">AI Project Agent</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
              {project.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
          <button
            onClick={clearChat}
            title="Clear Chat History"
            className="p-1.5 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
            className="p-1.5 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block"
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-tl-none'
              }`}
            >
              {/* Agent Actions Pills */}
              {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                <div className="mb-2 pb-2 border-b border-slate-200 dark:border-slate-700 space-y-1">
                  {msg.actionsExecuted.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-[10px] text-blue-700 dark:text-blue-300"
                    >
                      <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span className="font-mono font-bold">{action.toolName}</span>
                      <span className="text-slate-400">→</span>
                      <span className="truncate">{action.details}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>

            <span className="text-[10px] text-slate-400 mt-0.5 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 w-fit animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Executing database operations...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] text-slate-500 dark:text-slate-400 scrollbar-none">
          <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="flex-shrink-0 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors text-[10px] disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask agent to prioritize, create issues, etc..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
