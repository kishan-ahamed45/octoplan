<p align="center">
  <img src="./public/octoplan-logo.jpg" alt="OctoPlan Logo" width="88" />
</p>

<h1 align="center">OctoPlan</h1>

<p align="center">
  <strong>Open-source, self-hosted AI project workspace.</strong><br />
  <em>Plan sprints, manage Kanban boards, and let an AI Agile Lead juggle your backlog—hosted on your own server.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/release-v1.0-blue" alt="Release v1.0" />
  <img src="https://img.shields.io/badge/v2-in_active_development-amber" alt="v2 in active development" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
</p>

**OctoPlan** is built for organizations and engineering teams that want an intelligent alternative to Jira/Linear without vendor lock-in. Clone the repo, spin it up locally or via Docker, and keep your projects, tasks, and AI workflows under your own control.

---
<img width="1917" height="1082" alt="image" src="https://github.com/user-attachments/assets/99432825-d1a4-4f6d-b01d-507ced2b1e57" />
<img width="1907" height="1100" alt="image" src="https://github.com/user-attachments/assets/394843f6-f04f-428d-ae65-ed66565d36ab" />
<img width="1917" height="1101" alt="image" src="https://github.com/user-attachments/assets/21a45307-bdd5-4bd8-a71c-a4d42a9ac0a9" />



## 📸 Preview

<img width="1917" height="1082" alt="OctoPlan Projects Dashboard" src="https://github.com/user-attachments/assets/99432825-d1a4-4f6d-b01d-507ced2b1e57" />
<img width="1907" height="1100" alt="OctoPlan Kanban Sprint Board" src="https://github.com/user-attachments/assets/394843f6-f04f-428d-ae65-ed66565d36ab" />
<img width="1917" height="1101" alt="OctoPlan AI Assistant" src="https://github.com/user-attachments/assets/21a45307-bdd5-4bd8-a71c-a4d42a9ac0a9" />

---

## ✨ v1 Features (Available Now)

- 🔐 **Self-Hosted Authentication**: Built-in email/password signup & login with `scrypt` password hashing and HTTP-only signed session cookies (first user becomes Workspace Admin), plus a **1-click Demo Workspace** mode—zero external auth SaaS required.
- 🤖 **Autonomous AI Project Agent**: Interactive AI assistant with tool-calling execution (`get_tasks`, `create_task`, `update_task`, `delete_task`, `get_project_statistics`).
- ⚡ **AI Sprint Planner**: Generates structured engineering backlogs and architectural overviews from your project description and applies them directly to your board.
- 🧠 **Flexible Multi-Provider AI**:
  - **Local / Private AI**: Connect your own **Ollama** instance (`OLLAMA_BASE_URL`) so project data never leaves your network.
  - **Cloud AI**: Supports **Google Gemini** (`GEMINI_API_KEY`) and **OpenRouter** (`OPENROUTER_API_KEY`).
  - **Offline Fallback**: Built-in deterministic planner & rule-based assistant works even with zero API keys.
- 📋 **Interactive Kanban & Table Views**: Drag-and-drop status workflows (`TODO` → `IN_PROGRESS` → `COMPLETED`), priority indicators, and real-time project progress metrics.
- 💾 **Zero-Config Storage or PostgreSQL (Drizzle ORM)**: Runs immediately with persistent local storage (`.local-db.json` / Docker volume) or connects to **Neon / PostgreSQL** via `DATABASE_URL`.
- 🌓 **Dark / Light Mode**: Clean, responsive UI built with Tailwind CSS.

---

## 🚀 Quick Start

### Option A: Run Locally (Node.js)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` if you want to add `DATABASE_URL` (Neon or local PostgreSQL), `OLLAMA_BASE_URL`, `GEMINI_API_KEY`, or `OPENROUTER_API_KEY` (optional—OctoPlan runs out of the box with zero keys).

3. **Push database schema (if using `DATABASE_URL`)**
   ```bash
   pnpm db:push
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000), create your Workspace Admin account, or click **Launch Demo Workspace**.

---

### Option B: Self-Host with Docker Compose

1. **Standard self-hosted run**
   ```bash
   docker compose up -d --build
   ```
   App runs at `http://localhost:3000` with persistent storage in the `octoplan_data` volume.

2. **Self-hosted with 100% private local AI (Ollama)**
   ```bash
   OLLAMA_BASE_URL=http://ollama:11434 OLLAMA_MODEL=llama3.1 docker compose --profile local-ai up -d --build
   docker exec -it octoplan-ollama ollama pull llama3.1
   ```

---

## 🛠️ Tech Stack (v1)

- **Frontend & BFF**: Next.js 16 (App Router) + React 19 + TypeScript
- **Authentication**: Built-in `scrypt` + HMAC-SHA256 HTTP-only cookie sessions
- **AI Layer**: Multi-provider engine (Ollama, Google Gemini SDK `@google/genai`, OpenRouter, offline fallback)
- **Database & ORM**: PostgreSQL (Neon / Docker) + Drizzle ORM (with automatic local file persistence fallback)
- **Styling**: Tailwind CSS v4 + shadcn/ui (Nova + Neutral) + Lucide Icons
- **Deployment**: Docker standalone build + Docker Compose

---

## 🗺️ v2 Roadmap (In Active Development)

OctoPlan is actively evolving into a full self-hosted collaboration & AI engineering suite:

- [ ] 🐍 **Python FastAPI AI Engine**: Dedicated microservice for async AI jobs, `pgvector` semantic search/RAG across project history, and PydanticAI/LangGraph agent orchestration.
- [ ] 💬 **Real-Time Team Chat & Live Board Sync**: Project chat channels and instant Kanban board updates powered by WebSockets + Redis Pub/Sub.
- [ ] 🎥 **Self-Hosted Video Meetings + AI Meeting Notes**: Built-in team video calls via **LiveKit** with automated transcription and AI-generated Kanban tasks from meeting discussions.
- [ ] 🔑 **Optional Enterprise SSO**: Pluggable OIDC/OAuth support (Keycloak, Authentik, GitHub) alongside built-in auth.

---

## 📄 License

Open-source under the [MIT License](LICENSE).
