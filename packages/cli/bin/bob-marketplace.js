#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const YAML = require("yaml");

async function init() {
  console.log("------------------------------------------------------------------");
  console.log("  IBM Bob 2.0 - Bob Marketplace Global Configuration Initializer  ");
  console.log("------------------------------------------------------------------");

  const homeDir = os.homedir();
  const bobSettingsDir = path.join(homeDir, ".bob", "settings");
  const mcpConfigPath = path.join(bobSettingsDir, "mcp.json");
  const modesConfigPath = path.join(bobSettingsDir, "custom_modes.yaml");

  // Ensure ~/.bob/settings directory exists
  if (!fs.existsSync(bobSettingsDir)) {
    fs.mkdirSync(bobSettingsDir, { recursive: true });
    console.log(`[+] Created directory: ${bobSettingsDir}`);
  }

  // 1. Update ~/.bob/settings/mcp.json
  console.log("[*] Configuring Global MCP Server (~/.bob/settings/mcp.json)...");
  let mcpConfig = { mcpServers: {} };
  if (fs.existsSync(mcpConfigPath)) {
    try {
      mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
      if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
    } catch {
      mcpConfig = { mcpServers: {} };
    }
  }

  const bobMarketplaceDir = path.join(homeDir, ".bob", "marketplace");
  if (!fs.existsSync(bobMarketplaceDir)) {
    fs.mkdirSync(bobMarketplaceDir, { recursive: true });
    console.log(`[+] Created directory: ${bobMarketplaceDir}`);
  }

  // Determine source MCP server bundle (packaged or dev fallback)
  const localBundle = path.join(__dirname, "../server/index.js");
  const devBundle = path.resolve(__dirname, "../../../packages/mcp-server/dist/index.js");
  const targetServerBundle = path.join(bobMarketplaceDir, "server.js");

  if (fs.existsSync(localBundle)) {
    fs.copyFileSync(localBundle, targetServerBundle);
    console.log(`[+] Installed MCP server runtime to: ${targetServerBundle}`);
  } else if (fs.existsSync(devBundle)) {
    fs.copyFileSync(devBundle, targetServerBundle);
    console.log(`[+] Installed MCP server runtime (from dev) to: ${targetServerBundle}`);
  } else {
    throw new Error(`MCP server bundle not found at ${localBundle} or ${devBundle}`);
  }

  mcpConfig.mcpServers["marketplace"] = {
    command: "node",
    args: [targetServerBundle],
    env: {
      BOB_MARKETPLACE_URL: "https://loykzqjybsvuiflhosoe.supabase.co/storage/v1/object/public/packages-bundle"
    },
    alwaysAllow: ["add_package", "remove_package", "list_packages"],
    disabled: false
  };

  fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), "utf-8");
  console.log("    [OK] Server 'marketplace' registered in mcp.json");

  // 2. Update ~/.bob/settings/custom_modes.yaml
  console.log("[*] Configuring Global Custom Mode (~/.bob/settings/custom_modes.yaml)...");
  let modesConfig = { customModes: [] };
  if (fs.existsSync(modesConfigPath)) {
    try {
      const parsed = YAML.parse(fs.readFileSync(modesConfigPath, "utf-8"));
      if (parsed && Array.isArray(parsed.customModes)) {
        modesConfig = parsed;
      }
    } catch {
      modesConfig = { customModes: [] };
    }
  }

  // Remove existing marketplace mode if present to update cleanly
  modesConfig.customModes = modesConfig.customModes.filter((m) => m.slug !== "marketplace");

  // Inject official marketplace mode with comprehensive permission groups
  modesConfig.customModes.push({
    slug: "marketplace",
    name: "Marketplace",
    description: "Official Package Manager to discover, install, and manage AI extensions in IBM Bob 2.0.",
    roleDefinition: "You are the Bob Marketplace Package Manager. Always use the marketplace MCP tools (add_package, remove_package, list_packages) to perform operations requested by the user. Keep messages concise and helpful.",
    groups: ["read", "edit", "execute", "mcp", "skill"]
  });

  fs.writeFileSync(modesConfigPath, YAML.stringify(modesConfig), "utf-8");
  console.log("    [OK] Custom Mode '@marketplace' registered with [read, edit, execute, mcp, skill]");

  console.log("\n------------------------------------------------------------------");
  console.log("SUCCESS: Bob Marketplace is now globally initialized for IBM Bob!");
  console.log("Open any project in IBM Bob IDE and use in chat panel:");
  console.log("  - @marketplace add <name>     (e.g., @marketplace add sample)");
  console.log("  - @marketplace list");
  console.log("  - @marketplace remove <name>  (e.g., @marketplace remove sample)");
  console.log("------------------------------------------------------------------");
}

init().catch((err) => {
  console.error("Initialization failed:", err);
  process.exit(1);
});
