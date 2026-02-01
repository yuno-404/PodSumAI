import * as Dialog from "@radix-ui/react-dialog";

interface DeletePodcastAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSoftDelete: () => void;
  onPermanentDelete: () => void;
  podcastTitle?: string;
}

export function DeletePodcastAlertDialog({
  open,
  onOpenChange,
  onSoftDelete,
  onPermanentDelete,
  podcastTitle,
}: DeletePodcastAlertDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-[#18181b] rounded-xl border border-[#f43f5e33] shadow-xl z-50 focus:outline-none">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#f43f5e1a]">
                <svg
                  className="w-6 h-6 text-[#f43f5e]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 9v4m0 4h.01M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-[18px] font-medium text-[#f4f4f5] mb-1">
                  Remove Podcast?
                </Dialog.Title>
                <Dialog.Description className="text-[14px] text-[#a1a1aa] leading-relaxed">
                  {podcastTitle && (
                    <span className="block mb-2 font-medium text-[#f4f4f5]">
                      {podcastTitle}
                    </span>
                  )}
                  Unsubscribing keeps your episodes, downloads, and AI summaries for later. 
                  Permanently deleting removes all data and cannot be recovered
                </Dialog.Description>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <button className="h-10 px-5 rounded-md border border-[#ffffff1a] text-[#a1a1aa] hover:bg-[#ffffff0d] transition-colors text-[14px] font-medium">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={onSoftDelete}
                className="h-10 px-5 rounded-md border border-[#ffffff1a] text-[#f4f4f5] hover:bg-[#ffffff0d] transition-colors text-[14px] font-medium"
              >
                Unsubscribe
              </button>
              <button
                onClick={onPermanentDelete}
                className="h-10 px-5 rounded-md bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors text-[14px] font-medium"
              >
                Permanently Delete
              </button>
            </div>
          </div>
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-4.5 h-4.5 text-[#a1a1aa]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
