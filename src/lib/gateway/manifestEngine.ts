import { bobPackageManifestSchema, BobPackageManifest } from "./schema";
import { validatePackageName, validateDestPaths } from "./securityGuard";

export interface ParseManifestResult {
  success: boolean;
  manifest?: BobPackageManifest;
  error?: string;
}

/**
 * Parses and strictly validates a raw JSON string or object as a BobPackageManifest.
 */
export function parseAndValidateManifest(raw: string | object): ParseManifestResult {
  try {
    const parsedObj = typeof raw === "string" ? JSON.parse(raw) : raw;
    const zodResult = bobPackageManifestSchema.safeParse(parsedObj);

    if (!zodResult.success) {
      const issue = zodResult.error.issues[0];
      return {
        success: false,
        error: `Validation error at '${issue.path.join(".")}': ${issue.message}`,
      };
    }

    const manifest = zodResult.data;

    // Check package name security
    const nameCheck = validatePackageName(manifest.name);
    if (!nameCheck.valid) {
      return { success: false, error: nameCheck.error };
    }

    // Check destination path traversal security
    const pathCheck = validateDestPaths(manifest);
    if (!pathCheck.valid) {
      return { success: false, error: pathCheck.error };
    }

    return {
      success: true,
      manifest,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Invalid manifest format: ${err?.message || "Failed to parse JSON"}`,
    };
  }
}
