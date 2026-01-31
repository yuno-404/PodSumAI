import { useState } from "react";
import { EpisodeList } from "./EpisodeList";
import { useEpisodes } from "../hooks/useQueries";

function PodcastDetailHeader({
  podcast,
  episodeCount,
}: {
  podcast: any;
  episodeCount: number;
}) {
  return (
    <div
      className="flex items-end gap-6 p-8 h-[200px]"
      style={{
        background: "linear-gradient(180deg, #6366f1 0%, #09090b 100%)",
      }}
    >
      {podcast.artwork_url ? (
        <img
          src={podcast.artwork_url}
          alt={podcast.title}
          className="w-[140px] h-[140px] rounded-lg object-cover flex-shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="w-[140px] h-[140px] rounded-lg bg-accent-primary flex-shrink-0" />
      )}
      <div className="flex flex-col gap-3 min-w-0">
        <span className="text-[11px] font-medium text-[#a1a1aa] tracking-wide">
          PODCAST
        </span>
        <h1 className="text-5xl font-semibold text-[#f4f4f5] truncate">
          {podcast.title}
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-[#a1a1aa]">
            {episodeCount} Episodes
          </span>
        </div>
      </div>
    </div>
  );
}

function EpisodeListHeader({
  sortOrder,
  onSortChange,
  searchQuery,
  onSearchChange,
  onCustomPromptClick,
}: {
  sortOrder: "newest" | "oldest";
  onSortChange: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCustomPromptClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between h-10">
      <span className="text-base font-medium text-[#f4f4f5]">All Episodes</span>
      <div className="flex items-center gap-3">
        <div className="relative w-[200px]">
          <input
            type="text"
            placeholder="Search episodes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 px-3 pl-9 rounded-md bg-[#18181b] !text-[#e4e4e7] text-[13px] outline-none focus:ring-1 focus:ring-accent-primary placeholder-[#a1a1aa] border border-white-5"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1aa]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <button
          onClick={onCustomPromptClick}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-white-5 hover:bg-white-10 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 text-[#a1a1aa]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="text-[12px] text-[#a1a1aa]">Custom Prompt</span>
        </button>
        <button
          onClick={onSortChange}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-white-5 hover:bg-white-10 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 text-[#a1a1aa]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="m3 16 4 4 4-4" />
            <path d="M7 20V4" />
            <path d="m21 8-4-4-4 4" />
            <path d="M17 4v16" />
          </svg>
          <span className="text-[12px] text-[#a1a1aa]">
            {sortOrder === "newest" ? "Newest" : "Oldest"}
          </span>
        </button>
      </div>
    </div>
  );
}

interface EpisodesTabContentProps {
  activePodcastId: string | null;
  activePodcast: any;
  activeEpisodeId: string | null;
  onEpisodeClick: (episode: any) => void;
  onCustomPromptClick: () => void;
  onAiSummary: (episodeId: string) => void;
  onReadSummary: (episodeId: string) => void;
  onDownload: (episodeId: string, episodeTitle: string) => void;
}

export function EpisodesTabContent({
  activePodcastId,
  activePodcast,
  activeEpisodeId,
  onEpisodeClick,
  onCustomPromptClick,
  onAiSummary,
  onReadSummary,
  onDownload,
}: EpisodesTabContentProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: episodes = [], isLoading: episodesLoading } =
    useEpisodes(activePodcastId);

  const filteredEpisodes = episodes.filter((ep: any) =>
    ep.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedEpisodes = [...filteredEpisodes].sort((a, b) => {
    const dateA = new Date(a.pub_date).getTime();
    const dateB = new Date(b.pub_date).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  if (!activePodcastId) {
    return (
      <div className="flex items-center justify-center h-full text-[#52525b]">
        <div className="text-center">
          <div className="text-4xl mb-2">📻</div>
          <div className="text-sm">Select one podcast</div>
        </div>
      </div>
    );
  }

  if (episodesLoading) {
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

  return (
    <div className="flex flex-col h-full">
      {activePodcast && (
        <PodcastDetailHeader
          podcast={activePodcast}
          episodeCount={episodes.length}
        />
      )}

      <div className="px-8 pt-6">
        <EpisodeListHeader
          sortOrder={sortOrder}
          onSortChange={() =>
            setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCustomPromptClick={onCustomPromptClick}
        />
      </div>

      <div className="flex-1 min-h-0 px-8" key={sortOrder}>
        {sortedEpisodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#52525b]">
            <div className="text-center">
              <div className="text-4xl mb-2">📭</div>
              <div className="text-sm">No episodes found</div>
            </div>
          </div>
        ) : (
          <EpisodeList
            episodes={sortedEpisodes}
            selectedEpisodeId={activeEpisodeId}
            onEpisodeClick={onEpisodeClick}
            onAiSummary={onAiSummary}
            onReadSummary={onReadSummary}
            onDownload={(id, title) => onDownload(id, title)}
          />
        )}
      </div>
    </div>
  );
}
