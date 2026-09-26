import fs from "fs";
import path from "path";

export interface LockfilePackageEntry {
  version: string;
  installedAt: string;
  files: string[];
}

export interface MarketplaceLockfile {
  version: "1.0.0";
  packages: Record<string, LockfilePackageEntry>;
}

export class LockfileManager {
  private workspaceRoot: string;
  private lockfilePath: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.lockfilePath = path.join(this.workspaceRoot, ".bob", ".marketplace-lock.json");
  }

  public readLockfile(): MarketplaceLockfile {
    try {
      if (!fs.existsSync(this.lockfilePath)) {
        return { version: "1.0.0", packages: {} };
      }
      const content = fs.readFileSync(this.lockfilePath, "utf-8");
      return JSON.parse(content) as MarketplaceLockfile;
    } catch {
      return { version: "1.0.0", packages: {} };
    }
  }

  public writeLockfile(lockfile: MarketplaceLockfile): void {
    const bobDir = path.join(this.workspaceRoot, ".bob");
    if (!fs.existsSync(bobDir)) {
      fs.mkdirSync(bobDir, { recursive: true });
    }
    fs.writeFileSync(this.lockfilePath, JSON.stringify(lockfile, null, 2), "utf-8");
  }

  public recordInstalledPackage(packageName: string, version: string, files: string[]): void {
    const lockfile = this.readLockfile();
    lockfile.packages[packageName] = {
      version,
      installedAt: new Date().toISOString(),
      files,
    };
    this.writeLockfile(lockfile);
  }

  public removePackage(packageName: string): boolean {
    const lockfile = this.readLockfile();
    if (!lockfile.packages[packageName]) {
      return false;
    }
    delete lockfile.packages[packageName];
    this.writeLockfile(lockfile);
    return true;
  }

  public getInstalledPackages(): Record<string, LockfilePackageEntry> {
    return this.readLockfile().packages;
  }
}
