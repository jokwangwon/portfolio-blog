"use client";

import { useQuery } from "@tanstack/react-query";
import type { GitHubEvent } from "../types/office.types";

interface GitHubActivityResponse {
  events: GitHubEvent[];
  lastActivity: string;
}

async function fetchGitHubActivity(): Promise<GitHubActivityResponse> {
  const res = await fetch("/api/office");
  if (!res.ok) {
    throw new Error(`Office API error: ${res.status}`);
  }
  return res.json();
}

export function useAgentStatus() {
  return useQuery<GitHubActivityResponse>({
    queryKey: ["office", "github-activity"],
    queryFn: fetchGitHubActivity,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 3 * 60 * 1000,
    retry: 2,
  });
}
