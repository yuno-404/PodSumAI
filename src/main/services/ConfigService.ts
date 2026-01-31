import fs from "fs";
import path from "path";
import { DatabaseManager } from "../database/index.js";
import type { DbStats } from "../../shared/types.js";

/**
 * ConfigService - Application Configuration & Utilities
 *
 * Responsibilities:
 * - Manage Gemini API key (.env file read/write)
 * - Provide database statistics
 */
export class ConfigService {
  constructor(private db: DatabaseManager) {}

  /**
   * Save Gemini API key to .env file
   *
   * @param apiKey - Gemini API key (must start with 'AIza')
   */
  saveApiKey(apiKey: string): void {
    if (!apiKey || apiKey.trim().length < 10) {
      throw new Error("API key is too short");
    }

    if (!apiKey.startsWith("AIza")) {
      throw new Error(
        "Invalid API key format. Gemini API keys start with 'AIza'",
      );
    }

    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    const keyLine = `GEMINI_API_KEY=${apiKey}`;
    const envLines = envContent.split("\n");
    let keyExists = false;

    const updatedLines = envLines.map((line) => {
      if (line.startsWith("GEMINI_API_KEY=")) {
        keyExists = true;
        return keyLine;
      }
      return line;
    });

    if (!keyExists) {
      updatedLines.push(keyLine);
    }

    fs.writeFileSync(envPath, updatedLines.join("\n"), "utf8");
  }

  /**
   * Read Gemini API key from .env file
   *
   * @returns API key string, or empty string if not set
   */
  getApiKey(): string {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) {
      return "";
    }

    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split("\n");

    for (const line of lines) {
      if (line.startsWith("GEMINI_API_KEY=")) {
        const parts = line.split("=");
        if (parts.length >= 2 && parts[1].trim()) {
          return parts[1].trim();
        }
      }
    }

    return "";
  }

  /**
   * Remove Gemini API key from .env file
   */
  removeApiKey(): void {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return;

    const envContent = fs.readFileSync(envPath, "utf8");
    const updatedLines = envContent
      .split("\n")
      .filter((line) => !line.startsWith("GEMINI_API_KEY="));

    fs.writeFileSync(envPath, updatedLines.join("\n"), "utf8");
  }


  /**
   * Get database statistics for debugging
   */
  getDbStats(): DbStats {
    return this.db.getStats();
  }
}
