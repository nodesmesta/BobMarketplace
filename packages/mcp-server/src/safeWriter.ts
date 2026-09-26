import fs from "fs";
import path from "path";

export class SafeFilesystemWriter {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = path.resolve(workspaceRoot);
  }

  /**
   * Safely writes a file to the active workspace, ensuring the destination
   * stays strictly inside the workspace's `.bob/` directory.
   */
  public writeFile(relativeDest: string, content: Buffer | string): string {
    const normalizedRelative = path.normalize(relativeDest);

    // Reject path traversal
    if (normalizedRelative.startsWith("..") || path.isAbsolute(normalizedRelative)) {
      throw new Error(`Path traversal attempt blocked: '${relativeDest}'`);
    }

    // Must be inside .bob/
    if (!normalizedRelative.startsWith(".bob/") && normalizedRelative !== ".bob") {
      throw new Error(`Destination must be inside '.bob/': '${relativeDest}'`);
    }

    const fullPath = path.resolve(this.workspaceRoot, normalizedRelative);

    // Double check that resolved path is inside workspaceRoot
    if (!fullPath.startsWith(this.workspaceRoot)) {
      throw new Error(`Path escape detected: '${relativeDest}'`);
    }

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content);
    return normalizedRelative;
  }

  /**
   * Safely deletes an installed file and cleans up empty parent directories.
   */
  public deleteFile(relativeDest: string): boolean {
    const normalizedRelative = path.normalize(relativeDest);
    const fullPath = path.resolve(this.workspaceRoot, normalizedRelative);

    if (!fullPath.startsWith(this.workspaceRoot)) return false;

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);

      // Clean empty parent directories up to .bob/
      let parentDir = path.dirname(fullPath);
      const bobRoot = path.join(this.workspaceRoot, ".bob");

      while (parentDir.startsWith(bobRoot) && parentDir !== bobRoot) {
        try {
          const files = fs.readdirSync(parentDir);
          if (files.length === 0) {
            fs.rmdirSync(parentDir);
            parentDir = path.dirname(parentDir);
          } else {
            break;
          }
        } catch {
          break;
        }
      }
      return true;
    }
    return false;
  }
}
