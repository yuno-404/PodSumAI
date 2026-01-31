import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSaveApiKey, useRemoveApiKey } from "../hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyModal({ open, onOpenChange }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "valid" | "invalid" | "checking"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const queryClient = useQueryClient();
  const saveApiKeyMutation = useSaveApiKey();
  const removeApiKeyMutation = useRemoveApiKey();
  useEffect(() => {
    if (open) {
      loadApiKey();
    }
  }, [open]);

  const loadApiKey = async () => {
    try {
      const result = await window.api.getApiKey();
      if (result.success && result.data) {
        setApiKey(result.data);
        setStatus("valid");
        setStatusMessage("Valid - Connected to Gemini 2.5 Flash");
      } else {
        setApiKey("");
        setStatus("idle");
        setStatusMessage("");
      }
    } catch (error) {
      setApiKey("");
      setStatus("idle");
      setStatusMessage("");
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setStatus("invalid");
      setStatusMessage("Please enter a valid API key");
      return;
    }

    setStatus("checking");
    setStatusMessage("Validating...");
    
    saveApiKeyMutation.mutate(apiKey.trim(), {
      onSuccess: () => {
        setStatus("valid");
        setStatusMessage("Valid - Connected to Gemini 2.5 Flash");
        queryClient.invalidateQueries({ queryKey: ["api-key"] });
        onOpenChange(false);
      },
      onError: (error: Error) => {
        setStatus("invalid");
        setStatusMessage(error.message || "Invalid API key");
      },
    });
  };

  const handleRemove = () => {
    removeApiKeyMutation.mutate(undefined, {
      onSuccess: () => {
        setApiKey("");
        setStatus("idle");
        setStatusMessage("");
        queryClient.invalidateQueries({ queryKey: ["api-key"] });
        onOpenChange(false);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] bg-[#18181b] rounded-xl border border-[#27272a] shadow-xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between h-14 px-6 border-b border-[#27272a]">
            <Dialog.Title className="text-[#f4f4f5] font-medium text-base">
              API Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#27272a] transition-colors"
                onClick={() => onOpenChange(false)}
              >
                <svg
                  className="w-4 h-4 text-[#a1a1aa]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Label */}
            <div className="text-[#a1a1aa] text-sm font-medium">
              Google Gemini API Key
            </div>

            {/* Input Row */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (status !== "idle") {
                      setStatus("idle");
                      setStatusMessage("");
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your API key..."
                  className="w-full h-11 px-4 pr-12 rounded-md bg-[#00000080] border border-[#27272a] text-[#e4e4e7] text-sm outline-none focus:border-accent-primary transition-colors placeholder-[#52525b]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#27272a] transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-[#a1a1aa]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    {showKey ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Status */}
            {status !== "idle" && (
              <div className="flex items-center gap-2">
                {status === "valid" && (
                  <svg
                    className="w-4 h-4 text-status-success"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
                {status === "invalid" && (
                  <svg
                    className="w-4 h-4 text-status-error"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
                {status === "checking" && (
                  <svg
                    className="w-4 h-4 text-[#a1a1aa] animate-spin"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                <span
                  className={`text-sm ${
                    status === "valid"
                      ? "text-status-success"
                      : status === "invalid"
                        ? "text-status-error"
                        : "text-[#a1a1aa]"
                  }`}
                >
                  {statusMessage}
                </span>
              </div>
            )}

            {/* Link */}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-accent-primary hover:text-accent-primary/80 text-sm transition-colors"
            >
              Get API Key from Google AI Studio →
            </a>
          </div>

          {/* Footer */}
          <div className="flex justify-between px-6 py-4 border-t border-[#27272a]">
            <div>
              {status === "valid" && (
                <button
                  onClick={handleRemove}
                  className="px-4 py-2 rounded-lg text-status-error hover:bg-[#f43f5e1a] transition-colors text-sm"
                >
                  Remove API Key
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <Dialog.Close asChild>
                <button
                  className="px-4 py-2 rounded-lg text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#27272a] transition-colors text-sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleSave}
                disabled={status === "checking" || !apiKey.trim()}
                className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-primary/90 disabled:bg-[#27272a] disabled:text-[#52525b] text-white text-sm transition-colors"
              >
                {status === "checking" ? "Validating..." : "Save"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
