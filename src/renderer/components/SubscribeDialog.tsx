import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useSearchPodcasts,
  useSubscribePodcast,
  usePodcasts,
} from "../hooks/useQueries";
import { useToastStore } from "../stores/useToastStore";

interface SubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PodcastSearchResult {
  id: string;
  title: string;
  author: string;
  feedUrl: string;
  artworkUrl: string;
  description: string;
}

export function SubscribeDialog({ open, onOpenChange }: SubscribeDialogProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PodcastSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchMutation = useSearchPodcasts();
  const subscribeMutation = useSubscribePodcast();
  const { data: podcasts = [] } = usePodcasts();
  const addToast = useToastStore((state) => state.addToast);

  // Check if a podcast is already subscribed
  const isSubscribed = (feedUrl: string) => {
    return podcasts.some((p: any) => p.feed_url === feedUrl);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      addToast({
        type: "error",
        title: "Please enter a search keyword",
        description: "Search keyword cannot be empty",
      });
      return;
    }

    // Check if input is a URL
    const isUrl =
      query.trim().startsWith("http://") || query.trim().startsWith("https://");

    if (isUrl) {
      // Direct subscription
      handleSubscribe(query.trim());
      return;
    }

    // Search for podcasts
    setIsSearching(true);
    try {
      const results = await searchMutation.mutateAsync(query.trim());
      setSearchResults(results);

      if (results.length === 0) {
        addToast({
          type: "warning",
          title: "No results found",
          description: "Please try different keywords",
        });
      }
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Search failed",
        description: error.message,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubscribe = async (feedUrl: string) => {
    if (isSubscribed(feedUrl)) {
      addToast({
        type: "warning",
        title: "Already subscribed",
        description: "This podcast is already in your subscriptions",
      });
      return;
    }

    addToast({
      type: "loading",
      title: "Subscribing...",
      description: "Please wait, fetching podcast info",
      duration: 10000,
    });

    try {
      const result = await subscribeMutation.mutateAsync({ url: feedUrl });

      addToast({
        type: "success",
        title: "Podcast synced",
        description: `Found ${result.newCount} new episodes`,
        duration: 3000,
      });

      // Reset and close
      setQuery("");
      setSearchResults([]);
      onOpenChange(false);
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Subscription failed",
        description: error.message || "Could not subscribe to this podcast",
      });
    }
  };

  const handleClose = () => {
    setQuery("");
    setSearchResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-60 data-[state=open]:animate-fadeIn" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-app-bg border border-border-subtle rounded-xl shadow-2xl w-[90vw] max-w-[1200px] max-h-[85vh] overflow-hidden data-[state=open]:animate-contentShow focus:outline-none">
          {/* Header */}
          <div className="p-6 border-b border-border-subtle">
            <Dialog.Title className="text-xl font-medium text-primary mb-2">
              Search Podcast
            </Dialog.Title>
            <Dialog.Description className="text-sm text-secondary">
              Enter a podcast name or paste RSS feed URL to subscribe
            </Dialog.Description>
          </div>

          {/* Search Form */}
          <div className="p-6 border-b border-border-subtle">
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search podcasts or paste RSS URL..."
                className="flex-1 px-4 py-3 bg-panel-bg border border-border-subtle rounded-lg text-primary text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                autoFocus
              />
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-6 py-3 bg-accent-primary hover:bg-accent-primary/90 disabled:bg-zinc-700 disabled:text-muted text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Search Results */}
          <div className="p-8 overflow-y-auto max-h-[calc(85vh-220px)]">
            {searchResults.length > 0 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-primary text-xl font-medium mb-1">
                    Search results for "{query}"
                  </h2>
                  <p className="text-secondary text-sm">
                    Found {searchResults.length} podcasts
                  </p>
                </div>

                <div className="grid grid-cols-5 gap-5">
                  {searchResults.map((podcast) => {
                    const subscribed = isSubscribed(podcast.feedUrl);

                    return (
                      <div key={podcast.id} className="group cursor-pointer">
                        {/* Cover Image */}
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3">
                          <img
                            src={podcast.artworkUrl}
                            alt={podcast.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%236366f1" width="200" height="200"/%3E%3C/svg%3E';
                            }}
                          />

                          {/* Subscribed Badge */}
                          {subscribed && (
                            <div className="absolute top-2 left-2 bg-status-success text-white text-xs font-medium px-2 py-1 rounded-full">
                              Subscribed
                            </div>
                          )}

                          {/* Subscribe Button on Hover */}
                          {!subscribed && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => handleSubscribe(podcast.feedUrl)}
                                disabled={subscribeMutation.isPending}
                                className="bg-accent-primary hover:bg-accent-primary/90 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                              >
                                Subscribe
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Title & Author */}
                        <h3 className="text-primary text-sm font-medium mb-1 line-clamp-2">
                          {podcast.title}
                        </h3>
                        <p className="text-secondary text-xs line-clamp-1">
                          {podcast.author}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-secondary text-sm">
                  Enter a podcast name to search
                </p>
              </div>
            )}
          </div>

          {/* Close button */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-muted hover:text-secondary transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
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
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
