import { parentPort } from "worker_threads";
import { XMLParser } from "fast-xml-parser";
import axios from "axios";
import type { RSSFeed } from "../../shared/types.js";

/**
 * RSS Parser Worker Thread
 *
 * Purpose: Offload CPU-intensive XML parsing from the main thread
 * to prevent UI freezing when parsing large RSS feeds (e.g., Joe Rogan feed ~5MB)
 *
 * Communication:
 * - Receives: { url: string }
 * - Sends: RSSFeed | { error: string }
 */

parentPort?.on("message", async ({ url }: { url: string }) => {
  try {
    // Step 1: Fetch RSS XML via HTTP
    const response = await axios.get(url, {
      timeout: 15000, // 15 second timeout
      headers: {
        "User-Agent": "Podcast-AI-Orchestrator/1.0",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      maxContentLength: 10 * 1024 * 1024, // Max 10MB
      validateStatus: (status) => status >= 200 && status < 300,
    });

    // Step 2: Parse XML (CPU-intensive operation)
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: false,
      trimValues: true,
    });

    const feed = parser.parse(response.data);

    // Step 3: Validate feed structure
    if (!feed?.rss?.channel) {
      throw new Error("Invalid RSS feed structure: missing channel");
    }

    const channel = feed.rss.channel;

    // Step 4: Extract podcast metadata
    // Extract artwork from itunes:image or standard image tag
    let artworkUrl: string | undefined;
    if (channel["itunes:image"]?.["@_href"]) {
      artworkUrl = channel["itunes:image"]["@_href"];
    } else if (channel.image?.url) {
      artworkUrl = channel.image.url;
    }

    const podcast = {
      title: channel.title || "Untitled Podcast",
      feed_url: url,
      artwork_url: artworkUrl,
    };

    // Step 5: Extract episodes
    const items = channel.item;
    if (!items) {
      // Empty feed, but valid
      parentPort?.postMessage({
        podcast,
        episodes: [],
      } as RSSFeed);
      return;
    }

    // Ensure items is always an array
    const itemsArray = Array.isArray(items) ? items : [items];

    const episodes = itemsArray
      .filter((item: any) => {
        // Must have either enclosure URL or link
        const hasAudio =
          item.enclosure?.["@_url"] ||
          item["media:content"]?.["@_url"] ||
          item.link;
        return hasAudio && item.title;
      })
      .map((item: any) => {
        // Extract audio URL
        const audioUrl =
          item.enclosure?.["@_url"] ||
          item["media:content"]?.["@_url"] ||
          item.link ||
          "";

        // Extract GUID (fallback to audio URL or link)
        const guid =
          item.guid?.["#text"] ||
          item.guid ||
          audioUrl ||
          item.link ||
          `${podcast.title}-${item.title}`;

        // Extract publication date
        let pubDate: string;
        try {
          if (item.pubDate) {
            pubDate = new Date(item.pubDate).toISOString();
          } else if (item["dc:date"]) {
            pubDate = new Date(item["dc:date"]).toISOString();
          } else {
            pubDate = new Date().toISOString();
          }
        } catch (err) {
          // Invalid date format, use current time
          pubDate = new Date().toISOString();
        }

        // Extract duration (in seconds)
        let duration = 0;
        if (item["itunes:duration"]) {
          const durationStr = String(item["itunes:duration"]);
          if (durationStr.includes(":")) {
            const parts = durationStr.split(":").map(Number);
            if (parts.length === 3) {
              duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
              duration = parts[0] * 60 + parts[1];
            } else {
              duration = parseInt(durationStr, 10) || 0;
            }
          } else {
            duration = parseInt(durationStr, 10) || 0;
          }
        }

        return {
          guid,
          title: item.title,
          pub_date: pubDate,
          duration,
          audio_url: audioUrl,
        };
      });

    // Step 6: Send result back to main thread
    parentPort?.postMessage({
      podcast,
      episodes,
    } as RSSFeed);
  } catch (error: any) {
    // Send error back to main thread
    let errorMessage = "Unknown error parsing RSS feed";

    if (axios.isAxiosError(error)) {
      if (error.code === "ENOTFOUND") {
        errorMessage = `DNS resolution failed: ${error.config?.url}`;
      } else if (error.code === "ECONNRESET") {
        errorMessage = "Connection reset by server";
      } else if (error.code === "ETIMEDOUT") {
        errorMessage = "Request timeout (> 15 seconds)";
      } else if (error.response) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else {
        errorMessage = error.message;
      }
    } else {
      errorMessage = error.message || errorMessage;
    }

    parentPort?.postMessage({ error: errorMessage });
  }
});
