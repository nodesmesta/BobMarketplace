# Task B: Backend Development, Registry API & Gateway Manager (Next.js App Router)

## 1. Module Objective
Build a centralized registry backend using **Next.js App Router (Route Handlers)** equipped with a robust **Registry Gateway Manager**. This module acts as the single, secure, generic, and modular entrypoint to serve package discovery, package bundle downloads for IBM Bob IDE clients, and automated GitHub repository importing for publishers without brittle static or hardcoded regex dependencies.

---

## 2. Standard Data Contract: Generic Manifest (`bob-package.json`)
Every package in Bob Marketplace must be *Self-Describing* via a declarative `bob-package.json` manifest. The Gateway never assumes static folder structures; instead, it dynamically reads generic file mapping declarations:

```json
{
  "name": "sample",
  "version": "1.0.0",
  "display_name": "Sample Codebase Explainer",
  "description": "An intelligent skill that inspects and dissects the active local workspace structure.",
  "author": "nodesemesta",
  "license": "MIT",
  "type": "skill",
  "files": [
    {
      "src": "skills/sample/SKILL.md",
      "dest": ".bob/skills/sample/SKILL.md",
      "type": "skill"
    }
  ],
  "permissions": [
    "read_workspace"
  ],
  "keywords": ["onboarding", "explainer", "codebase"]
}
```

---

## 3. Core Component: Registry Gateway Manager (`lib/gateway/`)
The Gateway Manager serves as an internal security guard and orchestration layer before requests interact with the Supabase database or storage:

1. **Security & Path Traversal Guard**:
   - Strictly enforces that every `dest` path declared in the manifest resides within safe workspace boundaries (only permitted within `.bob/` subpaths or approved configuration files).
   - Firmly rejects malicious target paths, including `../`, `/etc/`, absolute system paths, and hidden character sequences.
2. **Generic Manifest Validator**:
   - Utilizes schema-driven data validation (Zod) to ensure field completeness, semver format compliance, and exclusion of reserved namespace keywords (`admin`, `system`, `core`).
3. **Immutability & Release Guard**:
   - Ensures that published package versions are strictly immutable and cannot be overwritten. Updating an existing package requires incrementing to a new semantic version.
4. **Telemetry & Download Dispatcher**:
   - Increments download counters asynchronously without blocking or delaying client responses.

---

## 4. Technical Deliverables (Executable Sub-tasks)

### B.1 Next.js Project Initialization & Supabase Clients
- **Description**: Establish the Next.js foundation (TypeScript, App Router, Tailwind CSS) and dual-layer Supabase database adapters.
- **Execution Steps**:
  1. Initialize Next.js project in workspace.
  2. Install core dependencies: `@supabase/supabase-js`, `zod`, `tar`, `pako`.
  3. Configure dual-layer database adapters in `lib/supabase/`:
     - `supabaseClient.ts`: Utilizes `NEXT_PUBLIC_SUPABASE_ANON_KEY` for public catalog read queries.
     - `supabaseAdmin.ts`: Utilizes `SUPABASE_SERVICE_ROLE_KEY` for authorized write operations behind the Gateway.
- **Acceptance Criteria**:
  - Next.js development server runs (`npm run dev`) and successfully queries the Supabase database.

---

### B.2 Core Gateway Manager & Validator (`lib/gateway/`)
- **Description**: Construct the generic validation engine and security guardrails.
- **Constructed Modules**:
  - `lib/gateway/schema.ts`: Zod schema for `BobPackageManifest`.
  - `lib/gateway/securityGuard.ts`: Path traversal sanitizer and package name validator.
  - `lib/gateway/manifestEngine.ts`: In-memory manifest parser operating on stream buffers without hardcoded regex patterns.
- **Acceptance Criteria**:
  - Unit tests confirm acceptance of compliant manifests and rejection of malformed or malicious targets.

---

### B.3 Endpoint: `GET /api/v1/packages` (Catalog Discovery)
- **Description**: Expose a public REST API for package catalog discovery consumed by the Web Portal and Bob IDE chat interactions (`@marketplace list`).
- **Query Parameter Specifications**:
  - `q`: Free-text search matching `name` and `description`.
  - `type`: Filter by extension category (`skill`, `mode`, `rule`, `mcp`, etc.).
  - `sort`: Ordering options: `popular` (default, `downloads DESC`), `latest` (`created_at DESC`), `alphabetical`.
  - `page` & `limit`: Pagination controls (default limit: 20).
- **Response Format**:
  ```json
  {
    "success": true,
    "data": [
      {
        "name": "sample",
        "displayName": "Sample Codebase Explainer",
        "description": "...",
        "latestVersion": "1.0.0",
        "downloads": 42,
        "publisher": { "username": "nodesemesta", "avatarUrl": "..." }
      }
    ],
    "pagination": { "page": 1, "total": 1, "totalPages": 1 }
  }
  ```
- **Acceptance Criteria**:
  - Returns HTTP 200 OK with filtered and paginated catalog records.

---

### B.4 Endpoint: `GET /api/v1/packages/[name]` (Package Detail & Manifest)
- **Description**: Retrieve detailed package metadata, release information, and destination file mappings for a specified package slug.
- **Execution Flow**:
  1. Receive slug `name` from route params.
  2. Query `packages` table joined with latest `package_versions` and publisher details.
  3. Return HTTP 404 if the package does not exist.
- **Response Format**: Returns comprehensive package details, README markdown, and manifest `files` mapping.
- **Acceptance Criteria**:
  - Existing packages return HTTP 200 with complete metadata; non-existent packages return HTTP 404.

---

### B.5 Endpoint: `GET /api/v1/packages/[name]/download` (Gateway Download Dispatcher)
- **Description**: Handle package archive bundle requests from IBM Bob IDE clients during `@marketplace add <name>`.
- **Execution Flow**:
  1. Gateway verifies package existence and latest release bundle.
  2. Atomically increments download counter (`UPDATE packages SET downloads = downloads + 1 WHERE id = ...`).
  3. Returns an **HTTP 302 Redirect** directly pointing to the public Supabase Storage CDN URL for the `.tar.gz` bundle archive.
- **Acceptance Criteria**:
  - `curl -IL http://localhost:3000/api/v1/packages/sample/download` follows redirect to valid archive file and increments downloads.

---

### B.6 Engine: `POST /api/v1/publish` (Generic Repo Importer)
- **Description**: Automated ingestion engine importing public GitHub repositories directly into the Supabase registry.
- **Execution Flow**:
  1. Receive payload: `{ "repoUrl": "https://github.com/owner/repo" }`.
  2. Validate authenticated publisher session.
  3. Fetch repository tarball stream directly via GitHub REST API (`https://api.github.com/repos/{owner}/{repo}/tarball`).
  4. Stream-parse tarball in memory without temporary physical disk writes.
  5. Locate and validate `bob-package.json` using the Gateway Manager.
  6. Confirm all manifest-declared files are physically present in the tarball.
  7. Pack declared files into a standardized `.tar.gz` bundle archive.
  8. Upload bundle to Supabase Storage bucket `packages-bundle`.
  9. Persist package metadata into `packages` and `package_versions` tables.
- **Acceptance Criteria**:
  - Ingestion processes sample repository, uploads bundle to storage, and registers release in database.

---

## 5. Module Readiness Checklist
- [x] B.1: Next.js initialized and dual Supabase clients configured.
- [x] B.2: Zod schema & Gateway security guards implemented.
- [x] B.3: Endpoint `GET /api/v1/packages` active and tested.
- [x] B.4: Endpoint `GET /api/v1/packages/[name]` active and tested.
- [x] B.5: Download endpoint with 302 CDN redirect and counter increment tested.
- [x] B.6: Endpoint `POST /api/v1/publish` imports GitHub repositories into registry.
