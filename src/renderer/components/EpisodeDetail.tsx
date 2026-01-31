import { useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  useDocuments,
  useRunAiSummary,
  useGetApiKey,
} from "../hooks/useQueries";
import { useToastStore } from "../stores/useToastStore";
import { useGeneratingStore } from "../stores/useGeneratingStore";
import type { Episode } from "../../shared/types";
import { OverwriteAlertDialog } from "./OverwriteAlertDialog";

interface EpisodeDetailProps {
  episode: Episode | null;
  onMissingApiKey?: () => void;
}

export function EpisodeDetail({
  episode,
  onMissingApiKey,
}: EpisodeDetailProps) {
  const { data: documents, isLoading: documentsLoading } = useDocuments(
    episode?.id || null,
  );
  const { data: apiKey } = useGetApiKey();
  const runSummary = useRunAiSummary();
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);
  const isGenerating = useGeneratingStore((state) => state.isGenerating);

  // Reset selected document when episode changes
  useEffect(() => {
    setSelectedDocIndex(0);
  }, [episode?.id]);

  if (!episode) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🎧</div>
          <div className="text-sm">Select an episode to view details</div>
        </div>
      </div>
    );
  }

  const currentDocument =
    documents && documents.length > 0 ? documents[selectedDocIndex] : null;

  const renderMarkdown = (markdown: string) => {
    const html = marked(markdown, {
      breaks: true,
      gfm: true,
    });
    return DOMPurify.sanitize(html as string);
  };

  const handleGenerateSummary = async () => {
    if (!apiKey) {
      onMissingApiKey?.();
      return;
    }

    if (documents && documents.length > 0) {
      setShowOverwriteDialog(true);
      return;
    }

    const loadingToastId = addToast({
      type: "loading",
      title: "Generating AI summary...",
      duration: 60000,
    });

    try {
      await runSummary.mutateAsync(episode.id);
      removeToast(loadingToastId);
      addToast({
        type: "success",
        title: "Summary generated",
        duration: 3000,
      });
    } catch (error: any) {
      removeToast(loadingToastId);
      if (error.message === "API_KEY_MISSING") {
        onMissingApiKey?.();
      } else {
        addToast({
          type: "error",
          title: "Generation failed",
          description: error.message,
          duration: 5000,
        });
      }
    }
  };

  const handleOverwriteConfirm = async () => {
    if (!episode?.id) return;
    setShowOverwriteDialog(false);

    const loadingToastId = addToast({
      type: "loading",
      title: "Generating AI summary...",
      duration: 60000,
    });

    try {
      await runSummary.mutateAsync(episode.id);
      removeToast(loadingToastId);
      addToast({
        type: "success",
        title: "Summary generated",
        duration: 3000,
      });
    } catch (error: any) {
      removeToast(loadingToastId);
      if (error.message === "API_KEY_MISSING") {
        onMissingApiKey?.();
      } else {
        addToast({
          type: "error",
          title: "Generation failed",
          description: error.message,
          duration: 5000,
        });
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Episode Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-2">{episode.title}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>
            {new Date(episode.pub_date).toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {episode.duration > 0 && (
            <>
              <span>•</span>
              <span>{Math.floor(episode.duration / 60)} min</span>
            </>
          )}
          {episode.is_downloaded && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-green-500">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Downloaded
              </span>
            </>
          )}
        </div>

        {/* Document Tabs (if multiple summaries) */}
        {documents && documents.length > 1 && (
          <div className="mt-4 flex gap-2">
            {documents.map((doc, index) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocIndex(index)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedDocIndex === index
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Summary {index + 1}
                <span className="ml-2 text-xs opacity-70">
                  {new Date(doc.created_at).toLocaleDateString("zh-TW", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {documentsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading summary...</div>
          </div>
        ) : currentDocument ? (
          <div
            className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-ul:text-gray-300 prose-ol:text-gray-300"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(currentDocument.content),
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-white mb-2">
                No AI summary yet
              </h3>
              <p className="text-gray-400 mb-6 text-sm">
                Click the button below to generate AI summary for this episode
              </p>
              <button
                onClick={handleGenerateSummary}
                disabled={runSummary.isPending}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                {runSummary.isPending ? (
                  <>
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Generate AI Summary
                  </>
                )}
              </button>
              {runSummary.isPending && (
                <p className="text-xs text-gray-500 mt-4">
                  This may take a few minutes, please wait...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {currentDocument && (
        <div className="p-4 border-t border-gray-800 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Generated: {new Date(currentDocument.created_at).toLocaleString()}
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(currentDocument.content);
              }}
            >
              Copy
            </button>
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating || runSummary.isPending}
              className={`px-4 py-2 text-white text-sm rounded-lg transition-colors ${
                isGenerating || runSummary.isPending
                  ? "bg-blue-600/50 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isGenerating || runSummary.isPending
                ? "Generating..."
                : "Regenerate"}
            </button>
          </div>
        </div>
      )}

      <OverwriteAlertDialog
        open={showOverwriteDialog}
        onOpenChange={setShowOverwriteDialog}
        onConfirm={handleOverwriteConfirm}
      />
    </div>
  );
}
