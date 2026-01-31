import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useDocuments, useRunAiSummary } from "../hooks/useQueries";
import { useToastStore } from "../stores/useToastStore";
import { useGeneratingStore } from "../stores/useGeneratingStore";
import { OverwriteAlertDialog } from "./OverwriteAlertDialog";
import { useQueryClient } from "@tanstack/react-query";

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeId: string | null;
}

export function SummaryModal({
  open,
  onOpenChange,
  episodeId,
}: SummaryModalProps) {
  const queryClient = useQueryClient();
  const {
    data: documents,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = useDocuments(episodeId);
  const runSummary = useRunAiSummary();
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);
  const isGenerating = useGeneratingStore((state) => state.isGenerating);

  useEffect(() => {
    if (open) {
      setSelectedDocIndex(0);
    }
  }, [open, episodeId]);

  const currentDocument =
    documents && documents.length > 0 ? documents[selectedDocIndex] : null;

  const renderMarkdown = (markdown: string) => {
    const html = marked(markdown, {
      breaks: true,
      gfm: true,
    });
    return DOMPurify.sanitize(html as string);
  };

  const handleCopyMarkdown = () => {
    if (currentDocument) {
      navigator.clipboard.writeText(currentDocument.content);
      addToast({
        type: "success",
        title: "Copied to clipboard",
      });
    }
  };

  const handleGenerateSummary = async () => {
    if (!episodeId) return;

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
      await runSummary.mutateAsync(episodeId);
      removeToast(loadingToastId);
      addToast({
        type: "success",
        title: "Summary generated",
        duration: 3000,
      });
      await queryClient.invalidateQueries({ queryKey: ["documents", episodeId] });
      await refetchDocuments();
    } catch (error: any) {
      removeToast(loadingToastId);
      addToast({
        type: "error",
        title: "Generation failed",
        description: error.message,
        duration: 5000,
      });
    }
  };

  const handleOverwriteConfirm = async () => {
    if (!episodeId) return;
    setShowOverwriteDialog(false);

    const loadingToastId = addToast({
      type: "loading",
      title: "Generating AI summary...",
      duration: 60000,
    });

    try {
      await runSummary.mutateAsync(episodeId);
      removeToast(loadingToastId);
      addToast({
        type: "success",
        title: "Summary generated",
        duration: 3000,
      });
      await queryClient.invalidateQueries({ queryKey: ["documents", episodeId] });
      await refetchDocuments();
    } catch (error: any) {
      removeToast(loadingToastId);
      addToast({
        type: "error",
        title: "Generation failed",
        description: error.message,
        duration: 5000,
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] max-w-[90vw] bg-[#18181b] rounded-xl border border-[#27272a] shadow-xl z-50 focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-[#27272a]">
            <div className="flex items-center gap-4 min-w-0">
              <Dialog.Title className="text-[16px] font-medium text-[#f4f4f5] truncate">
                {"Document"}
              </Dialog.Title>
              {/* Tabs for multiple documents */}
              {documents && documents.length > 1 && (
                <div className="flex gap-1">
                  {documents.map((doc, index) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocIndex(index)}
                      className={`px-3 py-1 rounded-md text-xs transition-colors ${
                        selectedDocIndex === index
                          ? "bg-[#6366f1] text-white"
                          : "text-[#a1a1aa] hover:bg-[#27272a]"
                      }`}
                    >
                      Summary {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCopyMarkdown}
                disabled={!currentDocument}
                className="h-9 px-4 rounded-lg flex items-center gap-2 border border-[#27272a] hover:bg-[#27272a] transition-colors disabled:opacity-50"
              >
                <svg
                  className="w-3.5 h-3.5 text-[#a1a1aa]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <span className="text-xs text-[#a1a1aa] font-medium">
                  Copy Markdown
                </span>
              </button>

              <Dialog.Close asChild>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#27272a] transition-colors">
                  <svg
                    className="w-4.5 h-4.5 text-[#a1a1aa]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-8 max-h-[560px]">
            {documentsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex items-center gap-3 text-[#a1a1aa]">
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
                  <span className="text-sm">Loading...</span>
                </div>
              </div>
            ) : currentDocument ? (
              <div
                className="prose prose-invert max-w-none text-[#e4e4e7] prose-headings:text-[#f4f4f5] prose-p:text-[#e4e4e7] prose-strong:text-[#f4f4f5] prose-ul:text-[#e4e4e7] prose-ol:text-[#e4e4e7] prose-li:text-[#e4e4e7] prose-a:text-[#818cf8] prose-code:text-[#c4b5fd] prose-blockquote:text-[#a1a1aa] prose-blockquote:border-[#3f3f46] prose-hr:border-[#3f3f46] prose-td:text-[#e4e4e7] prose-th:text-[#f4f4f5]"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(currentDocument.content),
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-48">
                <svg
                  className="w-12 h-12 text-[#52525b] mb-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
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
                <h3 className="text-lg font-medium text-[#f4f4f5] mb-2">
                  No documents yet
                </h3>
                <p className="text-sm text-[#a1a1aa] mb-6">
                  Click the button below to generate AI summary
                </p>
                <button
                  onClick={handleGenerateSummary}
                  disabled={runSummary.isPending}
                  className="h-10 px-6 rounded-lg bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-[#27272a] disabled:text-[#52525b] text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {runSummary.isPending ? (
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      </svg>
                      Generate AI Summary
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {currentDocument && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#27272a]">
              <span className="text-xs text-white">
                Generated:{" "}
                {currentDocument.created_at
                  ? new Date(currentDocument.created_at).toLocaleString("zh-TW")
                  : "-"}
              </span>
              <button
                onClick={handleGenerateSummary}
                disabled={isGenerating || runSummary.isPending}
                className={`h-9 px-4 rounded-lg text-white text-sm font-medium transition-colors ${
                  isGenerating || runSummary.isPending
                    ? "bg-[#6366f1]/50 cursor-not-allowed"
                    : "bg-[#6366f1] hover:bg-[#5558e3]"
                }`}
              >
                {isGenerating || runSummary.isPending
                  ? "Generating..."
                  : "Regenerate"}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>

      <OverwriteAlertDialog
        open={showOverwriteDialog}
        onOpenChange={setShowOverwriteDialog}
        onConfirm={handleOverwriteConfirm}
      />
    </Dialog.Root>
  );
}
