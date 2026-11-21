'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Project, AgentChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

let messageSeq = 0;
function nextMessageId(prefix: string): string {
  messageSeq += 1;
  return `${prefix}-${messageSeq}`;
}

function currentTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      content: `Hello! I'm **OctoPlan AI**, your Agile Lead for **${project.name}**.\n\nI have direct access to your workspace task tools. Ask me what to work on next, or tell me to create, update, or reorganize issues for you!`,
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
      id: nextMessageId('msg'),
      role: 'user',
      content: textToSend,
      timestamp: currentTimestamp(),
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

      const executed: NonNullable<AgentChatMessage['actionsExecuted']> =
        data.data.actionsExecuted || [];

      const botMsg: AgentChatMessage = {
        id: nextMessageId('agent'),
        role: 'assistant',
        content: data.data.message,
        timestamp: currentTimestamp(),
        actionsExecuted: executed,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (
        executed.some((a) =>
          ['create_task', 'update_task', 'delete_task'].includes(a.toolName)
        )
      ) {
        onProjectDataChanged();
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to connect to agent.';
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId('err'),
          role: 'assistant',
          content: `⚠️ Error: ${errMsg}`,
          timestamp: currentTimestamp(),
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
      className={`fixed top-0 right-0 h-full z-50 bg-background border-l border-border shadow-2xl flex flex-col transition-all duration-300 ${
        expanded ? 'w-full md:w-[650px]' : 'w-full md:w-[420px]'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-semibold text-xs sm:text-sm text-foreground">OctoPlan AI</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
              {project.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearChat}
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
            className="hidden sm:inline-flex"
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
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
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed shadow-xs ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-none'
                  : 'bg-muted text-foreground border border-border rounded-tl-none'
              }`}
            >
              {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                <div className="mb-2 pb-2 border-b border-border space-y-1">
                  {msg.actionsExecuted.map((action, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="w-full justify-start gap-1 text-[10px] font-normal py-1 h-auto"
                    >
                      <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span className="font-mono font-semibold">{action.toolName}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="truncate">{action.details}</span>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>

            <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-1.5 text-xs text-muted-foreground bg-muted border border-border rounded-lg px-2.5 py-1.5 w-fit animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Executing workspace operations...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-muted/30 border-t border-border">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          <Sparkles className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-background hover:bg-muted text-foreground border border-border transition-colors text-[10px] font-medium disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-border bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center space-x-2"
        >
          <Input
            type="text"
            placeholder="Ask OctoPlan AI to prioritize, create issues..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 text-xs"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
