import React from "react";
import {
  useSearchPodcasts,
  useSubscribePodcast,
  usePodcasts,
} from "../hooks/useQueries";
import { useToastStore } from "../stores/useToastStore";

interface PodcastSearchResult {
  id: string;
  title: string;
  author: string;
  feedUrl: string;
  artworkUrl: string;
  description: string;
}

interface SearchResultsProps {
  query: string;
}

export function SearchResults({ query }: SearchResultsProps) {
  const searchMutation = useSearchPodcasts();
  const subscribeMutation = useSubscribePodcast();
  const { data: podcasts = [] } = usePodcasts();
  const addToast = useToastStore((state) => state.addToast);

  const [results, setResults] = React.useState<PodcastSearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [subscribingUrl, setSubscribingUrl] = React.useState<string | null>(
    null,
  );

  // Check if a podcast is already subscribed
  const isSubscribed = (feedUrl: string) => {
    return podcasts.some((p: any) => p.feed_url === feedUrl);
  };

  // Watch for podcast to appear in list after subscription starts
  React.useEffect(() => {
    if (subscribingUrl && isSubscribed(subscribingUrl)) {
      addToast({
        type: "success",
        title: "Subscription successful",
        description: "Added to your subscriptions",
      });
      setSubscribingUrl(null);
    }
  }, [podcasts, subscribingUrl]);

  // Perform search when query changes
  React.useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const searchResults = await searchMutation.mutateAsync(query.trim());
        setResults(searchResults);
      } catch (error: any) {
        addToast({
          type: "error",
          title: "Search failed",
          description: error.message,
        });
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSubscribe = async (
    feedUrl: string,
    title: string,
    artworkUrl?: string,
  ) => {
    if (isSubscribed(feedUrl)) {
      addToast({
        type: "warning",
        title: "Already subscribed",
        description: "This podcast is already in your subscriptions",
      });
      return;
    }

    setSubscribingUrl(feedUrl);

    addToast({
      type: "loading",
      title: "Subscribing...",
      description: `Subscribing to ${title}`,
      duration: 5000,
    });

    try {
      await subscribeMutation.mutateAsync({ url: feedUrl, artworkUrl });
      // Success toast will be shown by useEffect when podcast appears in list
    } catch (error: any) {
      setSubscribingUrl(null);
      addToast({
        type: "error",
        title: "Subscription failed",
        description: error.message || "Could not subscribe",
      });
    }
  };

  if (!query || query.trim().length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
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
            Enter a podcast name in the sidebar search
          </p>
          <p className="text-muted text-xs mt-1">At least 2 characters required</p>
        </div>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-secondary">
          <svg
            className="animate-spin h-6 w-6"
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
            <span>Searching...</span>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-secondary text-sm mb-1">
            No results for "{query}"
          </p>
          <p className="text-muted text-xs">Please try different keywords</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-primary text-xl font-medium mb-1">
            Search results for "{query}"
          </h2>
          <p className="text-secondary text-sm">
            Found {results.length} podcasts
          </p>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-5 gap-5">
          {results.map((podcast) => {
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
                        onClick={() =>
                          handleSubscribe(
                            podcast.feedUrl,
                            podcast.title,
                            podcast.artworkUrl,
                          )
                        }
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
      </div>
    </div>
  );
}
