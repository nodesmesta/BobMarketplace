# Task C: Frontend Web Portal & Vercel Deployment

## Status: COMPLETED

## 1. Overview
The Bob Marketplace frontend is a high-performance web portal built with Next.js 14 App Router, NextUI / Tailwind CSS, Framer Motion, and Tabler Icons, featuring a dark developer aesthetic inspired by IBM Carbon Design System (#0B0D11 background, #161922 surfaces, #0F62FE IBM Blue accents).

Live Production URL: https://ibmbob.vercel.app

---

## 2. Architecture & Route Groups

The portal is organized into three distinct route groups with dedicated layouts:

```
app/
├── layout.tsx                     # Root Layout: Theme provider, dark theme, IBM Plex Sans fonts
├── providers.tsx                  # NextUI Provider & client theme context
│
├── (auth)/                        # Minimalist centered layout for authentication
│   ├── layout.tsx                 # Focused header, no sidebars, distraction-free
│   └── login/page.tsx             # Centered card with GitHub OAuth via Supabase Auth
│
├── (marketplace)/                 # Public Catalog & Discovery
│   ├── layout.tsx                 # Global Navbar with search shortcut, Category Sidebar, Footer
│   ├── page.tsx                   # Interactive hero, live search bar, category chips, package cards
│   ├── marketplace/page.tsx       # Direct route alias to catalog
│   └── packages/[name]/page.tsx   # Package detail view with README markdown, Manifest tabs, Install snippet
│
└── (dashboard)/                   # Authenticated Publisher Workspace
    ├── layout.tsx                 # Workspace layout with developer profile sidebar and quick links
    ├── dashboard/page.tsx         # Publisher metrics (total packages, total downloads), package management table
    └── publish/page.tsx           # One-step repository inspector & publisher form via GitHub URL
```

---

## 3. Key Components & Implementation

1. **Dark Developer Theme**:
   - Background: `#0B0D11` (Deep dark slate)
   - Surface/Card: `#161922` (Elevated dark card with subtle borders)
   - Primary Accent: `#0F62FE` (IBM Digital Blue)
   - Secondary Accent: `#8A3FFC` (IBM Purple / AI mode indicator)

2. **Live Supabase SSR Authentication & GitHub OAuth**:
   - Integrated `@supabase/ssr` `createBrowserClient` and `createServerClient` with cookie-based session synchronization.
   - GitHub OAuth provider configured with live callback route `/auth/callback` which automatically synchronizes developer profiles into `public.publishers`.
   - Dynamic user avatar and dropdown navigation (`components/NavbarUser.tsx`) with real-time auth state (`getUser`, `onAuthStateChange`, and `signOut`).

3. **Strict Repository Ownership Verification**:
   - Client-side live validator on `/publish`: validates that the repository owner in `repoUrl` matches the authenticated user's GitHub username (`@username`), disabling publishing if an ownership mismatch occurs.
   - Server-side guard on `POST /api/v1/publish`: authenticates callers via session cookies/tokens and rejects attempts to publish repositories not owned by the authenticated GitHub user with HTTP 403.
   - Read-only locked publisher identity prevents impersonation.

4. **Modular Agentic Taxonomy & Database Synchronization**:
   - Expanded package categories from generic types to full modern agentic ecosystem taxonomy:
     - `agent`: Autonomous Agents & Personas
     - `skill`: Skills & Slash Commands
     - `plugin`: Plugins & Bundles
     - `tool`: Custom Function Tools & Scripts
     - `mcp`: Model Context Protocol Servers
     - `hook`: Lifecycle Triggers & Hooks
     - `rule`: Rules & Guardrails (.bobrules)
     - `config`: Presets & Workspace Configurations
   - Synchronized across Zod schema validator (`lib/gateway/schema.ts`), Discovery API (`app/api/v1/packages/route.ts`), and Supabase PostgreSQL `packages(category)` index.

5. **Clean Separation of Layouts & Single CLI Banner**:
   - **Marketplace Layout (Public Catalog Explorer)**:
     - Pure public discovery focus: displays public extensions without personal workspace clutter.
     - Single non-intrusive CLI Banner (`components/CliBanner.tsx`) placed **directly below the top navbar**, completely removing duplicate CLI snippets from the Hero and Sidebar.
     - Docked left catalog sidebar (`components/MarketplaceSidebar.tsx`) displaying all 8 categories with live filtering.
   - **Dashboard Layout (Authenticated Publisher Workspace)**:
     - Strict isolation: protected by Edge Middleware (`HTTP 307` redirect to `/login` for unauthenticated requests).
     - Dedicated left publisher sidebar (`components/DashboardSidebar.tsx`) with verified GitHub identity, *My Packages*, *Publish New Package*, storage CDN status, and Sign Out control.
     - Contextual breadcrumbs (`Publisher Workspace > My Packages / Publish`).

6. **Edge Authentication Middleware (`middleware.ts`)**:
   - Protects sensitive workspace routes (`/dashboard`, `/publish`) at the edge before any page rendering occurs.
   - Inspects Supabase session cookies via `createServerClient`.
   - Automatically issues `HTTP 307` redirect to `/login?next=${pathname}` when an unauthenticated request is detected.
   - If an authenticated user accesses `/login`, automatically redirects to their destination (`/dashboard` or `?next=`).

7. **Package Inspection & Publishing Flow**:
   - The `/publish` interface inspects public GitHub repositories in real-time, validates `bob-package.json`, and triggers backend packaging via `POST /api/v1/publish`.

8. **Production Deployment on Vercel**:
   - Production domain: `https://ibmbob.vercel.app`
   - Configured `.npmrc` with `legacy-peer-deps=true` for peer dependency resolution.
   - Connected Environment Variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Tested public endpoints:
     - Homepage: `GET https://ibmbob.vercel.app/` -> HTTP 200
     - Catalog API: `GET https://ibmbob.vercel.app/api/v1/packages` -> HTTP 200 JSON
     - Package Detail: `GET https://ibmbob.vercel.app/packages/sample` -> HTTP 200 HTML
