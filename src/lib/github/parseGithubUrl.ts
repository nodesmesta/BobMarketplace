/**
 * parseGithubUrl.ts
 *
 * Shared utility for parsing all valid GitHub repository URL formats.
 * Handles root repo URLs, tree (directory) URLs, and subdirectory paths
 * generically without relying on hardcoded branch names or folder patterns.
 *
 * Supported URL formats:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/tree/main
 *   https://github.com/owner/repo/tree/main/subdir
 *   https://github.com/owner/repo/tree/feat/my-branch/a/b/c
 *
 * NOT treated as a subdirectory source (blob = file, not a directory):
 *   https://github.com/owner/repo/blob/main/README.md
 */

export interface ParsedGithubUrl {
  /** Repository owner login, e.g. "nodesmesta" */
  owner: string;
  /** Repository name without .git suffix, e.g. "BobMarketplace" */
  repo: string;
  /**
   * Subdirectory path within the repository where bob-package.json resides.
   * Empty string ("") when pointing at the repository root.
   * e.g. "examples/sample-extension"
   */
  subPath: string;
}

/**
 * Parses a GitHub URL into its structural components.
 *
 * Returns null if:
 * - The URL is not a valid absolute URL
 * - The hostname is not github.com (or *.github.com)
 * - The pathname does not contain at least owner and repo segments
 */
export function parseGithubUrl(rawUrl: string): ParsedGithubUrl | null {
  try {
    const parsed = new URL(rawUrl.trim());

    // Accept github.com and subdomains only (e.g. subdomain.github.com).
    // Reject hostnames that merely contain the substring but are not github.com
    // (e.g. "notgithub.com" must not pass).
    const { hostname } = parsed;
    if (hostname !== "github.com" && !hostname.endsWith(".github.com")) return null;

    // Split pathname into non-empty segments
    // e.g. "/owner/repo/tree/main/a/b" -> ["owner", "repo", "tree", "main", "a", "b"]
    const parts = parsed.pathname.split("/").filter(Boolean);

    // Minimum: owner + repo
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");

    // parts[2] is the route type: "tree" (directory), "blob" (file), "commit", etc.
    // Only "tree" represents a browsable directory — anything else has no subPath.
    let subPath = "";
    if (parts.length > 4 && parts[2] === "tree") {
      // parts[3] is the branch name (dynamic — could be "main", "master", "feat/x", etc.)
      // parts[4..] is the actual subdirectory path inside the repo
      subPath = parts.slice(4).join("/");
    }

    return { owner, repo, subPath };
  } catch {
    return null;
  }
}
