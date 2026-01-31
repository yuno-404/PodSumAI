import * as Dialog from "@radix-ui/react-dialog";

interface OverwriteAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function OverwriteAlertDialog({
  open,
  onOpenChange,
  onConfirm,
}: OverwriteAlertDialogProps) {
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
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  <path d="M5 3v4" />
                  <path d="M19 17v4" />
                  <path d="M3 5h4" />
                  <path d="M17 19h4" />
                </svg>
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-[18px] font-medium text-[#f4f4f5] mb-1">
                  Regenerate Summary?
                </Dialog.Title>
                <Dialog.Description className="text-[14px] text-[#a1a1aa] leading-relaxed">
                  Existing summary will be overwritten. This operation will
                  consume Gemini API quota.
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
                onClick={onConfirm}
                className="h-10 px-5 rounded-md bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors text-[14px] font-medium"
              >
                Regenerate
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
