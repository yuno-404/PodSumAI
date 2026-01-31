import { app, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import os from "os";
import { DatabaseManager } from "./database/index.js";
import { PodcastService } from "./services/PodcastService.js";
import { AudioService } from "./services/AudioService.js";
import { GeminiService } from "./services/GeminiService.js";
import { ConfigService } from "./services/ConfigService.js";
import { registerHandlers } from "./ipc/handlers.js";

let mainWindow: BrowserWindow | null = null;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "PodSumAI",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for better-sqlite3
    },
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent flash
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Load the renderer
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * Flow D: Startup Self-Healing
 *
 * Cleanup orphaned temporary files on app launch
 */
function cleanupTempFiles() {
  const tempDir = path.join(os.tmpdir(), "myapp-cache");

  try {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      let cleanedCount = 0;

      files.forEach((file) => {
        if (file.endsWith(".mp3")) {
          try {
            const filePath = path.join(tempDir, file);
            fs.unlinkSync(filePath);
            cleanedCount++;
          } catch (err) {
            console.error(`Failed to cleanup temp file: ${file}`, err);
          }
        }
      });

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} orphaned temp files`);
      }
    }
  } catch (err) {
    console.error("Failed to cleanup temp directory:", err);
  }
}

/**
 * Initialize services and register IPC handlers
 */
function initializeServices() {
  try {
    // Get database path
    const dbPath = path.join(app.getPath("userData"), "podcast.db");
    console.log("Database path:", dbPath);

    // Initialize database
    const db = new DatabaseManager(dbPath);

    // Initialize services
    const audioService = new AudioService(db);
    const podcastService = new PodcastService(db);
    const configService = new ConfigService(db, app.getPath("userData"));


    // Get Gemini API key: prefer .env file (managed by ConfigService), fallback to process.env
    const geminiApiKey =
      configService.getApiKey() || process.env.GEMINI_API_KEY || "";
    if (!geminiApiKey) {
      console.warn(
        "WARNING: GEMINI_API_KEY not set. AI summary functionality will not work.",
      );
    }

    const geminiService = new GeminiService(db, audioService, geminiApiKey);

    // Register IPC handlers
    registerHandlers({
      podcast: podcastService,
      audio: audioService,
      gemini: geminiService,
      config: configService,
    });

    console.log("Services initialized successfully");

    // Log database stats
    const stats = db.getStats();
    console.log("Database stats:", stats);
  } catch (error) {
    console.error(
      "FATAL: Failed to initialize services. IPC handlers NOT registered.",
      error,
    );
  }
}

/**
 * App ready event
 */
app.on("ready", async () => {
  console.log("App ready");

  // Flow D: Cleanup temp files
  cleanupTempFiles();

  // Initialize services
  initializeServices();

  // Create window
  createWindow();
});

/**
 * All windows closed event
 */
app.on("window-all-closed", () => {
  // On macOS, apps typically stay active until explicitly quit
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * Activate event (macOS)
 */
app.on("activate", () => {
  // Re-create window on macOS when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * Before quit event
 */
app.on("before-quit", () => {
  console.log("App quitting...");
});

/**
 * Handle uncaught errors
 */
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
});
