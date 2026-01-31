import { useState } from "react";
import {
  usePodcasts,
  useAllDocumentsGrouped,
  useDeleteSummary,
} from "../hooks/useQueries";
import { useToastStore } from "../stores/useToastStore";
import { DeleteDocumentAlertDialog } from "./DeleteDocumentAlertDialog";

interface KnowledgeContentProps {
  onDocumentClick?: (doc: any) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DocumentItem({
  doc,
  onClick,
  onDelete,
}: {
  doc: any;
  onClick?: () => void;
  onDelete?: (doc: any) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 h-11 px-4 pl-12 cursor-pointer transition-colors hover:bg-white-5"
      onClick={onClick}
    >
      {/* file-text icon */}
      <svg
        className="w-4 h-4 text-[#52525b] flex-shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
      <span className="text-[#a1a1aa] text-[13px] flex-1 truncate">
        {doc.episode_title}
      </span>
      <span className="text-[#52525b] text-[12px] flex-shrink-0">
        {formatDate(doc.created_at)}
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(doc);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors text-[#a1a1aa] hover:text-red-400 hover:bg-white-10"
          title="Remove summary"
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

function PodcastGroup({
  podcast,
  documents,
  onDocumentClick,
  onDocumentDelete,
}: {
  podcast: any;
  documents: any[];
  onDocumentClick?: (doc: any) => void;
  onDocumentDelete?: (doc: any) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const docCount = documents.length;

  return (
    <div className="rounded-lg bg-[#18181b] border border-[#ffffff1a] overflow-hidden">
      {/* Group Header */}
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
          {podcast.title}
        </span>

        {/* Badge */}
        <div className="ml-auto flex items-center h-[22px] px-2 rounded-full bg-[#ffffff1a] flex-shrink-0">
          <span className="text-[#a1a1aa] text-[11px]">{docCount} docs</span>
        </div>
      </button>

      {/* Documents list */}
      {isExpanded && documents.length > 0 && (
        <div className="flex flex-col gap-1 pb-3">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              doc={doc}
              onClick={() => onDocumentClick?.(doc)}
              onDelete={onDocumentDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function KnowledgeContent({ onDocumentClick }: KnowledgeContentProps) {
  const { data: podcasts, isLoading: podcastsLoading } = usePodcasts();
  const {
    grouped: documentsByPodcast,
    total: totalDocs,
    isLoading: documentsLoading,
  } = useAllDocumentsGrouped(podcasts);
  const deleteMutation = useDeleteSummary();
  const addToast = useToastStore((state) => state.addToast);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);

  const handleDocumentDelete = (doc: any) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      await deleteMutation.mutateAsync(documentToDelete.id);
      addToast({
        type: "success",
        title: "Summary removed",
        duration: 3000,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Remove failed",
        duration: 3000,
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  if (podcastsLoading || documentsLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[#52525b]">
        <div className="text-center">
          <div className="flex items-center gap-2 text-[#a1a1aa]">
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
      </div>
    );
  }

  if (!podcasts || podcasts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#52525b]">
        <div className="text-center">
          <div className="text-4xl mb-2">📭</div>
          <div className="text-sm">No subscribed podcasts</div>
          <div className="text-xs text-[#3f3f46] mt-1">
            Subscribe to podcasts to generate summaries
          </div>
        </div>
      </div>
    );
  }

  const podcastsWithDocs = podcasts.filter((p: any) =>
    documentsByPodcast.has(p.id),
  );

  if (podcastsWithDocs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#52525b]">
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <div className="text-sm">No AI summaries yet</div>
          <div className="text-xs text-[#3f3f46] mt-1">
            Summaries will appear here after generation
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header matching pencil-new: title left, count right */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-medium text-[#f4f4f5]">
          Documents
        </h2>
        <span className="text-[#a1a1aa] text-[13px]">
          {totalDocs} documents from {podcastsWithDocs.length} podcasts
        </span>
      </div>

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2">
          {podcastsWithDocs.map((podcast: any) => (
            <PodcastGroup
              key={podcast.id}
              podcast={podcast}
              documents={documentsByPodcast.get(podcast.id) || []}
              onDocumentClick={onDocumentClick}
              onDocumentDelete={handleDocumentDelete}
            />
          ))}
        </div>
      </div>

      {/* Delete Document Alert Dialog */}
      <DeleteDocumentAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        documentTitle={documentToDelete?.episode_title}
      />
    </div>
  );
}
