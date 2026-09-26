import path from "path";
import { BobPackageManifest } from "./schema";

const RESERVED_NAMES = new Set([
  "admin",
  "root",
  "system",
  "core",
  "marketplace",
  "bob",
  "official",
  "null",
  "undefined",
]);

export interface SecurityCheckResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that the package name is safe, non-reserved, and non-empty.
 */
export function validatePackageName(name: string): SecurityCheckResult {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Package name is missing or invalid." };
  }

  const normalized = name.trim().toLowerCase();
  if (RESERVED_NAMES.has(normalized)) {
    return { valid: false, error: `Package name '${name}' is a reserved system keyword.` };
  }

  if (!/^[a-z0-9-_]+$/.test(normalized)) {
    return {
      valid: false,
      error: "Package name may only contain lowercase alphanumeric characters, hyphens, and underscores.",
    };
  }

  return { valid: true };
}

/**
 * Validates that all destination paths in the package manifest strictly reside
 * within the allowed `.bob/` project sandbox directory and reject path traversal attacks.
 */
export function validateDestPaths(manifest: BobPackageManifest): SecurityCheckResult {
  for (const file of manifest.files) {
    const dest = file.dest.trim();

    // Reject absolute paths
    if (path.isAbsolute(dest) || dest.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(dest)) {
      return {
        valid: false,
        error: `Security violation: Absolute destination path '${dest}' is prohibited.`,
      };
    }

    // Normalize path to evaluate path traversal
    const normalizedDest = path.normalize(dest);

    // Reject parent directory escapes (e.g. ../, ../../)
    if (normalizedDest.startsWith("..") || normalizedDest.includes(`${path.sep}..`)) {
      return {
        valid: false,
        error: `Security violation: Path traversal detected in destination '${dest}'.`,
      };
    }

    // Ensure path strictly starts with .bob/ or is inside .bob
    if (!normalizedDest.startsWith(".bob/") && normalizedDest !== ".bob") {
      return {
        valid: false,
        error: `Security violation: Target file destination '${dest}' must be within the '.bob/' workspace directory.`,
      };
    }
  }

  return { valid: true };
}
