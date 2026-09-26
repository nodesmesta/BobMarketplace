import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseGithubUrl(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(repoUrl);
    if (!parsed.hostname.includes("github.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const packageName = params.name?.trim().toLowerCase();

    if (!packageName) {
      return NextResponse.json(
        { success: false, error: "Package name is required." },
        { status: 400 }
      );
    }

    // 1. Authenticate caller session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    let user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        user = (await supabase.auth.getUser(token)).data.user;
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in to manage this package." },
        { status: 401 }
      );
    }

    const authenticatedUsername =
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username;

    // 2. Fetch package from database
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from("packages")
      .select(`
        id,
        name,
        display_name,
        description,
        repo_url,
        latest_version,
        category,
        tags,
        downloads,
        is_verified,
        created_at,
        updated_at,
        publishers (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("name", packageName)
      .maybeSingle();

    if (pkgError || !pkg) {
      return NextResponse.json(
        { success: false, error: `Package '${packageName}' not found.` },
        { status: 404 }
      );
    }

    // 3. Ownership verification guard
    const publisher = (pkg as any).publishers;
    if (!publisher || publisher.username.toLowerCase() !== authenticatedUsername.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Only the package maintainer (@${publisher?.username}) can access management and release controls.`,
        },
        { status: 403 }
      );
    }

    // 4. Fetch all archived version snapshots for this package
    const { data: versionSnapshots } = await supabaseAdmin
      .from("package_versions")
      .select("id, version, bundle_url, changelog, created_at, manifest")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false });

    // 5. Inspect remote GitHub repository for bob-package.json and open issues
    const ghParsed = parseGithubUrl(pkg.repo_url);
    let githubVersion: string | null = null;
    let remoteManifest: any = null;
    let openIssues: any[] = [];
    let openIssuesCount = 0;

    if (ghParsed) {
      const { owner, repo } = ghParsed;
      const ghHeaders: Record<string, string> = {
        "User-Agent": "Bob-Marketplace-Registry-Gateway",
        Accept: "application/vnd.github.v3+json",
      };

      if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
        ghHeaders["Authorization"] = `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
      }

      // 5a. Fetch live bob-package.json from GitHub
      try {
        const manifestRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/bob-package.json`,
          { headers: ghHeaders, next: { revalidate: 0 } }
        );

        if (manifestRes.ok) {
          const fileData = await manifestRes.json();
          if (fileData.content) {
            const decodedJson = Buffer.from(fileData.content, "base64").toString("utf-8");
            remoteManifest = JSON.parse(decodedJson);
            githubVersion = remoteManifest.version || null;
          }
        } else {
          // Fallback to raw GitHub user content
          const rawRes = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/bob-package.json`,
            { next: { revalidate: 0 } }
          );
          if (rawRes.ok) {
            remoteManifest = await rawRes.json();
            githubVersion = remoteManifest.version || null;
          }
        }
      } catch (err) {
        console.error("Failed to read remote bob-package.json:", err);
      }

      // 5b. Fetch live open issues from GitHub (filter out pull requests)
      try {
        const issuesRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=20`,
          { headers: ghHeaders, next: { revalidate: 0 } }
        );

        if (issuesRes.ok) {
          const rawIssues = await issuesRes.json();
          if (Array.isArray(rawIssues)) {
            // In GitHub API, PRs are also returned by issues endpoint, so exclude items with pull_request key
            openIssues = rawIssues
              .filter((item: any) => !item.pull_request)
              .map((item: any) => ({
                id: item.id,
                number: item.number,
                title: item.title,
                html_url: item.html_url,
                created_at: item.created_at,
                comments: item.comments,
                user: {
                  login: item.user?.login,
                  avatar_url: item.user?.avatar_url,
                },
                labels: (item.labels || []).map((l: any) => ({
                  id: l.id,
                  name: l.name,
                  color: l.color,
                })),
              }));
            openIssuesCount = openIssues.length;
          }
        }
      } catch (err) {
        console.error("Failed to fetch open issues from GitHub:", err);
      }
    }

    const hasUpdate = Boolean(
      githubVersion && githubVersion !== pkg.latest_version
    );

    return NextResponse.json({
      success: true,
      data: {
        package: pkg,
        versions: versionSnapshots || [],
        registryVersion: pkg.latest_version,
        githubVersion,
        hasUpdate,
        remoteManifest,
        openIssues,
        openIssuesCount,
      },
    });
  } catch (err: any) {
    console.error("[Check Update Route Error]:", err?.message);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
