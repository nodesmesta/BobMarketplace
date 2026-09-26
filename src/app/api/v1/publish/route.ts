import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { parseAndValidateManifest } from "@/lib/gateway/manifestEngine";
import * as tar from "tar";
import { Readable } from "stream";

/**
 * Helper to parse GitHub repo URL into owner and repo name.
 * e.g. https://github.com/owner/repo -> { owner: "owner", repo: "repo" }
 */
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl } = body;

    if (!repoUrl) {
      return NextResponse.json({ success: false, error: "Missing 'repoUrl' in request body." }, { status: 400 });
    }

    const githubParsed = parseGithubUrl(repoUrl);
    if (!githubParsed) {
      return NextResponse.json(
        { success: false, error: "Invalid GitHub repository URL. Must be in format https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    const { owner, repo } = githubParsed;

    // 0. Authenticate caller via Supabase Session Cookie or Bearer Token
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
        {
          success: false,
          error: "Unauthorized: You must sign in with your GitHub account to publish packages.",
        },
        { status: 401 }
      );
    }

    const authenticatedUsername =
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username;

    if (!authenticatedUsername) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Could not determine GitHub username from session metadata.",
        },
        { status: 401 }
      );
    }

    // Strict Ownership Verification Guard:
    // Publisher can ONLY publish repositories owned by their own GitHub account
    if (owner.toLowerCase() !== authenticatedUsername.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: `Ownership verification failed: You can only publish repositories belonging to your own GitHub account (@${authenticatedUsername}). The repository '${owner}/${repo}' belongs to '${owner}'.`,
        },
        { status: 403 }
      );
    }

    const publisherUsername = authenticatedUsername;
    const publisherDisplayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      authenticatedUsername;
    const publisherAvatarUrl =
      user.user_metadata?.avatar_url ||
      `https://github.com/${authenticatedUsername}.png`;
    const publisherGithubId = String(user.user_metadata?.provider_id || user.id);

    // 1. Fetch repository tarball from GitHub
    const tarballUrl = `https://api.github.com/repos/${owner}/${repo}/tarball`;
    const ghHeaders: Record<string, string> = {
      "User-Agent": "Bob-Marketplace-Registry-Gateway",
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
      ghHeaders["Authorization"] = `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
    }

    const tarballRes = await fetch(tarballUrl, { headers: ghHeaders });
    if (!tarballRes.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to download repository from GitHub: ${tarballRes.statusText}` },
        { status: 400 }
      );
    }

    const tarballBuffer = Buffer.from(await tarballRes.arrayBuffer());

    // 2. Unpack tarball in memory and extract files
    const extractedFiles = new Map<string, Buffer>();
    let manifestBuffer: Buffer | null = null;
    let readmeBuffer: Buffer | null = null;

    const stream = Readable.from(tarballBuffer);
    const parser = new tar.Parser();

    await new Promise<void>((resolve, reject) => {
      parser.on("entry", (entry: any) => {
        // GitHub tarballs have a root directory like owner-repo-sha/
        const rawPath = entry.path;
        const normalizedPath = rawPath.substring(rawPath.indexOf("/") + 1);

        const chunks: Buffer[] = [];
        entry.on("data", (chunk: Buffer) => chunks.push(chunk));
        entry.on("end", () => {
          const fileData = Buffer.concat(chunks);
          if (entry.type === "File") {
            extractedFiles.set(normalizedPath, fileData);

            if (normalizedPath === "bob-package.json") {
              manifestBuffer = fileData;
            } else if (normalizedPath.toLowerCase() === "readme.md") {
              readmeBuffer = fileData;
            }
          }
        });
      });

      parser.on("end", () => resolve());
      parser.on("error", (err) => reject(err));

      stream.pipe(parser);
    });

    if (!manifestBuffer) {
      return NextResponse.json(
        { success: false, error: "Repository is missing the required 'bob-package.json' manifest at its root." },
        { status: 400 }
      );
    }

    // 3. Validate manifest through Gateway Manager
    const manifestJsonString = (manifestBuffer as Buffer).toString("utf-8");
    const validationResult = parseAndValidateManifest(manifestJsonString);

    if (!validationResult.success || !validationResult.manifest) {
      return NextResponse.json(
        { success: false, error: `Manifest validation failed: ${validationResult.error}` },
        { status: 400 }
      );
    }

    const manifest = validationResult.manifest;

    // 4. Verify that declared files exist in the repository
    for (const fileDecl of manifest.files) {
      const srcNormalized = fileDecl.src.replace(/^\.\//, "");
      if (!extractedFiles.has(srcNormalized)) {
        return NextResponse.json(
          {
            success: false,
            error: `Manifest declares '${fileDecl.src}', but this file was not found in the repository.`,
          },
          { status: 400 }
        );
      }
    }

    // 5. Immutability Check: verify if this package version already exists
    const { data: existingPkg } = await supabaseAdmin
      .from("packages")
      .select("id, name")
      .eq("name", manifest.name)
      .maybeSingle();

    if (existingPkg) {
      const { data: existingVersion } = await supabaseAdmin
        .from("package_versions")
        .select("id")
        .eq("package_id", existingPkg.id)
        .eq("version", manifest.version)
        .maybeSingle();

      if (existingVersion) {
        return NextResponse.json(
          {
            success: false,
            error: `Package '${manifest.name}' version '${manifest.version}' is already published and immutable. Please bump the version.`,
          },
          { status: 409 }
        );
      }
    }

    // 6. Build the packaged tarball archive (.tar.gz)
    // Package includes bob-package.json, README.md, and all declared files in manifest
    const filesToPack: { name: string; data: Buffer }[] = [
      { name: "bob-package.json", data: manifestBuffer },
    ];

    if (readmeBuffer) {
      filesToPack.push({ name: "README.md", data: readmeBuffer });
    }

    for (const fileDecl of manifest.files) {
      const srcNormalized = fileDecl.src.replace(/^\.\//, "");
      const data = extractedFiles.get(srcNormalized);
      if (data) {
        filesToPack.push({ name: srcNormalized, data });
      }
    }

    // Create .tar.gz bundle buffer
    const packStream = new tar.Pack({ gzip: true });
    const packedChunks: Buffer[] = [];

    const packPromise = new Promise<Buffer>((resolve, reject) => {
      packStream.on("data", (chunk: Buffer) => packedChunks.push(chunk));
      packStream.on("end", () => resolve(Buffer.concat(packedChunks)));
      packStream.on("error", reject);
    });

    for (const f of filesToPack) {
      const entry = new (tar as any).ReadEntry(new (tar as any).Header({
        path: f.name,
        size: f.data.length,
        mode: 0o644,
      }));
      packStream.add(entry);
      entry.write(f.data);
      entry.end();
    }
    packStream.end();

    const bundleArchiveBuffer = await packPromise;

    // 7. Upload bundle archive to Supabase Storage bucket
    const bundleFileName = `${manifest.name}-${manifest.version}.tar.gz`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("packages-bundle")
      .upload(bundleFileName, bundleArchiveBuffer, {
        contentType: "application/gzip",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: `Failed to upload bundle to storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("packages-bundle")
      .getPublicUrl(bundleFileName);

    const bundleUrl = publicUrlData.publicUrl;

    // 8. Upsert Publisher using authenticated profile
    let publisherId: string | null = null;
    const { data: pubData } = await supabaseAdmin
      .from("publishers")
      .select("id")
      .eq("username", publisherUsername)
      .maybeSingle();

    if (pubData) {
      publisherId = pubData.id;
      // Keep avatar & display name updated
      await supabaseAdmin
        .from("publishers")
        .update({
          display_name: publisherDisplayName,
          avatar_url: publisherAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", publisherId);
    } else {
      const { data: newPub, error: newPubError } = await supabaseAdmin
        .from("publishers")
        .insert({
          github_id: publisherGithubId,
          username: publisherUsername,
          display_name: publisherDisplayName,
          avatar_url: publisherAvatarUrl,
        })
        .select("id")
        .single();

      if (!newPubError && newPub) {
        publisherId = newPub.id;
      }
    }

    // 9. Upsert Package with ownership integrity check
    let packageId = existingPkg?.id;
    if (existingPkg) {
      // Ensure only the original publisher can publish new versions
      const { data: currentOwner } = await supabaseAdmin
        .from("packages")
        .select("publisher_id")
        .eq("id", existingPkg.id)
        .single();

      if (currentOwner?.publisher_id && publisherId && currentOwner.publisher_id !== publisherId) {
        return NextResponse.json(
          {
            success: false,
            error: `Forbidden: Package '${manifest.name}' is already owned by another publisher. Only the original author can publish new versions.`,
          },
          { status: 403 }
        );
      }
      await supabaseAdmin
        .from("packages")
        .update({
          display_name: manifest.display_name,
          description: manifest.description,
          repo_url: repoUrl,
          latest_version: manifest.version,
          category: manifest.type,
          tags: manifest.keywords,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPkg.id);
    } else {
      const { data: newPkg, error: newPkgError } = await supabaseAdmin
        .from("packages")
        .insert({
          name: manifest.name,
          display_name: manifest.display_name,
          description: manifest.description,
          repo_url: repoUrl,
          publisher_id: publisherId,
          latest_version: manifest.version,
          category: manifest.type,
          tags: manifest.keywords,
          downloads: 0,
        })
        .select("id")
        .single();

      if (newPkgError || !newPkg) {
        return NextResponse.json(
          { success: false, error: `Failed to record package: ${newPkgError?.message}` },
          { status: 500 }
        );
      }
      packageId = newPkg.id;
    }

    // 10. Record Package Version
    const readmeContent = readmeBuffer ? (readmeBuffer as Buffer).toString("utf-8") : "";

    const { error: versionInsertError } = await supabaseAdmin
      .from("package_versions")
      .insert({
        package_id: packageId,
        version: manifest.version,
        manifest: manifest as any,
        bundle_url: bundleUrl,
        readme_content: readmeContent,
      });

    if (versionInsertError) {
      return NextResponse.json(
        { success: false, error: `Failed to record package version: ${versionInsertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Package '${manifest.name}' v${manifest.version} published successfully!`,
      data: {
        name: manifest.name,
        version: manifest.version,
        bundleUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error during publish" },
      { status: 500 }
    );
  }
}
