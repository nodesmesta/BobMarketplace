import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const packageName = params.name?.trim().toLowerCase();

    if (!packageName || !/^[a-z0-9-_]+$/.test(packageName)) {
      return NextResponse.json(
        { success: false, error: "Invalid package name format." },
        { status: 400 }
      );
    }

    // Retrieve package and latest version
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from("packages")
      .select("id, name, latest_version")
      .eq("name", packageName)
      .maybeSingle();

    if (pkgError) {
      console.error("[Download Dispatcher Package Query Error]:", pkgError.message);
      return NextResponse.json({ success: false, error: "Internal database query error" }, { status: 500 });
    }

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: `Package '${packageName}' not found` },
        { status: 404 }
      );
    }

    // Retrieve bundle_url from package_versions
    const { data: versionData, error: verError } = await supabaseAdmin
      .from("package_versions")
      .select("bundle_url")
      .eq("package_id", pkg.id)
      .eq("version", pkg.latest_version)
      .maybeSingle();

    if (verError) {
      console.error("[Download Dispatcher Version Query Error]:", verError.message);
      return NextResponse.json({ success: false, error: "Internal database query error" }, { status: 500 });
    }

    if (!versionData?.bundle_url) {
      return NextResponse.json(
        { success: false, error: `Release bundle for package '${packageName}' v${pkg.latest_version} not found` },
        { status: 404 }
      );
    }

    // Atomic increment via Stored Procedure (RPC) to prevent race conditions
    const { error: rpcError } = await supabaseAdmin.rpc("increment_package_downloads", {
      target_package_id: pkg.id,
    });
    if (rpcError) {
      console.error("[Atomic Download Counter RPC Error]:", rpcError.message);
    }

    // Redirect user to the direct public CDN URL
    return NextResponse.redirect(new URL(versionData.bundle_url), 302);
  } catch (err: any) {
    console.error("[Download Dispatcher Route Error]:", err?.message);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
