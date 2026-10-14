# 🚀 AI Project Manager

An enterprise-grade, intelligent project management platform with **WSO2 Asgardeo Authentication**, **Autonomous AI Agent tool execution**, and **interactive Agile Kanban boards**.

---

## ✨ Features

- 🔐 **WSO2 Asgardeo Authentication**: Secure enterprise sign-in via OpenID Connect (OIDC) and Google Social Login.
- 🤖 **Autonomous AI Agent**: Multi-turn AI assistant with direct database tool calling (`create_task`, `update_task`, `delete_task`, `get_project_statistics`).
- ⚡ **AI Project Planner**: Generates full engineering backlogs and architectures from a single prompt.
- 📋 **Interactive Kanban & List Views**: Real-time task board with drag-and-drop status workflows and priority filters.
- 🌓 **Instant Dark / Light Mode**: Sleek modern UI with persistent theme switching.

---

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
# Google Gemini AI Key
GEMINI_API_KEY=your_gemini_api_key_here

# WSO2 Asgardeo Configuration
ASGARDEO_CLIENT_ID=your_asgardeo_client_id
ASGARDEO_CLIENT_SECRET=your_asgardeo_client_secret
ASGARDEO_BASE_URL=https://api.asgardeo.io/t/devspark
ASGARDEO_REDIRECT_URL=http://localhost:3000

# Supabase PostgreSQL (Optional - local fallback runs automatically if omitted)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Run the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Auth**: WSO2 Asgardeo (`@asgardeo/nextjs`)
- **AI**: Google Gemini API (Agent Tool Calling)
- **Database**: Supabase / PostgreSQL (with local fallback storage)
