# Task D: Client MCP Server, CLI Init, & Native IBM Bob IDE Integration

## 1. Overview & Objectives
This document details the completed implementation of the **Global CLI Initializer** (`bob-marketplace init`) and the **Local stdio MCP Server** (`packages/mcp-server`), providing zero-friction integration directly inside the native **IBM Bob IDE** chat panel.

---

## 2. Completed Architecture & Deliverables

### A. Global CLI Setup (`packages/cli/bin/bob-marketplace.js`)
- Executable via `node packages/cli/bin/bob-marketplace.js` (or `npx bob-marketplace init`).
- Automatically targets and provisions `~/.bob/settings/`:
  1. **`~/.bob/settings/mcp.json`**:
     - Registers MCP server `marketplace` with command `npx -y tsx /path/to/packages/mcp-server/src/index.ts`.
     - Injects `alwaysAllow: ["add_package", "remove_package", "list_packages"]` to eliminate annoying permission popups during chat operations.
     - Preserves existing custom servers configured by the user.
  2. **`~/.bob/settings/custom_modes.yaml`**:
     - Injects custom mode `@marketplace` with role definition guiding Bob to invoke `add_package`, `remove_package`, and `list_packages`.
     - Assigns capability groups `[read, mcp, skill]`.

### B. Core Local MCP Server (`packages/mcp-server/src/`)
1. **Dynamic Workspace Detector & Protocol Transport (`index.ts`)**:
   - Built on `@modelcontextprotocol/sdk`.
   - Runs via standard `stdio` transport.
   - Detects `BOB_WORKSPACE_ROOT` or active process working directory dynamically.
2. **Safe Filesystem Writer (`safeWriter.ts`)**:
   - Strictly enforces that extracted files land within `.bob/` of the active workspace.
   - Rejects parent traversal (`../`) and path escapes.
   - Recursively cleans up empty parent directories upon package removal.
3. **Lockfile Manager (`lockfileManager.ts`)**:
   - Maintains `.bob/.marketplace-lock.json` in the user's active workspace.
   - Tracks package version, installation timestamp, and array of physical extracted files.

### C. MCP Tools Specification
1. **`add_package({ name })`**:
   - Fetches `.tar.gz` bundle from Supabase Storage CDN.
   - Unpacks archive in memory via `tar.Parser`.
   - Maps declared files to `.bob/` targets.
   - Writes lockfile and returns installation summary with slash command usage hints (`/${name} run`).
2. **`remove_package({ name })`**:
   - Reads installed file records from `.bob/.marketplace-lock.json`.
   - Deletes target files and cleans up empty folders.
   - Prunes package record from lockfile.
3. **`list_packages()`**:
   - Reads lockfile and outputs an overview of all active extensions in the workspace.

---

## 3. Verification & Acceptance Test Results

| Test Item | Command / Check | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CLI Init Execution** | `node packages/cli/bin/bob-marketplace.js` | Modifies `~/.bob/settings/mcp.json` and `custom_modes.yaml` | Successfully created/updated both files | **PASSED** |
| **MCP Config Validation** | Read `~/.bob/settings/mcp.json` | Contains `"marketplace"` with `alwaysAllow` | Verified valid JSON structure | **PASSED** |
| **Custom Mode Validation** | Read `~/.bob/settings/custom_modes.yaml` | Contains mode `marketplace` with roleDefinition | Verified valid YAML structure | **PASSED** |
| **Safe Extraction & Lockfile** | Sandbox write/delete test | Writes to `.bob/`, records lockfile, cleanly unlinks on delete | All assertions passed | **PASSED** |
