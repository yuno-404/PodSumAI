# PodSumAI

A desktop app that manages podcast subscriptions and generates AI-powered episode summaries using Google Gemini.

![Electron](https://img.shields.io/badge/Electron-33-blue)
![License](https://img.shields.io/badge/License-GPL--3.0-green)

## Features

- Subscribe to podcasts via RSS or keyword search
- Generate AI summaries for any episode (Google Gemini)
- Set custom prompts per podcast
- Download episodes locally, organized by podcast
- Browse all summaries in a knowledge base
- Cross-platform: Windows and macOS

---

## Download & Install

### Step 1: Download

Go to the [Releases](https://github.com/yuno-404/PodSumAI/releases) page.

- **Windows** - Download the `.exe` file
- **macOS** - Download the `.dmg` file

### Step 2: Install

**Windows:**
1. Double-click the downloaded `.exe`
2. Follow the installer steps (you can choose install location)
3. Launch PodSumAI from the Start Menu or Desktop

**macOS:**
1. Double-click the downloaded `.dmg`
2. Drag **PodSumAI** into the **Applications** folder
3. First launch: right-click the app > "Open" (to bypass Gatekeeper)

### Step 3: Set up your API Key

The app needs a Google Gemini API key to generate summaries.

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API key
2. Open PodSumAI, click the settings/key icon
3. Paste your API key and save

That's it! You can now subscribe to podcasts and generate AI summaries.

---

## For Developers

<details>
<summary>Click to expand development setup</summary>

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
git clone https://github.com/yuno-404/PodSumAI.git
cd PodSumAI
npm install
npm run rebuild
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
# Output in release/ folder
```

### Tech Stack

- **Frontend**: React 18 + Vite + Zustand + TanStack Query + Tailwind CSS
- **Backend**: Electron 33 + better-sqlite3 + Google Gemini API
- **Language**: TypeScript (strict mode)

</details>

---

## License

[GPL-3.0](LICENSE) - Free to use and modify, but derivative works must also be open-sourced under the same license.
