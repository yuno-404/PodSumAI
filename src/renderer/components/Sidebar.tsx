import React, { useState } from "react";
import {
  usePodcasts,
  useDeletePodcast,
  useGetApiKey,
} from "../hooks/useQueries";
import { useAppStore } from "../stores/useAppStore";
import { useToastStore } from "../stores/useToastStore";
import { DeletePodcastAlertDialog } from "./DeletePodcastAlertDialog";

interface SidebarProps {
  onSubscribeClick: () => void;
  onApiKeyClick?: () => void;
}

export function Sidebar({ onApiKeyClick }: SidebarProps) {
  const { data: podcasts, isLoading } = usePodcasts();
  const deleteMutation = useDeletePodcast();
  const { data: apiKey } = useGetApiKey();
  const {
    activePodcastId,
    setActivePodcast,
    searchQuery,
    setSearchQuery,
    setSearchMode,
  } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [podcastToDelete, setPodcastToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Show all podcasts (no filtering during search)
  const displayPodcasts = podcasts || [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 1) {
      setSearchMode(true);
    } else {
      setSearchMode(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim().length >= 1) {
      setSearchMode(true);
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setSearchMode(false);
    }
  };

  const handleUnsubscribe = (
    podcastId: string,
    podcastTitle: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setPodcastToDelete({ id: podcastId, title: podcastTitle });
    setDeleteDialogOpen(true);
  };

  const handleSoftDelete = async () => {
    if (!podcastToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        podcastId: podcastToDelete.id,
        permanent: false,
      });
      addToast({ type: "success", title: "已取消訂閱", duration: 3000 });
    } catch {
      addToast({ type: "error", title: "操作失敗", duration: 3000 });
    } finally {
      setDeleteDialogOpen(false);
      setPodcastToDelete(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!podcastToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        podcastId: podcastToDelete.id,
        permanent: true,
      });
      addToast({ type: "success", title: "已永久刪除", duration: 3000 });
    } catch {
      addToast({ type: "error", title: "刪除失敗", duration: 3000 });
    } finally {
      setDeleteDialogOpen(false);
      setPodcastToDelete(null);
    }
  };

  return (
    <div className="w-[260px] bg-app-bg border-r border-white-5 flex flex-col h-full justify-between">
      {/* Sidebar Top */}
      <div className="flex flex-col min-h-0">
        {/* Logo Area */}
        <div className="h-14 flex items-center px-4 gap-2.5">
          {/* Lucide podcast icon */}
          <svg
            className="w-[22px] h-[22px] text-accent-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
            <circle cx="12" cy="12" r="2" />
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
            <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
          </svg>
          <span className="text-[#f4f4f5] font-medium text-base">
            PodSum AI
          </span>
        </div>

        {/* Search Area */}
        <div className="h-14 flex items-center px-4 gap-3 border-b border-white-5">
          {/* Lucide search icon */}
          <svg
            className="w-4 h-4 text-[#a1a1aa]"
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
          <input
            type="text"
            placeholder="Search or Paste URL..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9 px-3 rounded-md bg-[#18181b] !text-[#e4e4e7] text-[13px] outline-none focus:ring-1 focus:ring-accent-primary placeholder-[#a1a1aa]"
          />
        </div>

        {/* Subscription List */}
        <div className="flex-1 overflow-y-auto py-3">
          <div className="px-4 mb-1">
            <div className="text-[#a1a1aa] text-[11px] font-medium tracking-wide">
              SUBSCRIPTIONS
            </div>
          </div>

          {isLoading ? (
            <div className="px-4 py-2 text-[#a1a1aa] text-sm">Loading...</div>
          ) : displayPodcasts.length > 0 ? (
            <div className="space-y-0.5">
              {displayPodcasts.map((podcast: any) => {
                const isActive = activePodcastId === podcast.id;
                return (
                  <div
                    key={podcast.id}
                    onClick={() => {
                      setActivePodcast(podcast.id);
                      setSearchMode(false);
                    }}
                    className={`h-10 flex items-center gap-3 px-4 cursor-pointer transition-colors ${
                      isActive
                        ? "bg-white-10 border-l-2 border-accent-primary"
                        : "hover:bg-white-5"
                    }`}
                  >
                    {podcast.artwork_url ? (
                      <img
                        src={podcast.artwork_url}
                        alt=""
                        className="w-6 h-6 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        className={`w-6 h-6 rounded ${isActive ? "bg-accent-primary" : "bg-zinc-700"}`}
                      />
                    )}
                    <span
                      className={`text-[13px] truncate ${
                        isActive
                          ? "text-[#f4f4f5] font-medium"
                          : "text-[#a1a1aa]"
                      }`}
                    >
                      {podcast.title}
                    </span>
                    <button
                      onClick={(e) =>
                        handleUnsubscribe(podcast.id, podcast.title, e)
                      }
                      className="ml-auto text-[#52525b] hover:text-status-error transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-[#a1a1aa] text-sm">
              <div className="mb-2">No subscriptions yet</div>
              <div className="text-xs text-[#71717a]">
                Enter a podcast name in the search box above
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Bottom */}
      <div className="p-4 space-y-1">
        {/* Open download folder */}
        <button
          onClick={() => window.api.openDownloadFolder()}
          className="w-full h-9 flex items-center gap-2 px-3 rounded-md hover:bg-white-10 transition-colors cursor-pointer"
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
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
          </svg>
          <span className="text-[#a1a1aa] text-xs truncate">
            Downloads
          </span>
        </button>
        {/* API Status */}
        <button
          onClick={onApiKeyClick}
          className="w-full h-9 flex items-center gap-2 px-3 rounded-md hover:bg-white-10 transition-colors cursor-pointer"
        >
          {/* Lucide key icon */}
          <svg
            className={`w-3.5 h-3.5 ${apiKey ? "text-status-success" : "text-status-error"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
            <path d="m21 2-9.6 9.6" />
            <circle cx="7.5" cy="15.5" r="5.5" />
          </svg>
          <span className="text-[#a1a1aa] text-xs">
            {apiKey ? "API Connected" : "API Disconnected"}
          </span>
        </button>
      </div>

      {/* Delete Podcast Alert Dialog */}
      <DeletePodcastAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSoftDelete={handleSoftDelete}
        onPermanentDelete={handlePermanentDelete}
        podcastTitle={podcastToDelete?.title}
      />
    </div>
  );
}
