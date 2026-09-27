# Task D: Client MCP Server, CLI Init, & Native IBM Bob IDE Integration

## 1. Module Objective
Build a client integration module based on the **Model Context Protocol (MCP)** and a zero-friction CLI interface initialized instantly with a single command:
```bash
npx bob-marketplace init
```
This command automatically configures IBM Bob IDE at the **Global Settings** level (`~/.bob/settings/`), enabling in-IDE capabilities:
- `@marketplace add <name>`
- `@marketplace remove <name>`
- `@marketplace list`
to function out-of-the-box across any project directory opened by developers in IBM Bob IDE without repetitive per-project setup.

---

## 2. Communication Architecture & Native Bob IDE Integration

```text
+---------------------------------------------------------------------------------+
|                       1. ONE-TIME TERMINAL INITIALIZATION                       |
|                     User executes: "npx bob-marketplace init"                   |
+---------------------------------------+-----------------------------------------+
                                        | (Writes user-scoped global configurations)
                                        v
+---------------------------------------------------------------------------------+
|                       GLOBAL DIRECTORY: ~/.bob/settings/                        |
|   1. ~/.bob/settings/mcp.json          -> Registers MCP Server "marketplace"    |
|   2. ~/.bob/settings/custom_modes.yaml -> Registers Custom Mode "@marketplace"  |
+---------------------------------------+-----------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v (Opened in Project A)                       v (Opened in Project B)
+----------------------------------+         +------------------------------------+
|         IBM Bob IDE              |         |            IBM Bob IDE             |
|   Chat: "@marketplace add sample"|         |   Chat: "@marketplace add sample"  |
+-----------------+----------------+         +-----------------+------------------+
                  |                                            |
                  +---------------------+----------------------+
                                        | (Invokes MCP Tools via stdio)
                                        v
+---------------------------------------------------------------------------------+
|                  LOCAL MCP SERVER (packages/mcp-server)                         |
|   - Dynamically detects active project workspace root                           |
|   - Downloads package bundle from Next.js Registry / Supabase Storage CDN       |
|   - Extracts target files into the active project's .bob/ directory             |
|   - Records status in .bob/.marketplace-lock.json on the active project         |
+---------------------------------------------------------------------------------+
```

---

## 3. Technical Deliverables (Executable Sub-tasks)

### D.1 Build Global CLI Initializer (`packages/cli`)
- **Description**: Lightweight CLI command responsible for registering Bob Marketplace globally into the user's IBM Bob environment.
- **Execution Command**: `npx bob-marketplace init`.
- **Automated Provisioning Logic**:
  1. Detect user home configuration path (`~/.bob/settings/`).
  2. Create directory `~/.bob/settings/` if it does not already exist.
  3. **Global MCP Server Configuration (`~/.bob/settings/mcp.json`)**:
     - Read existing JSON file to preserve user-defined servers.
     - Inject `marketplace` server block:
       ```json
       {
         "mcpServers": {
           "marketplace": {
             "command": "npx",
             "args": ["-y", "bob-marketplace-mcp"],
             "env": {
               "BOB_MARKETPLACE_URL": "https://ibmbob.vercel.app/api/v1"
             },
             "alwaysAllow": ["add_package", "remove_package", "list_packages"],
             "disabled": false
           }
         }
       }
       ```
  4. **Global Custom Mode Configuration (`~/.bob/settings/custom_modes.yaml`)**:
     - Read and parse existing YAML file.
     - Inject `marketplace` custom mode:
       ```yaml
       customModes:
         - slug: marketplace
           name: 🏪 Marketplace
           description: Official package manager to install and manage AI extensions in IBM Bob.
           roleDefinition: You are the Bob Marketplace Package Manager. Always use the marketplace MCP tools (add_package, remove_package, list_packages) to perform operations. Present concise, helpful confirmation messages.
           groups:
             - read
             - mcp
             - skill
       ```
  5. Provide formatted terminal feedback with step-by-step verification markers and Bob IDE usage hints.
- **Acceptance Criteria**:
  - Running `npx bob-marketplace init` updates `~/.bob/settings/mcp.json` and `~/.bob/settings/custom_modes.yaml` atomically.

---

### D.2 Core Local MCP Server (`packages/mcp-server`)
- **Description**: Stdio-based server powered by `@modelcontextprotocol/sdk`.
- **Core Features**:
  - **Dynamic Workspace Detector**: Identifies the active working directory opened in IBM Bob IDE via process working directory or MCP context headers.
  - **Safe Filesystem Writer**: Handles recursive directory creation and strictly enforces sandbox path validation during package extraction.
  - **Lockfile Manager**: Manages `.bob/.marketplace-lock.json` in each active workspace to track installed package versions and file manifests.
- **Acceptance Criteria**:
  - MCP server establishes a reliable JSON-RPC handshake over stdio transport.

---

### D.3 Implement MCP Tool `add_package({ name })`
- **Description**: Installs extensions from the marketplace into the active project workspace.
- **Execution Flow**:
  1. Receive argument `{ name: string }` from Bob IDE chat panel.
  2. Send HTTP GET request to `${REGISTRY_URL}/packages/${name}/download`.
  3. Stream-unpack `.tar.gz` bundle archive in memory and parse `bob-package.json`.
  4. Iterate through manifest `files`:
     - Inspect target destination (`dest`).
     - Write physical file contents directly into the target path inside the active workspace (e.g., `.bob/skills/sample/SKILL.md`).
  5. Record installation state in `.bob/.marketplace-lock.json`:
     ```json
     {
       "packages": {
         "sample": {
           "version": "1.0.0",
           "installedAt": "2026-09-26T05:00:00.000Z",
           "files": [".bob/skills/sample/SKILL.md"]
         }
       }
     }
     ```
  6. Return a clean confirmation message to the Bob IDE chat panel indicating available slash commands.
- **Acceptance Criteria**:
  - `@marketplace add sample` creates physical skill files in `.bob/skills/sample/` and updates the local lockfile.

---

### D.4 Implement MCP Tool `remove_package({ name })`
- **Description**: Uninstalls packages cleanly without leaving orphan files or lingering configs.
- **Execution Flow**:
  1. Receive argument `{ name: string }` from Bob IDE chat panel.
  2. Read `.bob/.marketplace-lock.json` in the active workspace.
  3. If package is not recorded, return a friendly warning.
  4. If found:
     - Iterate through declared installed `files`.
     - Delete each physical file from `.bob/`.
     - Recursively prune empty parent directories.
     - Remove package record from `.bob/.marketplace-lock.json`.
  5. Return uninstallation confirmation to the Bob IDE chat panel.
- **Acceptance Criteria**:
  - `@marketplace remove sample` removes target files, prunes empty directories, and removes the package entry from the lockfile.

---

### D.5 Implement MCP Tool `list_packages()`
- **Description**: Displays a summary of extensions currently installed in the active workspace.
- **Execution Flow**:
  1. Read `.bob/.marketplace-lock.json` in the active project.
  2. If empty, return a message indicating no extensions are installed.
  3. If present, format installed package names, versions, and file counts into a clean markdown table/list.
- **Acceptance Criteria**:
  - `@marketplace list` accurately outputs installed extensions in the Bob IDE chat interface.

---

## 4. Module Readiness Checklist
- [x] D.1: CLI `npx bob-marketplace init` configures `~/.bob/settings/` globally.
- [x] D.2: Local MCP Server compiles and operates reliably over stdio transport.
- [x] D.3: Tool `add_package` downloads, unpacks, and records lockfile.
- [x] D.4: Tool `remove_package` unlinks files and prunes empty directories.
- [x] D.5: Tool `list_packages` lists active workspace extensions in Bob chat.
