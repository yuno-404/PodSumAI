import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * TanStack Query Hooks
 *
 * Handles all server state (data from IPC/backend)
 */

import { useGeneratingStore } from "../stores/useGeneratingStore";

// ===== Podcasts =====

export function usePodcasts() {
  return useQuery({
    queryKey: ["podcasts"],
    queryFn: async () => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.getPodcasts();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: typeof window !== "undefined" && !!window.api,
  });
}

export function useSubscribePodcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      url,
      artworkUrl,
    }: {
      url: string;
      artworkUrl?: string;
    }) => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.subscribePodcast(url, artworkUrl);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcasts"] });
    },
  });
}

export function useSearchPodcasts() {
  return useMutation({
    mutationFn: async (query: string) => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.searchPodcasts(query);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useDeletePodcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (podcastId: string) => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.deletePodcast(podcastId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcasts"] });
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
    },
  });
}

// ===== Episodes =====

export function useEpisodes(podcastId: string | null) {
  return useQuery({
    queryKey: ["episodes", podcastId],
    queryFn: async () => {
      if (!podcastId) return [];
      if (!window.api) throw new Error("API not available");
      const result = await window.api.getEpisodes(podcastId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!podcastId && typeof window !== "undefined" && !!window.api,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDownloadedEpisodes() {
  return useQuery({
    queryKey: ["episodes", "downloaded"],
    queryFn: async () => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.getDownloadedEpisodes();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: typeof window !== "undefined" && !!window.api,
  });
}

export function useDownloadEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      episodeId,
      destDir,
    }: {
      episodeId: string;
      destDir: string;
    }) => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.downloadEpisode(episodeId, destDir);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      // Invalidate episodes to refresh download status
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
    },
  });
}

export function useDeleteDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (episodeId: string) => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.deleteDownload(episodeId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
    },
  });
}

// ===== AI Summaries =====

export function useDocuments(episodeId: string | null) {
  return useQuery({
    queryKey: ["documents", episodeId],
    queryFn: async () => {
      if (!episodeId) return [];
      if (!window.api) throw new Error("API not available");
      const result = await window.api.getDocuments(episodeId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!episodeId && typeof window !== "undefined" && !!window.api,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDocumentsByPodcast(podcastId: string | null) {
  return useQuery({
    queryKey: ["documents-by-podcast", podcastId],
    queryFn: async () => {
      if (!podcastId) return [];
      if (!window.api) throw new Error("API not available");
      const result = await window.api.getDocumentsByPodcast(podcastId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!podcastId && typeof window !== "undefined" && !!window.api,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllDocumentsGrouped(podcasts: any[] | undefined) {
  const ids = (podcasts ?? []).map((p: any) => p.id as string);

  const results = useQueries({
    queries: ids.map((podcastId) => ({
      queryKey: ["documents-by-podcast", podcastId],
      queryFn: async () => {
        if (!window.api) throw new Error("API not available");
        const result = await window.api.getDocumentsByPodcast(podcastId);
        if (!result.success) throw new Error(result.error);
        return { podcastId, docs: result.data as any[] };
      },
      staleTime: 5 * 60 * 1000,
      enabled: !!window.api,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const grouped = new Map<string, any[]>();
  let total = 0;

  results.forEach((r) => {
    if (r.data && r.data.docs.length > 0) {
      grouped.set(r.data.podcastId, r.data.docs);
      total += r.data.docs.length;
    }
  });

  return { grouped, total, isLoading };
}

export function useRunAiSummary() {
  const queryClient = useQueryClient();
  const setGenerating = useGeneratingStore((state) => state.setGenerating);

  return useMutation({
    mutationFn: async (episodeId: string) => {
      if (!window.api) throw new Error("API not available");
      setGenerating(episodeId);
      const result = await window.api.runAiSummary(episodeId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, episodeId) => {
      queryClient.invalidateQueries({ queryKey: ["documents", episodeId] });
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
    },
    onSettled: () => {
      setGenerating(null);
    },
  });
}

export function useDeleteSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.deleteSummary(documentId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

// ===== Custom Prompt =====

export function useUpdateCustomPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      podcastId,
      prompt,
    }: {
      podcastId: string;
      prompt: string;
    }) => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.updateCustomPrompt(podcastId, prompt);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcasts"] });
    },
  });
}

// ===== Database Stats =====

export function useDbStats() {
  return useQuery({
    queryKey: ["db-stats"],
    queryFn: async () => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.getDbStats();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 30000,
    enabled: typeof window !== "undefined" && !!window.api,
  });
}

// ===== API Key =====

export function useSaveApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.saveApiKey(apiKey);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-key"] });
    },
  });
}

export function useGetApiKey() {
  return useQuery({
    queryKey: ["api-key"],
    queryFn: async () => {
      if (!window.api) throw new Error("API not available");
      const result = await window.api.getApiKey();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: typeof window !== "undefined" && !!window.api,
  });
}
