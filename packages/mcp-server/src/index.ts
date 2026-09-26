import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { LockfileManager } from "./lockfileManager.js";
import { SafeFilesystemWriter } from "./safeWriter.js";
import * as tar from "tar";
import { Readable } from "stream";

// Determine workspace root dynamically
const workspaceRoot = process.env.BOB_WORKSPACE_ROOT || process.cwd();
const REGISTRY_URL =
  process.env.BOB_MARKETPLACE_URL ||
  "https://loykzqjybsvuiflhosoe.supabase.co/storage/v1/object/public/packages-bundle";

const lockfileManager = new LockfileManager(workspaceRoot);
const safeWriter = new SafeFilesystemWriter(workspaceRoot);

const server = new Server(
  {
    name: "bob-marketplace",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 1. List Available Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add_package",
        description:
          "Installs an AI extension (Skill, Mode, Rule, MCP) from Bob Marketplace into the current project workspace.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The unique name/slug of the package to install (e.g. 'sample').",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "remove_package",
        description:
          "Uninstalls and cleanly removes an installed package from the current project workspace.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the package to remove.",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "list_packages",
        description:
          "Lists all packages currently installed in the active project workspace.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// 2. Call Tool Request Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "add_package") {
      const packageName = (args?.name as string)?.trim().toLowerCase();
      if (!packageName) {
        return {
          content: [{ type: "text", text: "Error: Package name is required." }],
          isError: true,
        };
      }

      // Download package bundle
      // Try configured storage bundle URL
      const bundleUrl = `${REGISTRY_URL}/${packageName}-1.0.0.tar.gz`;
      const res = await fetch(bundleUrl);

      if (!res.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Package '${packageName}' was not found in Bob Marketplace (Status: ${res.status}).`,
            },
          ],
          isError: true,
        };
      }

      const buffer = Buffer.from(await res.arrayBuffer());

      // Parse and extract files in memory
      const filesMap = new Map<string, Buffer>();
      let manifestRaw: string | null = null;

      const stream = Readable.from(buffer);
      const parser = new tar.Parser();

      await new Promise<void>((resolve, reject) => {
        parser.on("entry", (entry: any) => {
          let relPath = entry.path.replace(/^\.\//, "");
          const chunks: Buffer[] = [];
          entry.on("data", (c: Buffer) => chunks.push(c));
          entry.on("end", () => {
            if (entry.type === "File") {
              const fileData = Buffer.concat(chunks);
              filesMap.set(relPath, fileData);
              if (relPath === "bob-package.json") {
                manifestRaw = fileData.toString("utf-8");
              }
            }
          });
        });
        parser.on("end", () => resolve());
        parser.on("error", reject);
        stream.pipe(parser);
      });

      if (!manifestRaw) {
        return {
          content: [{ type: "text", text: "Error: Corrupted package archive (missing bob-package.json)." }],
          isError: true,
        };
      }

      const manifest = JSON.parse(manifestRaw);
      const installedFiles: string[] = [];

      for (const fileDecl of manifest.files) {
        const srcPath = fileDecl.src.replace(/^\.\//, "");
        const content = filesMap.get(srcPath);

        if (!content) {
          throw new Error(`File '${fileDecl.src}' declared in manifest but not found in archive.`);
        }

        const writtenPath = safeWriter.writeFile(fileDecl.dest, content);
        installedFiles.push(writtenPath);
      }

      // Update lockfile
      lockfileManager.recordInstalledPackage(packageName, manifest.version, installedFiles);

      const commandHints = manifest.files.some((f: any) => f.type === "skill")
        ? `\n\nUsage hint: Trigger slash command '/${packageName} run' in chat to execute this skill.`
        : "";

      return {
        content: [
          {
            type: "text",
            text: `Package '${packageName}' (v${manifest.version}) successfully installed into active workspace.${commandHints}\nInstalled files:\n${installedFiles.map((f) => `- ${f}`).join("\n")}`,
          },
        ],
      };
    }

    if (name === "remove_package") {
      const packageName = (args?.name as string)?.trim().toLowerCase();
      if (!packageName) {
        return {
          content: [{ type: "text", text: "Error: Package name is required." }],
          isError: true,
        };
      }

      const installedPackages = lockfileManager.getInstalledPackages();
      const pkgInfo = installedPackages[packageName];

      if (!pkgInfo) {
        return {
          content: [
            {
              type: "text",
              text: `Package '${packageName}' is not currently installed in this workspace.`,
            },
          ],
        };
      }

      // Delete files
      for (const file of pkgInfo.files) {
        safeWriter.deleteFile(file);
      }

      lockfileManager.removePackage(packageName);

      return {
        content: [
          {
            type: "text",
            text: `Package '${packageName}' has been cleanly removed from the active workspace.`,
          },
        ],
      };
    }

    if (name === "list_packages") {
      const installed = lockfileManager.getInstalledPackages();
      const names = Object.keys(installed);

      if (names.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No packages installed in this workspace yet. Use '@marketplace add <name>' to install extensions.",
            },
          ],
        };
      }

      const listOutput = names
        .map((pkgName) => {
          const item = installed[pkgName];
          return `* **${pkgName}** (v${item.version}) - Installed at: ${item.installedAt}\n  Files: ${item.files.join(", ")}`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `Installed packages in active workspace (${names.length}):\n\n${listOutput}`,
          },
        ],
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool '${name}'` }],
      isError: true,
    };
  } catch (err: any) {
    return {
      content: [{ type: "text", text: `Tool execution failed: ${err?.message || "Internal error"}` }],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch(console.error);
