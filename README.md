# 🚀 AI Project Manager (Agentic Web Application)

An intelligent, full-stack project management platform powered by Next.js, TypeScript, Tailwind CSS, PostgreSQL / Supabase, and Google Gemini AI Agent with multi-turn tool/function calling.

---

## 🌟 Key Features

### 1. 🤖 Autonomous AI Agent (Tool/Function Calling)
- Not a simple chatbot: The AI Agent has access to server-side database tools:
  - `get_project_details`: Reads project context and scope.
  - `get_tasks`: Queries tasks filtered by priority and status.
  - `get_project_statistics`: Computes completion percentages, pending bottlenecks, and high-priority counters.
  - `create_task`: Programmatically inserts new tasks into the database.
  - `update_task`: Adjusts task status (`TODO`, `IN_PROGRESS`, `COMPLETED`) or priority (`LOW`, `MEDIUM`, `HIGH`).
  - `delete_task`: Removes tasks safely.
- **Visual Action Badges**: Agent actions are highlighted in real-time chips in the chat UI.
- **Live Sync**: Changes made by the AI immediately update the interactive Kanban board without page reloads.

### 2. ⚡ AI Project Planner
- Analyzes high-level project vision and automatically synthesizes 5–7 actionable engineering tasks with assigned priorities, architectural categories (Frontend, Backend, Database, Security, DevOps), and detailed descriptions.
- Review and apply generated tasks to the board in one click.

### 3. 📋 Dual-View Task Management
- **Interactive Kanban Board**: Column-based workflow (`To Do`, `In Progress`, `Completed`) with quick-action status shifts.
- **Structured Table/List View**: Instant multi-criteria filtering by search keyword, priority, and status.

### 4. 📊 Real-Time Metrics & Statistics
- Dynamic analytics cards tracking total tasks, in-progress workloads, completed milestones, high-priority pending items, and progress bars.

### 5. 🛠️ One-Click Demo Seeder
- Pre-loaded "AI E-Commerce Platform" demo project with realistic tasks for zero-friction demonstrations.

---

## 🏗️ Architecture

```
User Browser (Next.js 16 + React 19 + Tailwind CSS)
   │
   ▼
Next.js Server API Routes (/api/projects, /api/tasks, /api/ai/agent, /api/ai/plan)
   │
   ├───────────► Google Gemini 2.5 AI Model
   │                 │ (Agent Tool Calling Loop)
   │                 ▼
   │           Server-Side Function Execution
   │                 │
   ▼                 ▼
PostgreSQL Database / Supabase (with fallback persistence)
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 18.x
- npm / yarn / pnpm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/kishan-ahamed45/ai-project-manager.git
cd ai-project-manager

# Install dependencies
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Add your Google Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (Optional - in-memory/local storage operates automatically if omitted)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase PostgreSQL)

If connecting to Supabase:
1. Open your Supabase project dashboard.
2. Go to the **SQL Editor**.
3. Paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
4. Copy your project URL and keys to `.env.local`.

---

## 🧪 2-Minute Hackathon Demo Script

1. **Open Dashboard**: View global metrics and existing projects.
2. **Create Project**: Click `+ Create Project`, enter *"Online Food Delivery Platform"*, and click create.
3. **Generate Plan with AI**: Click `⚡ Generate AI Plan`, review the generated architecture tasks, and click `Apply Tasks to Project`.
4. **Inspect Board**: View tasks distributed on the Kanban board with priority tags.
5. **Interact with AI Agent**:
   - Open `AI Agent Assistant`.
   - Ask: *"What should I work on next?"* -> AI reads database tasks and recommends the highest-priority item.
   - Ask: *"Create a high-priority task for OAuth authentication"* -> AI invokes `create_task()` and the new task appears on the board instantly!
6. **Move & Complete Tasks**: Move tasks between `TODO` ➔ `IN_PROGRESS` ➔ `COMPLETED` and watch project stats update in real time.
