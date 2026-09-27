# Summary & Product Specification

- **Product Name**: Bob Marketplace
- **Objective**: Build a centralized marketplace ecosystem and open-source package manager for IBM Bob 2.0 that allows developers to manage (install, remove, inspect) AI extensions (Skills, Modes, Rules, MCP Configs) directly from the IBM Bob IDE Chat Panel using natural interactions (`@marketplace add <name>`, `@marketplace remove <name>`, and `@marketplace list`), supplemented by a public Web Registry & Discovery Portal.
- **Tech Stack**:
  - **Web Portal & Registry API**: Next.js 14+ (App Router, Route Handlers, Tailwind CSS, HeroUI, Framer Motion, Tabler Icons, TypeScript) deployed to Vercel.
  - **Database & Storage**: Supabase (PostgreSQL for package catalog & metadata, Supabase Storage bucket `packages-bundle` for `.tar.gz` bundle archives, Supabase Auth via GitHub OAuth for publisher authentication).
  - **Client & Integration**: Global Setup CLI (`npx bob-marketplace init`) + Local stdio MCP Server + Custom Mode `@marketplace` (`~/.bob/settings/custom_modes.yaml` & `~/.bob/settings/mcp.json`).
- **Sample Package**: Local showcase package `sample/` with official `bob-package.json` manifest and an autonomous repository architecture analysis skill activated via slash command `/sample run`.

---

# Executable Tasks

### taskA: Environment Setup & Supabase Database Infrastructure
- [x] **A.1** Setup Supabase project (URL, Anon Key, Service Role Key).
- [x] **A.2** Design and execute relational PostgreSQL database schema:
  - Table `publishers` (id, github_id, username, display_name, avatar_url, bio, created_at, updated_at).
  - Table `packages` (id, name, display_name, description, repo_url, publisher_id, latest_version, category, tags, downloads, is_verified, created_at, updated_at).
  - Table `package_versions` (id, package_id, version, manifest, bundle_url, readme_content, changelog, created_at).
  - Query performance indexing and Row Level Security (RLS) policies.
- [x] **A.3** Setup Supabase Storage bucket (`packages-bundle`) with public read policy for low-latency CDN distribution.
- [x] **A.4** Configure Supabase Auth with GitHub OAuth provider (pre-configured callback URLs).

---

### TaskB: Backend Development, Registry API & Gateway Manager (Next.js App Router)
- [x] **B.1** Initialize Next.js project with TypeScript, Tailwind CSS, and dual-layer Supabase clients (`supabaseClient.ts` & `supabaseAdmin.ts`).
- [x] **B.2** Implement standard manifest parser & validator (`bob-package.json`) using Zod with strict path traversal sanitization.
- [x] **B.3** Construct API Endpoint `GET /api/v1/packages`: Return package catalog (free-text search, popularity sorting, category filtering, pagination).
- [x] **B.4** Construct API Endpoint `GET /api/v1/packages/[name]`: Return granular package metadata, README content, and latest version manifest.
- [x] **B.5** Construct API Endpoint `GET /api/v1/packages/[name]/download`: Dispatch HTTP 302 redirect to Supabase Storage CDN while asynchronously incrementing download metrics (`downloads++`).
- [x] **B.6** Construct API Engine `POST /api/v1/publish`:
  - Receive `{ repoUrl }` payload from GitHub-authenticated publisher.
  - Fetch repository tarball directly via GitHub API without local builds.
  - Parse and validate `bob-package.json`.
  - Package bundle archive, upload to Supabase Storage, and record metadata in database.

---

### taskC: Frontend Web Portal Development (Next.js on Vercel)
- [x] **C.1** Setup frontend interface with HeroUI, Tailwind CSS, Framer Motion, Tabler Icons, and IBM Carbon dark palette (#0B0D11, #161922, #0F62FE, #8A3FFC).
- [x] **C.2** Implement Route Groups & Dedicated Layouts:
  - `(auth)`: Centered, distraction-free GitHub login page.
  - `(marketplace)`: Landing page & Catalog Explorer with category filtering, search bar, interactive package cards, and detail pages (`/packages/[name]`) with markdown README tabs.
  - `(dashboard)`: Publisher dashboard (`/dashboard`) and release publishing form (`/publish`) with real-time GitHub URL validation.
- [x] **C.3** Integrate Supabase Auth session management using `@supabase/ssr`.
- [x] **C.4** Configure production deployment pipeline on Vercel platform.

---

### taskD: Client MCP Server, CLI Init & Native IBM Bob IDE Integration
- [x] **D.1** Build global CLI setup module: `npx bob-marketplace init` which automatically configures `~/.bob/settings/mcp.json` and `~/.bob/settings/custom_modes.yaml`.
- [x] **D.2** Build Local MCP Server (`bob-marketplace-mcp` via stdio transport).
- [x] **D.3** Implement MCP Tool `add_package({ name })`: Fetch bundle from registry CDN, unpack into active `.bob/` directory, and record `.bob/.marketplace-lock.json`.
- [x] **D.4** Implement MCP Tool `remove_package({ name })`: Cleanly unlink installed files from `.bob/`, prune empty directories, and update lockfile.
- [x] **D.5** Implement MCP Tool `list_packages()`: Render summary of all active extensions installed in the current user workspace.

---

### taskE: Local Showcase Package Creation (`sample/`)
- [x] **E.1** Create `sample/` package directory structure in project workspace.
- [x] **E.2** Author official manifest `sample/bob-package.json` (metadata, version 1.0.0, skill destination mapping).
- [x] **E.3** Author AI skill recipe `sample/skills/sample/SKILL.md` declaring `/sample run` slash command for autonomous workspace architecture analysis.
- [x] **E.4** Verify packaging format and validate bundle readiness for `sample/`.

---

### taskF: End-to-End Testing & Hackathon Regulation Verification
- [x] **F.1** Verify global CLI initialization via `npx bob-marketplace init`.
- [x] **F.2** Verify package installation via IBM Bob IDE chat prompt: `@marketplace add sample`.
- [x] **F.3** Verify AI skill execution via IBM Bob IDE slash command: `/sample run`.
- [x] **F.4** Verify package uninstallation via IBM Bob IDE chat prompt: `@marketplace remove sample`.
- [x] **F.5** Capture Task Session Consumption Summary screenshots from IBM Bob IDE and preserve them in `bob_sessions/` directory to fulfill IBM jury evaluation requirements.

---

### taskG: Final Documentation & Submission Assets
- [ ] **G.1** Author project whitepaper proposal and architecture diagrams in `data/proposal.md`.
- [ ] **G.2** Author 3-minute video demonstration script and visual storyboard in `data/video_script.md`.
- [ ] **G.3** Finalize and polish root repository `README.md` in standard professional English.
- [ ] **G.4** Prepare complete submission copy and metadata for LabLab.ai platform in `data/submission.md`.
