import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const username =
            user.user_metadata?.user_name ||
            user.user_metadata?.preferred_username ||
            "developer";
          const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            username;
          const avatarUrl =
            user.user_metadata?.avatar_url ||
            `https://github.com/${username}.png`;
          const githubId = String(user.user_metadata?.provider_id || user.id);

          await supabaseAdmin
            .from("publishers")
            .upsert(
              {
                github_id: githubId,
                username,
                display_name: displayName,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "github_id" }
            );
        }
      } catch (err) {
        console.error("Failed to sync publisher profile:", err);
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
