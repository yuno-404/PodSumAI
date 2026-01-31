import * as Dialog from "@radix-ui/react-dialog";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onSave,
  onDiscard,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-[#18181b] rounded-xl border border-[#f43f5e33] shadow-xl z-50 focus:outline-none"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#f43f5e1a] shrink-0">
                <svg
                  className="w-5 h-5 text-[#f43f5e]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-[18px] font-medium text-white mb-1">
                  Unsaved Changes?
                </Dialog.Title>
                <Dialog.Description className="text-[14px] text-[#a1a1aa] leading-relaxed">
                  You have made changes. Save before closing?
                </Dialog.Description>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onDiscard}
                className="h-10 px-5 rounded-md text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors text-[14px] font-medium"
              >
                Don&apos;t Save
              </button>
              <button
                onClick={onSave}
                className="h-10 px-5 rounded-md bg-[#6366f1] text-white hover:bg-[#5558e3] transition-colors text-[14px] font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
