import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabaseClient";
import { getGithubRepoStats } from "@/lib/github/repoStats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const packageName = params.name?.trim().toLowerCase();

    if (!packageName || !/^[a-z0-9-_]+$/.test(packageName)) {
      return NextResponse.json(
        { success: false, error: "Invalid package name format. Must be alphanumeric with hyphens or underscores." },
        { status: 400 }
      );
    }

    const { data: pkg, error } = await supabase
      .from("packages")
      .select(
        `
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
          github_id,
          username,
          display_name,
          avatar_url,
          bio
        ),
        package_versions (
          id,
          version,
          manifest,
          bundle_url,
          readme_content,
          changelog,
          created_at
        )
      `
      )
      .eq("name", packageName)
      .maybeSingle();

    if (error) {
      console.error("[Package Detail Error]:", error.message);
      return NextResponse.json({ success: false, error: "Failed to retrieve package information" }, { status: 500 });
    }

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: `Package '${packageName}' not found` },
        { status: 404 }
      );
    }

    // Sort versions descending by creation date
    const sortedVersions = (pkg.package_versions || []).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const latestVersionData = sortedVersions.find((v: any) => v.version === pkg.latest_version) || sortedVersions[0];

    const stats = await getGithubRepoStats(pkg.repo_url);

    return NextResponse.json({
      success: true,
      data: {
        ...pkg,
        stars: stats.stars,
        forks: stats.forks,
        package_versions: sortedVersions,
        latest_release: latestVersionData || null,
      },
    });
  } catch (err: any) {
    console.error("[Package Detail Route Error]:", err?.message);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
