import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "./stores/useAppStore";
import { useToastStore } from "./stores/useToastStore";
import { Sidebar } from "./components/Sidebar";
import { TabNavigation } from "./components/TabNavigation";
import { GlobalToast } from "./components/GlobalToast";
import { SubscribeDialog } from "./components/SubscribeDialog";
import { SearchResults } from "./components/SearchResults";
import { CustomPromptDialog } from "./components/CustomPromptDialog";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { SummaryModal } from "./components/SummaryModal";
import { OverwriteAlertDialog } from "./components/OverwriteAlertDialog";
import { EpisodesTabContent } from "./components/EpisodesTabContent";
import { LocalUploadTabContent } from "./components/LocalUploadTabContent";
import { KnowledgeContent } from "./components/KnowledgeContent";
import {
  usePodcasts,
  useDownloadEpisode,
  useGetApiKey,
  useRunAiSummary,
} from "./hooks/useQueries";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppContent() {
  // Dialog state
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [customPromptDialogOpen, setCustomPromptDialogOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [pendingSummaryEpisodeId, setPendingSummaryEpisodeId] = useState<
    string | null
  >(null);
  const [selectedEpisodeIdForSummary, setSelectedEpisodeIdForSummary] =
    useState<string | null>(null);

  // Global store
  const {
    activePodcastId,
    activeEpisodeId,
    activeTab,
    searchQuery,
    isSearchMode,
    setActiveEpisode,
    setActiveTab,
  } = useAppStore();
  const addToast = useToastStore((s) => s.addToast);
  const removeToast = useToastStore((s) => s.removeToast);

  // Data
  const { data: podcasts = [] } = usePodcasts();
  const { data: apiKey } = useGetApiKey();
  const downloadMutation = useDownloadEpisode();
  const runSummary = useRunAiSummary();

  const activePodcast =
    podcasts.find((p: any) => p.id === activePodcastId) || null;

  // --- Handlers ---

  const handleEpisodeClick = (episode: any) => {
    setActiveEpisode(episode.id);
  };

  const handleDownload = (episodeId: string, episodeTitle: string) => {
    const podcastTitle = activePodcast?.title || "Unknown";
    const loadingToastId = addToast({
      type: "loading",
      title: "Downloading...",
      description: episodeTitle,
      duration: 60000,
    });
    downloadMutation.mutate(
      { episodeId, destDir: podcastTitle },
      {
        onSuccess: () => {
          removeToast(loadingToastId);
          addToast({
            type: "success",
            title: "Download complete",
            description: episodeTitle,
            duration: 3000,
          });
        },
        onError: (error: any) => {
          removeToast(loadingToastId);
          addToast({
            type: "error",
            title: "Download failed",
            description: error.message || episodeTitle,
            duration: 5000,
          });
        },
      },
    );
  };

  const handleReadSummary = (episodeId: string) => {
    setSelectedEpisodeIdForSummary(episodeId);
    setSummaryModalOpen(true);
  };

  const executeSummary = async (episodeId: string) => {
    const loadingToastId = addToast({
      type: "loading",
      title: "Generating AI summary...",
      duration: 60000,
    });

    try {
      await runSummary.mutateAsync(episodeId);
      removeToast(loadingToastId);
      addToast({ type: "success", title: "Summary generated", duration: 3000 });
    } catch (error: any) {
      removeToast(loadingToastId);
      if (error.message === "API_KEY_MISSING") {
        addToast({
          type: "warning",
          title: "API Key required",
          description: "Please set your Gemini API Key",
          duration: 5000,
        });
        setApiKeyModalOpen(true);
      } else {
        addToast({
          type: "error",
          title: "Summary generation failed",
          description: error.message,
          duration: 5000,
        });
      }
    }
  };

  const onAiSummaryClick = async (episodeId: string) => {
    if (!apiKey) {
      addToast({
        type: "warning",
        title: "API Key required",
        description:
          "Please set your Gemini API Key first to generate summaries",
        duration: 5000,
      });
      setApiKeyModalOpen(true);
      return;
    }

    const result = await window.api.getDocuments(episodeId);
    if (result.success && result.data && result.data.length > 0) {
      setPendingSummaryEpisodeId(episodeId);
      setOverwriteDialogOpen(true);
      return;
    }

    await executeSummary(episodeId);
  };

  const handleOverwriteConfirm = async () => {
    if (pendingSummaryEpisodeId) {
      await executeSummary(pendingSummaryEpisodeId);
      setPendingSummaryEpisodeId(null);
    }
    setOverwriteDialogOpen(false);
  };

  const handleKnowledgeDocClick = (doc: any) => {
    setSelectedEpisodeIdForSummary(doc.episode_id);
    setSummaryModalOpen(true);
  };

  // --- Render ---

  const renderTabContent = () => {
    if (isSearchMode) {
      return <SearchResults query={searchQuery} />;
    }

    switch (activeTab) {
      case "episodes":
        return (
          <EpisodesTabContent
            activePodcastId={activePodcastId}
            activePodcast={activePodcast}
            activeEpisodeId={activeEpisodeId}
            onEpisodeClick={handleEpisodeClick}
            onCustomPromptClick={() => {
              if (activePodcastId) {
                setCustomPromptDialogOpen(true);
              } else {
                addToast({
                  type: "info",
                  title: "Please first choose a podcast",
                });
              }
            }}
            onAiSummary={onAiSummaryClick}
            onReadSummary={handleReadSummary}
            onDownload={handleDownload}
          />
        );
      case "local-upload":
        return (
          <div className="flex-1 p-8 overflow-y-auto">
            <LocalUploadTabContent
              activeEpisodeId={activeEpisodeId}
              onEpisodeClick={handleEpisodeClick}
              onAiSummary={onAiSummaryClick}
              onReadSummary={handleReadSummary}
            />
          </div>
        );
      case "knowledge":
        return (
          <div className="flex-1 p-8 overflow-y-auto">
            <KnowledgeContent onDocumentClick={handleKnowledgeDocClick} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-app-bg text-white">
      <Sidebar
        onSubscribeClick={() => setSubscribeDialogOpen(true)}
        onApiKeyClick={() => setApiKeyModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-panel-bg-50">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col min-h-0">{renderTabContent()}</div>
      </div>

      {/* Dialogs & Modals */}
      <GlobalToast />
      <SubscribeDialog
        open={subscribeDialogOpen}
        onOpenChange={setSubscribeDialogOpen}
      />
      {activePodcastId && (
        <CustomPromptDialog
          open={customPromptDialogOpen}
          onOpenChange={setCustomPromptDialogOpen}
          podcastId={activePodcastId}
        />
      )}
      <ApiKeyModal open={apiKeyModalOpen} onOpenChange={setApiKeyModalOpen} />
      <SummaryModal
        open={summaryModalOpen}
        onOpenChange={setSummaryModalOpen}
        episodeId={selectedEpisodeIdForSummary}
      />
      <OverwriteAlertDialog
        open={overwriteDialogOpen}
        onOpenChange={setOverwriteDialogOpen}
        onConfirm={handleOverwriteConfirm}
      />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
