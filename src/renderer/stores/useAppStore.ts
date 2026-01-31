import { create } from "zustand";

/**
 * Global App State (Zustand)
 *
 * Manages UI-only state (not server data - that's handled by TanStack Query)
 */

export type Tab = "episodes" | "local-upload" | "knowledge";

interface AppState {
  // Active selections
  activePodcastId: string | null;
  activeEpisodeId: string | null;
  activeTab: Tab;

  // UI state
  isSidebarCollapsed: boolean;
  searchQuery: string;
  isSearchMode: boolean; // NEW: Toggle between subscription list and search results

  // Actions
  setActivePodcast: (id: string | null) => void;
  setActiveEpisode: (id: string | null) => void;
  setActiveTab: (tab: Tab) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setSearchMode: (isSearch: boolean) => void; // NEW: Set search mode
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  activePodcastId: null,
  activeEpisodeId: null,
  activeTab: "episodes",
  isSidebarCollapsed: false,
  searchQuery: "",
  isSearchMode: false, // NEW: Start in subscription list mode

  // Actions
  setActivePodcast: (id) =>
    set({
      activePodcastId: id,
      activeEpisodeId: null, // Reset episode when podcast changes
      activeTab: "episodes", // Reset to episodes tab
    }),

  setActiveEpisode: (id) => set({ activeEpisodeId: id }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleSidebar: () =>
    set((state) => ({
      isSidebarCollapsed: !state.isSidebarCollapsed,
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearchMode: (isSearch) => set({ isSearchMode: isSearch }), // NEW: Toggle search mode

  reset: () =>
    set({
      activePodcastId: null,
      activeEpisodeId: null,
      activeTab: "episodes",
      isSidebarCollapsed: false,
      searchQuery: "",
    }),
}));
