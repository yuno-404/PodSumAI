import { useState, useMemo } from "react";
import {
  useDownloadedEpisodes,
  usePodcasts,
  useDeleteDownload,
} from "../hooks/useQueries";
import { useGeneratingStore } from "../stores/useGeneratingStore";
import { useToastStore } from "../stores/useToastStore";
import type { Episode } from "../../shared/types";
import { DeleteDownloadAlertDialog } from "./DeleteDownloadAlertDialog";

interface LocalUploadTabContentProps {
  activeEpisodeId: string | null;
  onEpisodeClick: (episode: any) => void;
  onAiSummary: (episodeId: string) => void;
  onReadSummary: (episodeId: string) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateText(text: string, maxLength: number = 35): string {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function EpisodeRow({
  episode,
  onEpisodeClick,
  onAiSummary,
  onReadSummary,
  onDeleteDownload,
  isActive,
}: {
  episode: Episode;
  onEpisodeClick: (episode: Episode) => void;
  onAiSummary: (episodeId: string) => void;
  onReadSummary: (episodeId: string) => void;
  onDeleteDownload: (episode: Episode) => void;
  isActive: boolean;
}) {
  const isGenerating = useGeneratingStore((state) => state.isGenerating);

  return (
    <div
      className={`flex items-center gap-3 h-11 px-4 pl-12 cursor-pointer transition-colors ${
        isActive ? "bg-white-10" : "hover:bg-white-5"
      }`}
      onClick={() => onEpisodeClick(episode)}
    >
      {/* Episode title */}
      <span className="text-[#a1a1aa] text-[13px] flex-1 truncate">
        {episode.title}
      </span>
      {/* Date */}
      <span className="text-[#52525b] text-[12px] flex-shrink-0">
        {formatDate(episode.pub_date)}
      </span>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* AI Summary button (sparkles) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAiSummary(episode.id);
          }}
          disabled={isGenerating}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
            isGenerating ? "opacity-50 cursor-not-allowed" : "hover:bg-white-10"
          }`}
          title={isGenerating ? "Generating summary" : "Generate AI summary"}
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

        {/* Read summary button (file-text) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReadSummary(episode.id);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors text-[#a1a1aa] hover:bg-white-10`}
          title="Read summary"
        >
          <svg
            className="w-[18px] h-[18px] text-status-success"
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

        {/* Delete download button (trash) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteDownload(episode);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors text-[#a1a1aa] hover:text-red-400 hover:bg-white-10"
          title="Remove download"
        >
          <svg
            className="w-[18px] h-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 11V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function PodcastFolder({
  podcastTitle,
  episodes,
  activeEpisodeId,
  onEpisodeClick,
  onAiSummary,
  onReadSummary,
  onDeleteDownload,
}: {
  podcastTitle: string;
  episodes: Episode[];
  activeEpisodeId: string | null;
  onEpisodeClick: (episode: Episode) => void;
  onAiSummary: (episodeId: string) => void;
  onReadSummary: (episodeId: string) => void;
  onDeleteDownload: (episode: Episode) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-lg bg-[#18181b] border border-[#ffffff1a] overflow-hidden">
      {/* Folder Header */}
      <button
        className="w-full flex items-center gap-3 h-14 px-4 hover:bg-white-5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Chevron */}
        <svg
          className="w-4 h-4 text-[#a1a1aa] flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          {isExpanded ? <path d="M6 9l6 6 6-6" /> : <path d="M9 18l6-6-6-6" />}
        </svg>

        {/* Folder icon */}
        {isExpanded ? (
          <svg
            className="w-[18px] h-[18px] text-[#6366f1] flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
          </svg>
        ) : (
          <svg
            className="w-[18px] h-[18px] text-[#52525b] flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
          </svg>
        )}

        {/* Podcast name */}
        <span className="text-[#f4f4f5] text-[14px] font-medium truncate">
          {podcastTitle}
        </span>

        {/* Badge */}
        <div className="ml-auto flex items-center h-[22px] px-2 rounded-full bg-[#ffffff1a] flex-shrink-0">
          <span className="text-[#a1a1aa] text-[11px]">
            {episodes.length} episodes
          </span>
        </div>
      </button>

      {/* Episodes list */}
      {isExpanded && episodes.length > 0 && (
        <div className="flex flex-col">
          {episodes.map((episode) => (
            <EpisodeRow
              key={episode.id}
              episode={episode}
              onEpisodeClick={onEpisodeClick}
              onAiSummary={onAiSummary}
              onReadSummary={onReadSummary}
              onDeleteDownload={onDeleteDownload}
              isActive={episode.id === activeEpisodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LocalUploadTabContent({
  activeEpisodeId,
  onEpisodeClick,
  onAiSummary,
  onReadSummary,
}: LocalUploadTabContentProps) {
  const { data: downloadedEpisodes = [], isLoading: downloadedLoading } =
    useDownloadedEpisodes();
  const { data: podcasts, isLoading: podcastsLoading } = usePodcasts();
  const deleteDownloadMutation = useDeleteDownload();
  const addToast = useToastStore((state) => state.addToast);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState<Episode | null>(null);

  // Group downloaded episodes by podcast_id
  const groupedData = useMemo(() => {
    if (!podcasts || downloadedEpisodes.length === 0) return [];

    const podcastMap = new Map<string, { title: string }>();
    for (const p of podcasts) {
      podcastMap.set(p.id, { title: p.title });
    }

    const groups = new Map<string, { title: string; episodes: Episode[] }>();
    for (const ep of downloadedEpisodes) {
      const podcast = podcastMap.get(ep.podcast_id);
      const title = podcast?.title ?? "Unknown podcast";
      if (!groups.has(ep.podcast_id)) {
        groups.set(ep.podcast_id, { title, episodes: [] });
      }
      groups.get(ep.podcast_id)!.episodes.push(ep);
    }

    return Array.from(groups.entries()).map(([podcastId, group]) => ({
      podcastId,
      ...group,
    }));
  }, [downloadedEpisodes, podcasts]);

  const handleDeleteDownload = (episode: Episode) => {
    setEpisodeToDelete(episode);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!episodeToDelete) return;

    try {
      await deleteDownloadMutation.mutateAsync(episodeToDelete.id);
      addToast({
        type: "success",
        title: "Download removed",
        description: truncateText(episodeToDelete.title),
        duration: 3000,
      });
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Remove failed",
        description: error.message,
        duration: 5000,
      });
    } finally {
      setDeleteDialogOpen(false);
      setEpisodeToDelete(null);
    }
  };

  if (downloadedLoading || podcastsLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[#a1a1aa]">
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  if (downloadedEpisodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#52525b]">
        <div className="text-center">
          <div className="text-4xl mb-2">💾</div>
          <div className="text-sm mb-1">No downloaded episodes yet</div>
          <div className="text-xs text-[#3f3f46]">
            Click download button in episode list
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-[20px] font-medium text-[#f4f4f5]">
          Downloaded Episodes
        </h2>
        <span className="text-[#a1a1aa] text-[13px]">
          {downloadedEpisodes.length} episodes from {groupedData.length}{" "}
          podcasts
        </span>
      </div>

      {/* Folder list */}
      <div className="flex-1">
        <div className="flex flex-col gap-2">
          {groupedData.map((group) => (
            <PodcastFolder
              key={group.podcastId}
              podcastTitle={group.title}
              episodes={group.episodes}
              activeEpisodeId={activeEpisodeId}
              onEpisodeClick={onEpisodeClick}
              onAiSummary={onAiSummary}
              onReadSummary={onReadSummary}
              onDeleteDownload={handleDeleteDownload}
            />
          ))}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteDownloadAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        episodeTitle={truncateText(episodeToDelete?.title || "", 40)}
      />
    </div>
  );
}
