import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabaseClient";
import { getGithubRepoStats } from "@/lib/github/repoStats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQ = searchParams.get("q")?.trim() || "";
    // Strict sanitization: strip PostgREST operators, quotes, wildcards, commas, and parentheses
    const sanitizedQ = rawQ.replace(/[^a-zA-Z0-9\s-_]/g, "").trim().slice(0, 100);

    const rawType = searchParams.get("type")?.trim().toLowerCase() || "";
    const allowedCategories = [
      "agent",
      "skill",
      "plugin",
      "tool",
      "mcp",
      "hook",
      "rule",
      "config",
      "preset",
      "mode",
      "utility",
    ];
    const sanitizedType = allowedCategories.includes(rawType) ? rawType : "";

    const sort = searchParams.get("sort")?.trim() || "popular";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    let query = supabase
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
          avatar_url
        )
      `,
        { count: "exact" }
      );

    // Filter by safely sanitized text query
    if (sanitizedQ) {
      query = query.or(`name.ilike.%${sanitizedQ}%,display_name.ilike.%${sanitizedQ}%,description.ilike.%${sanitizedQ}%`);
    }

    // Filter by verified category
    if (sanitizedType) {
      query = query.eq("category", sanitizedType);
    }

    // Sorting options
    if (sort === "latest") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "alphabetical") {
      query = query.order("name", { ascending: true });
    } else {
      // Default: popular
      query = query.order("downloads", { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: packages, count, error } = await query;

    if (error) {
      console.error("[Packages Discovery Error]:", error.message);
      return NextResponse.json({ success: false, error: "Failed to fetch packages catalog" }, { status: 500 });
    }

    const enrichedPackages = await Promise.all(
      (packages || []).map(async (pkg: any) => {
        const stats = await getGithubRepoStats(pkg.repo_url);
        return {
          ...pkg,
          stars: stats.stars,
          forks: stats.forks,
        };
      })
    );

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: enrichedPackages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err: any) {
    console.error("[Packages Route Error]:", err?.message);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
