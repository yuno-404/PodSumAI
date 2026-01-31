import { useState, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Episode } from "../../shared/types";
import { useGeneratingStore } from "../stores/useGeneratingStore";
import { useToastStore } from "../stores/useToastStore";

interface EpisodeListProps {
  episodes: Episode[];
  onEpisodeClick: (episode: Episode) => void;
  selectedEpisodeId?: string | null;
  onDownload?: (episodeId: string, episodeTitle: string) => void;
  onAiSummary?: (episodeId: string) => void;
  onReadSummary?: (episodeId: string) => void;
}

/**
 * Virtual Episode List Component
 *
 * CRITICAL RULES:
 * - FIXED row height: 64px (MUST match CSS)
 * - Use TanStack Virtual for 5000+ episodes
 * - NO spinners inside rows (use global toast)
 * - Truncate text (no wrapping)
 */
export function EpisodeList({
  episodes,
  onEpisodeClick,
  onDownload,
  onAiSummary,
  onReadSummary,
}: EpisodeListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const isGenerating = useGeneratingStore((state) => state.isGenerating);
  const addToast = useToastStore((state) => state.addToast);
  const [hasDocumentMap, setHasDocumentMap] = useState<Record<string, boolean>>(
    {},
  );
  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>(
    {},
  );
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);

  const rowVirtualizer = useVirtualizer({
    count: episodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // CRITICAL: Fixed 64px height
    overscan: 5,
  });

  // 更新可見項目的索引
  useEffect(() => {
    const items = rowVirtualizer.getVirtualItems();
    setVisibleIndices(items.map((item) => item.index));
  }, [rowVirtualizer.getVirtualItems()]);

  // 檢查可見的 episodes 是否有摘要文件
  useEffect(() => {
    const checkVisibleDocuments = async () => {
      for (const index of visibleIndices) {
        const episode = episodes[index];
        if (!episode) continue;

        // 如果還沒檢查過這個 episode
        if (!hasDocumentMap[episode.id]) {
          try {
            const result = await window.api.getDocuments(episode.id);
            if (result.success && result.data && result.data.length > 0) {
              setHasDocumentMap((prev) => ({ ...prev, [episode.id]: true }));
            }
          } catch {
            // 靜默處理錯誤，不影響使用者體驗
          }
        }
      }
    };

    checkVisibleDocuments();
  }, [visibleIndices, episodes, hasDocumentMap]);

  // 檢查可見的 episodes 是否已下載
  useEffect(() => {
    const checkVisibleDownloads = () => {
      for (const index of visibleIndices) {
        const episode = episodes[index];
        if (!episode) continue;

        if (!downloadedMap[episode.id] && episode.is_downloaded) {
          setDownloadedMap((prev) => ({ ...prev, [episode.id]: true }));
        }
      }
    };

    checkVisibleDownloads();
  }, [visibleIndices, episodes, downloadedMap]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:00`;
    }
    return `${minutes} min`;
  };

  if (episodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#52525b]">
        <div className="text-center">
          <div className="text-4xl mb-2">📻</div>
          <div className="text-sm">This podcast has no episodes</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const episode = episodes[virtualRow.index];
          const isNew = !episode.is_downloaded; // simplified: treat non-downloaded as "new"

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full cursor-pointer transition-colors border-b border-white-5 hover:bg-white-5"
              style={{
                height: "64px",
                transform: `translateY(${virtualRow.start}px)`,
              }}
              onClick={() => onEpisodeClick(episode)}
            >
              <div className="h-full flex items-center justify-between px-4">
                {/* Left: dot + episode info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isNew ? "bg-status-success" : "bg-zinc-700"
                    }`}
                  />
                  <div className="min-w-0 flex flex-col gap-1">
                    <div className="text-[13px] font-medium text-[#f4f4f5] truncate">
                      {episode.title}
                    </div>
                    <div className="text-[12px] text-[#52525b]">
                      {formatDate(episode.pub_date)}
                      {episode.duration > 0 &&
                        ` · ${formatDuration(episode.duration)}`}
                    </div>
                  </div>
                </div>

                {/* Right: action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* AI Summary button (sparkles) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAiSummary?.(episode.id);
                    }}
                    disabled={isGenerating}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                      isGenerating
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-white-10"
                    }`}
                    title={
                      isGenerating
                        ? "Generating summary..."
                        : "Generate AI summary"
                    }
                  >
                    <svg
                      className={`w-[18px] h-[18px] ${
                        isGenerating ? "text-[#52525b]" : "text-status-success"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      <path d="M5 3v4" />
                      <path d="M19 17v4" />
                      <path d="M3 5h4" />
                      <path d="M17 19h4" />
                    </svg>
                  </button>

                  {/* Download button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (downloadedMap[episode.id]) {
                        addToast({
                          type: "info",
                          title: "Already Downloaded",
                          description: "This episode is already saved locally",
                          duration: 3000,
                        });
                      } else {
                        onDownload?.(episode.id, episode.title);
                      }
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                      downloadedMap[episode.id]
                        ? "text-status-success opacity-50 cursor-not-allowed"
                        : "text-[#a1a1aa] hover:bg-white-10"
                    }`}
                    title={
                      downloadedMap[episode.id] ? "Downloaded" : "Download"
                    }
                  >
                    <svg
                      className={`w-[18px] h-[18px] ${
                        downloadedMap[episode.id]
                          ? "text-status-success"
                          : "text-[#a1a1aa]"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                  </button>

                  {/* Read summary button (file-text) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReadSummary?.(episode.id);
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                      hasDocumentMap[episode.id]
                        ? "text-status-success hover:bg-white-10"
                        : "text-[#a1a1aa] opacity-50"
                    }`}
                    title={
                      hasDocumentMap[episode.id]
                        ? "Read summary"
                        : "No summary yet"
                    }
                  >
                    <svg
                      className={`w-[18px] h-[18px] ${
                        hasDocumentMap[episode.id]
                          ? "text-status-success"
                          : "text-[#a1a1aa]"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                      <path d="M10 9H8" />
                      <path d="M16 13H8" />
                      <path d="M16 17H8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
