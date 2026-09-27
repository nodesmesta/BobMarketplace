# Task F: End-to-End Testing & Hackathon Regulation Verification

## 1. Module Objective
Validate the entire lifecycle of the **Bob Marketplace** ecosystem end-to-end directly within the native **IBM Bob IDE** execution environment. Testing encompasses global initialization via CLI, interactive chat panel operations (`@marketplace add`, `/sample run`, `@marketplace remove`), network failure resilience, and strict adherence to official IBM hackathon regulations regarding verified Bob IDE usage via task session consumption screenshots in the `bob_sessions/` directory.

---

## 2. End-to-End Test Matrix (E2E Test Matrix)

| Test ID | Component | Command / Action | Expected Result | Pass Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Global CLI Setup | Run `npx bob-marketplace init` in terminal | Global files `~/.bob/settings/mcp.json` and `custom_modes.yaml` created/updated | Exit code 0, success message, valid syntax |
| **TC-02** | Bob IDE Discovery | Open IBM Bob IDE in any new workspace | Mode `@marketplace` detected in chat dropdown and MCP server active | Mode `@marketplace` appears without manual per-project setup |
| **TC-03** | Package Install | Type `@marketplace add sample` in chat panel | MCP Tool `add_package` downloads bundle, extracts `.bob/skills/sample/SKILL.md`, creates `.bob/.marketplace-lock.json` | Skill file created in workspace, Bob responds with confirmation |
| **TC-04** | Skill Invocation | Type `/sample run` in Bob IDE chat panel | Bob IDE executes skill instructions, inspects workspace architecture, and outputs project summary | Accurate, structured repository analysis rendered in chat |
| **TC-05** | Package Removal | Type `@marketplace remove sample` in chat panel | MCP Tool `remove_package` removes `.bob/skills/sample/` cleanly and updates lockfile | Skill directory removed, other `.bob/` files preserved |
| **TC-06** | Error Handling | Type `@marketplace add non-existent-package-xyz` | MCP Server returns friendly, clear error message | No crash, Bob notifies user that package is not found |

---

## 3. Technical Deliverables (Executable Sub-tasks)

### F.1 Global CLI Setup Verification (`npx bob-marketplace init`)
- **Description**: Verify the initialization command executes reliably across diverse terminal environments without manual intervention.
- **Verification Steps**:
  1. Inspect or backup `~/.bob/settings/` (if present).
  2. Open terminal and run: `npx bob-marketplace init`.
  3. Validate file contents:
     - `~/.bob/settings/mcp.json`: Ensure `"marketplace"` block is registered with appropriate Node/TSX execution args.
     - `~/.bob/settings/custom_modes.yaml`: Ensure custom mode `marketplace` is declared with role `Bob Marketplace Assistant`.
- **Acceptance Criteria**:
  - Command executes with exit code 0 without path permission exceptions.
  - JSON and YAML files pass syntax validation.

---

### F.2 IBM Bob IDE Chat Integration Verification (`@marketplace add`)
- **Description**: Test the installation flow of the `sample` package directly from the conversational interface of IBM Bob IDE.
- **Verification Steps**:
  1. Open IBM Bob IDE in a test workspace directory.
  2. In the chat prompt, enter:
     ```text
     @marketplace add sample
     ```
  3. Observe MCP server logs and Bob AI assistant response.
- **Acceptance Criteria**:
  - File `.bob/skills/sample/SKILL.md` is created in the project workspace.
  - File `.bob/.marketplace-lock.json` records `sample` at version `1.0.0`.
  - AI Assistant returns confirmation with `/sample run` usage instructions.

---

### F.3 AI Skill Execution Verification (`/sample run`)
- **Description**: Verify that the newly installed skill is recognized and executed natively by IBM Bob IDE without requiring an IDE restart.
- **Verification Steps**:
  1. In the active Bob IDE chat panel, enter the slash command:
     ```text
     /sample run
     ```
  2. Observe Bob's autonomous workspace inspection behavior.
- **Acceptance Criteria**:
  - IBM Bob recognizes the `/sample run` slash command.
  - Bob inspects directory structure and core configuration files (`package.json`, architecture, etc.).
  - Bob outputs a comprehensive, structured codebase analysis report in the chat panel.

---

### F.4 Package Removal Verification (`@marketplace remove`)
- **Description**: Verify extension uninstallation to guarantee complete workspace hygiene.
- **Verification Steps**:
  1. In the Bob IDE chat panel, enter:
     ```text
     @marketplace remove sample
     ```
  2. Inspect filesystem structure inside `.bob/`.
- **Acceptance Criteria**:
  - Directory `.bob/skills/sample/` is cleanly unlinked.
  - Key `sample` is pruned from `.bob/.marketplace-lock.json`.
  - Unrelated project files remain completely untouched.

---

### F.5 Official IBM Hackathon Regulation Verification (`bob_sessions/`)
- **Description**: Fulfill mandatory hackathon evaluation criteria proving native development and testing inside IBM Bob IDE via Task Session consumption screenshots.
- **Verification Steps**:
  1. Inside IBM Bob IDE, open the **Task Sessions** panel or token consumption tracking interface.
  2. Capture high-resolution screenshots displaying:
     - Official IBM Bob IDE window header.
     - Active `@marketplace` conversational interaction.
     - Task Session Consumption Summary metrics panel.
  3. Create directory `bob_sessions/` at the repository root.
  4. Save screenshots in lossless PNG format:
     - `bob_sessions/session-01-marketplace-init.png`
     - `bob_sessions/session-02-package-install.png`
     - `bob_sessions/session-03-skill-execution.png`
- **Acceptance Criteria**:
  - Directory `bob_sessions/` contains high-resolution verification PNG files.
  - Fulfills official IBM hackathon jury eligibility criteria.

---

## 4. Module Readiness Checklist
- [x] F.1: Command `npx bob-marketplace init` passes global setup verification.
- [x] F.2: Package installation via `@marketplace add sample` verified in IBM Bob IDE.
- [x] F.3: Slash command execution `/sample run` yields valid architectural analysis.
- [x] F.4: Package removal via `@marketplace remove sample` verified clean.
- [x] F.5: Bob IDE session screenshots preserved in `bob_sessions/`.
