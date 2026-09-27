# Task A: Setup Environment & Supabase Database Infrastructure

## 1. Module Objective
Provision and configure the relational PostgreSQL database infrastructure, public file storage (Supabase Storage), and GitHub OAuth authentication provider on Supabase to support the registry catalog, package versioning, and developer authentication for Bob Marketplace.

---

## 2. Architectural Integration Requirements
- **GitHub**: Acts as the identity provider (OAuth Provider) for package publishers.
- **Supabase**: Serves as the Single Source of Truth (package metadata database, `.tar.gz`/`.zip` bundle storage, and publisher authentication).
- **Next.js (Vercel)**: Acts as the primary consumer consuming Supabase URL, Anon Key, and Service Role Key across Task B and Task C.

---

## 3. Technical Deliverables (Executable Sub-tasks)

### A.1 Setup Supabase Project & Environment Credentials
- **Description**: Provision an active Supabase project instance and document all required credentials needed by the Next.js backend and database operations.
- **Required Credentials**:
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase REST/GraphQL endpoint.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API key for client-side queries in the Next.js frontend.
  - `SUPABASE_SERVICE_ROLE_KEY`: Secret private key bypassing RLS for backend registry operations when packaging and publishing extensions.
- **Execution Steps**:
  1. Create a new project in the Supabase dashboard (or configure an existing instance).
  2. Navigate to **Project Settings** -> **API**.
  3. Copy the URL, anon key, and service_role key into the project's `.env.local` environment file.
- **Acceptance Criteria**:
  - Verification script successfully pings and executes a basic query against the Supabase instance.

---

### A.2 Database Schema Design & SQL Execution
- **Description**: Design and execute relational PostgreSQL DDL scripts to create core registry tables with foreign keys, constraints, and performance indexes.
- **Table Schema Specifications**:

```sql
-- 1. Publishers Table (Stores publisher identity linked from GitHub OAuth)
CREATE TABLE IF NOT EXISTS public.publishers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Packages Table (Core entity for package catalog in marketplace)
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, -- unique slug, e.g., 'sample', 'owasp-auditor'
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    repo_url TEXT NOT NULL, -- source GitHub repository URL
    publisher_id UUID REFERENCES public.publishers(id) ON DELETE CASCADE,
    latest_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    category VARCHAR(50) DEFAULT 'utility', -- utility, testing, security, devops, etc.
    tags TEXT[] DEFAULT '{}',
    downloads INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Package Versions Table (Release history and manifest snapshots per version)
CREATE TABLE IF NOT EXISTS public.package_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    manifest JSONB NOT NULL, -- full snapshot of bob-package.json
    bundle_url TEXT NOT NULL, -- archive download URL in Supabase Storage
    readme_content TEXT, -- README.md markdown from repository
    changelog TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_package_version UNIQUE(package_id, version)
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_packages_name ON public.packages(name);
CREATE INDEX IF NOT EXISTS idx_packages_downloads ON public.packages(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_packages_category ON public.packages(category);
CREATE INDEX IF NOT EXISTS idx_package_versions_package_id ON public.package_versions(package_id);
```

- **Row Level Security (RLS) Policies**:
  - `publishers`, `packages`, `package_versions`: Allow public `SELECT` for `anon` and `authenticated` roles.
  - `INSERT`, `UPDATE`, `DELETE`: Restricted strictly to `service_role` (Next.js Registry Backend).
- **Acceptance Criteria**:
  - SQL script executes without error in Supabase SQL Editor.
  - Tables, relations, and indexes verified active in Supabase Table Editor.

---

### A.3 Supabase Storage Bucket Configuration (`packages-bundle`)
- **Description**: Configure a dedicated storage bucket named `packages-bundle` to host physical archive files (`.tar.gz` or `.zip`) for every published extension.
- **Bucket Specifications**:
  - **Bucket Name**: `packages-bundle`
  - **Public Access**: `true` (Enabled to allow IBM Bob IDE clients to download package archives directly via CDN without serverless compute overhead).
  - **File Size Limit**: `10MB` (10485760 bytes).
  - **Allowed MIME Types**: `application/gzip`, `application/x-tar`, `application/zip`, `application/octet-stream`.
- **Storage RLS Policies**:
  - `SELECT / READ`: Publicly accessible (`role: anon, authenticated`).
  - `INSERT / UPDATE / DELETE`: Restricted to `service_role`.
- **Acceptance Criteria**:
  - Bucket `packages-bundle` created and verified with a test upload returning a publicly accessible URL via HTTP GET.

---

### A.4 Supabase Auth Configuration with GitHub OAuth
- **Description**: Integrate the GitHub OAuth provider within the Supabase dashboard to enable one-click authentication for publishers prior to releasing extensions.
- **Configuration Steps**:
  1. Open **GitHub Developer Settings** -> **OAuth Apps** -> **New OAuth App**.
  2. Complete application registration:
     - **Application Name**: `Bob Marketplace`
     - **Homepage URL**: `https://<vercel-deployment-domain>` (or `http://localhost:3000` during local development).
     - **Authorization Callback URL**: `https://<project-id>.supabase.co/auth/v1/callback`.
  3. Obtain **Client ID** and generate a new **Client Secret** on GitHub.
  4. Navigate to **Supabase Dashboard** -> **Authentication** -> **Providers** -> **GitHub**.
  5. Enter Client ID and Client Secret, then enable the provider.
- **Acceptance Criteria**:
  - OAuth flow redirects to GitHub consent screen and successfully issues a valid session token upon return.

---

## 4. Module Readiness Checklist
- [x] A.1: Supabase project active, URL and Key credentials documented in `.env.local`.
- [x] A.2: SQL relational schema executed, tables and indexes verified.
- [x] A.3: Storage bucket `packages-bundle` provisioned with public read CDN policy.
- [x] A.4: GitHub OAuth provider configured and callback URL established.
