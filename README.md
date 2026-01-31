# PodSumAI

A local-first Electron desktop app that manages podcast subscriptions and generates AI-powered episode summaries using Google Gemini.

![Electron](https://img.shields.io/badge/Electron-33-blue)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![License](https://img.shields.io/badge/License-GPL--3.0-green)

## Features

- **Podcast Management** - Subscribe via RSS feed URL or search by keyword
- **AI Summaries** - Generate episode summaries with Google Gemini API
- **Custom Prompts** - Set per-podcast prompts to tailor summary output
- **Local Downloads** - Save episodes to local disk, organized by podcast
- **Knowledge Base** - Browse all generated summaries grouped by podcast
- **Local-First** - SQLite database, no cloud dependency for core features
- **Cross-Platform** - Windows and macOS

## Architecture

```
Renderer (React)  ── IPC (contextBridge) ──  Main Process (Electron)
  Zustand (UI state)                          IPC Handlers
  TanStack Query (server state)               Service Layer
  TanStack Virtual (perf)                       ├── PodcastService
  Radix UI (dialogs/toasts)                     ├── AudioService
  Tailwind CSS                                  └── GeminiService
                                              DatabaseManager (SQLite)
                                              Worker Thread (RSS parsing)
```

## Project Structure

```
src/
├── main/                 # Electron main process
│   ├── database/         # SQLite DatabaseManager + schema
│   ├── services/         # PodcastService, AudioService, GeminiService
│   ├── ipc/              # IPC request handlers
│   ├── workers/          # Worker thread (RSS parser)
│   └── index.ts          # Electron entry point
├── preload/              # IPC bridge (contextBridge)
├── renderer/             # React frontend
│   ├── components/       # UI components
│   ├── hooks/            # TanStack Query hooks
│   ├── stores/           # Zustand stores
│   ├── App.tsx
│   └── main.tsx
└── shared/               # Shared TypeScript types
```

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm**
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (for AI summaries)

### Installation

```bash
# Clone the repo
git clone https://github.com/yuno-404/PodSumAI.git
cd PodSumAI

# Install dependencies
npm install

# Rebuild native modules for Electron
npm run rebuild

# Set up environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Development

```bash
npm run dev
```

This starts Vite dev server, TypeScript watchers, and Electron concurrently.

### Build

```bash
# Build and package for current platform
npm run build
```

Output will be in the `release/` folder.

## File Paths

| Purpose | Location |
|---------|----------|
| Persistent downloads | `~/Music/Podcasts/{podcast}/{episode}.mp3` |
| Temp audio cache | `{os.tmpdir()}/myapp-cache/{episodeId}.mp3` |
| Database | `{userData}/podcast.db` |
| API Key | `.env` (GEMINI_API_KEY) |

## How It Works

### Feed Ingestion
RSS URL → Worker Thread parsing → Transactional upsert to SQLite

### Audio Provisioning
Check local download → If missing, download to temp → Return path

### AI Summary Pipeline
Provision audio → Upload to Gemini Files API → Poll until ACTIVE → Generate summary → Save to DB → Cleanup remote file + temp file in `finally` block

### Startup Self-Healing
On launch, delete orphaned temp files in `{os.tmpdir()}/myapp-cache/`

## Security

- Context Isolation enabled
- Node Integration disabled in renderer
- Only whitelisted IPC methods exposed via preload
- SQL injection prevention with prepared statements
- Filename sanitization to prevent path traversal

## License

[GPL-3.0](LICENSE) - You are free to use, modify, and distribute this software, but any derivative work must also be open-sourced under the same license.
