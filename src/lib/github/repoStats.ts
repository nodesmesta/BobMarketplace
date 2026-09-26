interface RepoStats {
  stars: number;
  forks: number;
}

const statsCache = new Map<string, { data: RepoStats; expires: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

/**
 * Parses GitHub repository URL and retrieves real-time stars and forks.
 * Gracefully defaults to 0 if private, unreachable, or rate limited.
 */
export async function getGithubRepoStats(repoUrl: string): Promise<RepoStats> {
  const defaultStats: RepoStats = { stars: 0, forks: 0 };
  if (!repoUrl) return defaultStats;

  try {
    const url = new URL(repoUrl);
    if (!url.hostname.includes("github.com")) return defaultStats;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return defaultStats;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    const cacheKey = `${owner}/${repo}`.toLowerCase();

    const cached = statsCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }

    const headers: Record<string, string> = {
      "User-Agent": "Bob-Marketplace-Registry-Gateway",
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return defaultStats;
    }

    const data = await res.json();
    const stats: RepoStats = {
      stars: typeof data.stargazers_count === "number" ? data.stargazers_count : 0,
      forks: typeof data.forks_count === "number" ? data.forks_count : 0,
    };

    statsCache.set(cacheKey, { data: stats, expires: Date.now() + CACHE_TTL_MS });
    return stats;
  } catch {
    return defaultStats;
  }
}
