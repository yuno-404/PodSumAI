import * as Dialog from "@radix-ui/react-dialog";

interface ResetPromptAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ResetPromptAlertDialog({
  open,
  onOpenChange,
  onConfirm,
}: ResetPromptAlertDialogProps) {
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
                  <path d="M12 3l1.912 5.813a2 2 0 01-1.275 1.275L12 21l-1.912-5.813a2 2 0 011.275-1.275L3 12l5.813-1.912a2 2 0 011.275-1.275L12 3Z" />
                  <path d="M5 3v4M19 17v4M3 5h4M17 19h4" />
                </svg>
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-[18px] font-medium text-white mb-1">
                  Reset Prompt?
                </Dialog.Title>
                <Dialog.Description className="text-[14px] text-[#a1a1aa] leading-relaxed">
                  Your custom prompt will be lost and restored to the default
                  configuration.
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
                className="h-10 px-5 rounded-md bg-[#f43f5e] text-white hover:bg-[#e11d48] transition-colors text-[14px] font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
