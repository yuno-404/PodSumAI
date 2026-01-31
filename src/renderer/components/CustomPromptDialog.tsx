import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "../stores/useToastStore";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

interface CustomPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  podcastId: string;
}

const DEFAULT_PROMPT = `你是一個專業的 Podcast 摘要助手。請完整分析音頻內容，並依據以下結構生成摘要：

## 節目資訊
- 節目名稱
- 主持人與嘉賓（如有）
- 本集主題或標題

## 重點議題
詳細列出本期討論的主要主題與子主題。對於每個主題，說明：
- 該主題的背景與脈絡
- 主持人或嘉賓的核心觀點
- 不同觀點之間的比較與碰撞
- 討論的深入程度與範圍

## 核心洞見
歸納本期最具價值的洞見與啟發：
- 解決了什麼問題或回答了什麼疑問
- 提供了什麼新知識或新視角
- 對聽眾可能產生的影響與啟發
- 與當前趨勢或時事的關聯性

## 行動建議
列出所有可執行的建議與下一步行動：
- 具體的行動步驟
- 可以嘗試的方法或工具
- 推薦的相關資源、書籍或網站
- 值得追蹤的議題或人物

## 關鍵字詞與概念
3-5 個核心關鍵字詞，解釋每個詞在本集脈絡中的含義，幫助快速理解本期內容的核心概念。

## 整體評價
簡短評價本期內容的：
- 內容品質與深度
- 對目標受眾的價值
- 有哪些值得一听的精彩時刻

確保涵蓋本期內容的精髓，讓未收聽的讀者也能獲得完整理解。使用 Markdown 格式輸出，保持簡潔清晰的風格。`;

export function CustomPromptDialog({
  open,
  onOpenChange,
  podcastId,
}: CustomPromptDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  const { data: savedPrompt, isLoading } = useQuery({
    queryKey: ["podcast", podcastId],
    queryFn: async () => {
      const result = await window.api.getPodcast(podcastId);
      if (!result.success) throw new Error(result.error);
      return result.data.custom_prompt;
    },
    enabled: open && !!podcastId,
  });

  const updateMutation = useMutation({
    mutationFn: async (newPrompt: string | null) => {
      const result = await window.api.updateCustomPrompt(podcastId, newPrompt);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcast", podcastId] });
      addToast({
        type: "success",
        title: "Custom prompt saved",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Save failed",
        description: error.message,
      });
    },
  });

  // Reset state when dialog opens or savedPrompt changes
  useEffect(() => {
    if (open && savedPrompt !== undefined) {
      setPrompt(savedPrompt ?? DEFAULT_PROMPT);
      setIsDirty(false);
    }
  }, [open, savedPrompt]);

  const handleSave = () => {
    const value = prompt === DEFAULT_PROMPT ? null : prompt;
    updateMutation.mutate(value);
    setIsDirty(false);
  };

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT);
    setIsDirty(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setIsDirty(true);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isDirty) {
      setShowUnsavedChanges(true);
      return;
    }
    onOpenChange(newOpen);
  };

  const handleDiscardChanges = () => {
    setPrompt(savedPrompt ?? DEFAULT_PROMPT);
    setIsDirty(false);
    setShowUnsavedChanges(false);
    onOpenChange(false);
  };

  const handleSaveAndClose = () => {
    handleSave();
    setShowUnsavedChanges(false);
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-fadeIn z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw] bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-50 focus:outline-none">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 h-14">
              <Dialog.Title className="text-base font-medium text-white">
                Custom System Prompt
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors">
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
            </div>

            {/* Body */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex flex-col gap-3">
                <span className="text-sm text-white font-medium">
                  System Prompt
                </span>
                {isLoading ? (
                  <div className="text-zinc-400 text-center py-8">
                    Loading...
                  </div>
                ) : (
                  <textarea
                    value={prompt}
                    onChange={handleChange}
                    className="w-full h-[256px] bg-[#00000080] rounded-lg p-4 text-white text-sm font-sans leading-relaxed resize-none focus:outline-none transition-colors placeholder:text-zinc-600"
                    style={{
                      fontFamily:
                        'system-ui, -apple-system, "Microsoft JhengHei", "PingFang TC", sans-serif',
                    }}
                    placeholder="Enter custom prompt..."
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <button
                onClick={handleReset}
                className="h-10 px-5 flex items-center justify-center rounded-md bg-[#f43f5e] text-white text-sm font-medium hover:bg-[#e11d48] transition-colors"
              >
                Reset to Default
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="h-10 px-5 flex items-center justify-center rounded-md bg-[#6366f1] hover:bg-[#5558e3] transition-colors disabled:opacity-50"
                >
                  <span className="text-sm text-white font-medium">
                    {updateMutation.isPending
                      ? "Saving..."
                      : "Save Configuration"}
                  </span>
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <UnsavedChangesDialog
        open={showUnsavedChanges}
        onOpenChange={setShowUnsavedChanges}
        onSave={handleSaveAndClose}
        onDiscard={handleDiscardChanges}
      />
    </>
  );
}
