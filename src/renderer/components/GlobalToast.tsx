import { useEffect } from "react";
import * as Toast from "@radix-ui/react-toast";
import { useToastStore } from "../stores/useToastStore";

export function GlobalToast() {
  const { toasts, removeToast } = useToastStore();

  // Listen to IPC events
  useEffect(() => {
    // Check if window.api exists (Electron context)
    if (typeof window === "undefined" || !window.api) {
      console.warn("window.api not available - running in browser mode");
      return;
    }

    // Summary completed event
    const unsubscribeSummaryCompleted = window.api.onSummaryCompleted(() => {
      useToastStore.getState().addToast({
        type: "success",
        title: "AI Summary complete",
        description: "Summary generated successfully",
      });
    });

    // Summary failed event
    const unsubscribeSummaryFailed = window.api.onSummaryFailed((data) => {
      useToastStore.getState().addToast({
        type: "error",
        title: "AI Summary failed",
        description: data.error || "Error generating summary",
      });
    });

    // Feed synced event is handled by SubscribeDialog.tsx

    return () => {
      unsubscribeSummaryCompleted();
      unsubscribeSummaryFailed();
    };
  }, []);

  return (
    <Toast.Provider swipeDirection="right" duration={3000}>
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          className="bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-4 flex items-start gap-3 w-[360px] data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-swipeOut"
          duration={toast.duration ?? 3000}
          onOpenChange={(open) => {
            if (!open) removeToast(toast.id);
          }}
        >
          {/* Icon based on type */}
          <div className="flex-shrink-0">
            {toast.type === "success" && (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
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
              </div>
            )}
            {toast.type === "error" && (
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
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
              </div>
            )}
            {toast.type === "info" && (
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            )}
            {toast.type === "loading" && (
              <div className="w-5 h-5">
                <svg
                  className="animate-spin text-blue-500"
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
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Toast.Title
              className="text-sm font-medium mb-0.5"
              style={{ color: "#ffffff" }}
            >
              {toast.title}
            </Toast.Title>
            {toast.description && (
              <Toast.Description
                className="text-xs truncate"
                style={{ color: "#9ca3af" }}
              >
                {toast.description}
              </Toast.Description>
            )}
          </div>

          {/* Close button */}
          <Toast.Close className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Toast.Close>
        </Toast.Root>
      ))}

      <Toast.Viewport className="fixed top-0 right-0 flex flex-col gap-2 w-[390px] max-w-[100vw] m-0 p-6 list-none z-[2147483647] outline-none" />
    </Toast.Provider>
  );
}
