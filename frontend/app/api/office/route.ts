import { NextResponse } from "next/server";

const GITHUB_OWNER = "kwangwon";
const GITHUB_REPO = "portfolio-blog";
const GITHUB_API = "https://api.github.com";

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  files?: { filename: string }[];
}

interface GitHubWorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  created_at: string;
  path: string;
}

export async function GET() {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "pixel-office",
    };

    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Fetch recent commits and workflow runs in parallel
    const [commitsRes, actionsRes] = await Promise.allSettled([
      fetch(`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?per_page=10`, {
        headers,
        next: { revalidate: 300 }, // ISR: 5 minutes
      }),
      fetch(`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?per_page=5`, {
        headers,
        next: { revalidate: 300 },
      }),
    ]);

    const events: {
      type: string;
      path: string;
      timestamp: string;
      actor: string;
      url?: string;
    }[] = [];

    let lastActivity = new Date(0).toISOString();

    // Process commits
    if (commitsRes.status === "fulfilled" && commitsRes.value.ok) {
      const commits: GitHubCommit[] = await commitsRes.value.json();
      for (const commit of commits) {
        const timestamp = commit.commit.author.date;
        if (timestamp > lastActivity) lastActivity = timestamp;

        // Use commit message to guess path if files not available
        const path = guessPathFromMessage(commit.commit.message);
        events.push({
          type: "COMMIT",
          path,
          timestamp,
          actor: commit.commit.author.name,
          url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/commit/${commit.sha}`,
        });
      }
    }

    // Process workflow runs
    if (actionsRes.status === "fulfilled" && actionsRes.value.ok) {
      const data = await actionsRes.value.json();
      const runs: GitHubWorkflowRun[] = data.workflow_runs ?? [];
      for (const run of runs) {
        const type = run.conclusion ? "ACTION_COMPLETE" : "ACTION_RUN";
        events.push({
          type,
          path: run.path,
          timestamp: run.created_at,
          actor: "github-actions",
        });
      }
    }

    return NextResponse.json({ events, lastActivity });
  } catch {
    // Fallback: return empty events so the office still renders
    return NextResponse.json({
      events: [],
      lastActivity: new Date().toISOString(),
    });
  }
}

function guessPathFromMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("backend") || lower.includes("spring") || lower.includes("jpa")) {
    return "backend/";
  }
  if (lower.includes("frontend") || lower.includes("next") || lower.includes("react") || lower.includes("component")) {
    return "frontend/";
  }
  if (lower.includes("docker") || lower.includes("ci") || lower.includes("deploy") || lower.includes("nginx")) {
    return "docker-compose.yml";
  }
  if (lower.includes("docs") || lower.includes("readme")) {
    return "docs/";
  }
  // Default: use conventional commit prefix
  if (lower.startsWith("feat:") || lower.startsWith("fix:") || lower.startsWith("refactor:")) {
    return "frontend/"; // most likely frontend work in Phase 1B
  }
  return "unknown";
}
