'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Kanban,
  Bot,
  Server,
} from 'lucide-react';

export function AuthScreen() {
  const { loading, login, register, loginDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-center items-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-7 h-7 text-foreground animate-spin" />
          <p className="text-xs text-muted-foreground font-medium tracking-wide">
            Loading OctoPlan workspace...
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res =
      mode === 'login'
        ? await login(email, password)
        : await register(name, email, password);

    if (!res.success) {
      setError(res.error || 'Authentication failed');
    }
    setSubmitting(false);
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    const res = await loginDemo();
    if (!res.success) {
      setError(res.error || 'Could not launch demo workspace');
    }
    setDemoLoading(false);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground">
      {/* Left Brand Showcase Panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-neutral-950 text-neutral-100 border-r border-neutral-800">
        <div className="flex items-center space-x-3">
          <Image
            src="/octoplan-logo.jpg"
            alt="OctoPlan"
            width={36}
            height={36}
            className="w-9 h-9 rounded-xl object-cover"
          />
          <span className="text-base font-semibold tracking-tight text-white">OctoPlan</span>
          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
            Self-Hosted v1
          </span>
        </div>

        <div className="space-y-6 max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight leading-tight text-white">
            Open-source project management built for AI-native engineering teams.
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Run your Kanban boards, sprint backlog planner, and tool-calling AI Agile Lead directly on your own infrastructure—with zero SaaS lock-in.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200">
                <Kanban className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Drag-and-Drop Sprint Boards</p>
                <p className="text-xs text-neutral-400">Kanban and searchable list views synced in real time.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Autonomous AI Agile Lead</p>
                <p className="text-xs text-neutral-400">Supports private Ollama models, Gemini, and OpenRouter.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Self-Hosted &amp; Portable</p>
                <p className="text-xs text-neutral-400">Built-in auth and one-command Docker Compose deployment.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-neutral-500">
          OctoPlan Open Source • MIT License
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-10 bg-muted/30">
        <div className="w-full max-w-md space-y-5">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center space-y-2">
            <Image
              src="/octoplan-logo.jpg"
              alt="OctoPlan"
              width={44}
              height={44}
              className="w-11 h-11 rounded-xl object-cover mx-auto"
            />
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">OctoPlan</h1>
              <Badge variant="secondary" className="text-[10px] uppercase">
                Self-Hosted v1
              </Badge>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <Tabs
                value={mode}
                onValueChange={(value) => {
                  setMode(value === 'register' ? 'register' : 'login');
                  setError(null);
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Create Account</TabsTrigger>
                </TabsList>
              </Tabs>
              <CardTitle className="pt-2 text-base">
                {mode === 'login' ? 'Welcome back' : 'Set up your account'}
              </CardTitle>
              <CardDescription className="text-xs">
                {mode === 'login'
                  ? 'Sign in to access your self-hosted projects and AI agent.'
                  : 'First registered user becomes the Workspace Admin.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-foreground">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                      <Input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="pl-8 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="pl-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter password'}
                      className="pl-8 text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || demoLoading}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create Workspace Account'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="flex items-center gap-3 py-1">
                <Separator className="flex-1" />
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Quick Preview
                </span>
                <Separator className="flex-1" />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleDemoLogin}
                disabled={submitting || demoLoading}
                className="w-full"
                size="lg"
              >
                {demoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Launch Demo Workspace (1-Click)</span>
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-foreground" />
            <span>Your projects, tasks, and AI history stay on your server</span>
          </div>
        </div>
      </div>
    </div>
  );
}
