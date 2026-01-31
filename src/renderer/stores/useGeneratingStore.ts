import { create } from "zustand";

interface GeneratingState {
  isGenerating: boolean;
  generatingEpisodeId: string | null;
  setGenerating: (episodeId: string | null) => void;
}

export const useGeneratingStore = create<GeneratingState>((set) => ({
  isGenerating: false,
  generatingEpisodeId: null,

  setGenerating: (episodeId) =>
    set({
      isGenerating: episodeId !== null,
      generatingEpisodeId: episodeId,
    }),
}));
