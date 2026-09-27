# Task A: Setup Environment & Supabase Database Infrastructure

## 1. Overview & Objectives
This document details the completed setup of the database, storage, and environment variables for **Bob Marketplace** on Supabase project `loykzqjybsvuiflhosoe`.

---

## 2. Completed Deliverables

### A. Environment Configuration (`.env.local`)
The `.env.local` file has been created at the root directory and contains verified credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: `https://loykzqjybsvuiflhosoe.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Legacy JWT anon key for public catalog discovery in Next.js client.
- `SUPABASE_SERVICE_ROLE_KEY`: Secret service_role key for backend package publish and gateway operations.
- `SUPABASE_PROJECT_REF`: `loykzqjybsvuiflhosoe`
- `SUPABASE_ACCESS_TOKEN`: Supabase personal access token (`sbp_...`) for automated management workflows.

### B. Relational Database Schema Execution (PostgreSQL DDL)
The relational schema and indexes were executed directly on the Supabase database:
1. **`public.publishers`**:
   - Stores publisher identity linked to GitHub OAuth (`id`, `github_id`, `username`, `display_name`, `avatar_url`, `bio`, timestamps).
2. **`public.packages`**:
   - Core package registry catalog (`id`, `name`, `display_name`, `description`, `repo_url`, `publisher_id`, `latest_version`, `category`, `tags`, `downloads`, `is_verified`, timestamps).
3. **`public.package_versions`**:
   - Release history and immutable manifest snapshot (`id`, `package_id`, `version`, `manifest` JSONB, `bundle_url`, `readme_content`, `changelog`, timestamps).
4. **Performance Indexes**:
   - `idx_packages_name` on `packages(name)`
   - `idx_packages_downloads` on `packages(downloads DESC)`
   - `idx_packages_category` on `packages(category)`
   - `idx_package_versions_package_id` on `package_versions(package_id)`
5. **Row Level Security (RLS)**:
   - Enabled on `publishers`, `packages`, and `package_versions`.
   - Public `SELECT` allowed for `anon` and `authenticated` roles.
   - `INSERT`, `UPDATE`, `DELETE` operations restricted to `service_role` (Registry Gateway Backend).

### C. Supabase Storage Configuration (`packages-bundle`)
- **Bucket Name**: `packages-bundle`
- **Public Access**: `true` (Allows high-speed direct CDN downloads for IBM Bob IDE client via `@marketplace add`).
- **File Size Limit**: `10MB` (10485760 bytes).
- **Allowed MIME Types**: `application/gzip`, `application/x-tar`, `application/zip`, `application/octet-stream`.
- **Validation**: Verified with end-to-end upload of a test bundle via service_role and verified instant public CDN download via HTTP GET.

### D. Supabase Auth Configuration
- GitHub OAuth provider state checked: Currently disabled (`external_github_enabled: false`).
- Callback URL required for GitHub OAuth registration:
  - Development: `http://localhost:3000/auth/callback`
  - Supabase Auth Callback: `https://loykzqjybsvuiflhosoe.supabase.co/auth/v1/callback`
  - Production: `https://ibmbob.vercel.app/auth/callback`
- Note: Can be configured with GitHub OAuth App Client ID & Secret during Task C integration.

---

## 3. Verification & Acceptance Test Results

| Check Item | Command / API Call | Expected Output | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| Table Creation Verification | `information_schema.tables WHERE table_schema = 'public'` | 3 tables (`publishers`, `packages`, `package_versions`) | Returns all 3 tables | **PASSED** |
| Storage Bucket Creation | `POST /storage/v1/bucket` | `{"name":"packages-bundle"}` | HTTP 200 `{"name":"packages-bundle"}` | **PASSED** |
| Storage Public Download CDN | `GET /storage/v1/object/public/packages-bundle/...` | Direct public download without auth | HTTP 200 with matching bytes | **PASSED** |
| `.env.local` Setup | File exists at workspace root and in `.gitignore` | Credentials present and hidden from git | Verified `.gitignore` covers `.env.local` | **PASSED** |
