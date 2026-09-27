# Task C: Frontend Web Portal Development (Next.js, HeroUI, & Vercel)

## 1. Module Objective
Build a modern, responsive, production-ready public web portal for **Bob Marketplace**. The portal acts as an interactive showcase for discovering extensions, inspecting skill documentation, enabling publishers to release packages via public GitHub repository URLs, and facilitating seamless one-click authentication through GitHub OAuth.

---

## 2. Tech Stack Specifications
- **Framework**: Next.js 14+ (App Router, Server Components & Client Components).
- **Language**: TypeScript (Strict type checking).
- **Component Library**: **HeroUI** (`@heroui/react` / `@nextui-org/react`).
- **Styling**: Tailwind CSS integrated with HeroUI theme plugin (`@heroui/theme`).
- **Animation**: **Framer Motion** (smooth transition orchestrations).
- **Icons**: **Tabler Icons React** (`@tabler/icons-react`, `stroke={1.5}`) and **Lucide React**.
- **Auth**: `@supabase/ssr` (Next.js server-side auth helpers with cookie-based session synchronization).
- **State Management**: React Hooks & Context.
- **Markdown Rendering**: `react-markdown` + `rehype-highlight` (for source repository README rendering).
- **Deployment Platform**: **Vercel** (Global Edge Network).

---

## 3. Layout Architecture: Route Groups & Nested Layouts

To ensure specialized and focused User Experiences, the application is structured into **3 distinct Route Groups** with dedicated layout boundaries:

```text
app/
├── layout.tsx                   # Root Layout: HeroUI Provider, Global Fonts, Dark Theme
│
├── (auth)/                      # Group 1: Auth Pages (Clean Centered Layout)
│   ├── layout.tsx               # Minimalist header, NO sidebars, distraction-free
│   └── login/
│       └── page.tsx             # Centered GitHub OAuth authentication card
│
├── (marketplace)/               # Group 2: Public Explorer (Catalog Layout)
│   ├── layout.tsx               # Global Navbar + Taxonomy Sidebar + Global Footer
│   ├── page.tsx                 # Landing / Catalog Explorer
│   ├── marketplace/
│   │   └── page.tsx
│   └── packages/[name]/
│       └── page.tsx             # Package Details & Markdown README Tabs
│
└── (dashboard)/                 # Group 3: User Dashboard (Dashboard Layout)
    ├── layout.tsx               # Navbar + Publisher Sidebar + Minimal Footer
    ├── dashboard/
    │   └── page.tsx             # Publisher package management table & metrics
    └── publish/
        └── page.tsx             # GitHub repository publishing interface
```

---

## 4. Technical Deliverables (Executable Sub-tasks)

### C.1 Frontend Environment Setup & HeroUI Provider
- **Description**: Configure Next.js dependencies, Tailwind CSS, and the HeroUI Provider to ensure dark mode is enforced by default.
- **Execution Steps**:
  1. Install dependencies: `@heroui/react`, `framer-motion`, `@tabler/icons-react`, `lucide-react`, `@supabase/ssr`.
  2. Configure `tailwind.config.ts` to include `@heroui/theme` node modules.
  3. Wrap the application tree in `app/providers.tsx` using `HeroUIProvider`.
  4. Enforce `dark` theme class on the root `<html>` element.
- **Acceptance Criteria**:
  - HeroUI components (Buttons, Cards, Snippets) render cleanly with the IBM dark aesthetic palette.

---

### C.2 Implement Route Groups & Nested Layouts
- **Description**: Build 3 context-aware layouts:
  1. **Root Layout (`app/layout.tsx`)**: Global providers, IBM typography, and background colors.
  2. **Auth Layout (`app/(auth)/layout.tsx`)**: Distraction-free layout without sidebars or cluttered footers.
  3. **Marketplace Layout (`app/(marketplace)/layout.tsx`)**:
     - Global navbar with search shortcut (`Command+K`), navigation links, and auth controls.
     - Taxonomy sidebar supporting 8 extension categories (*All, Skills, Modes, Rules, MCP, Tools, Agents, Configs*).
     - Global footer with documentation, repository, and license links.
  4. **Dashboard Layout (`app/(dashboard)/layout.tsx`)**:
     - Navbar with verified publisher avatar.
     - Workspace sidebar (*My Packages, Stats, Publish New*).
- **Acceptance Criteria**:
  - Navigating between `/marketplace`, `/login`, and `/dashboard` switches layout structures smoothly without visual artifacts.

---

### C.3 Authentication Interface (`app/(auth)/login/page.tsx`)
- **Description**: Dedicated sign-in page for developers publishing or managing packages.
- **UI Elements**:
  - Centered HeroUI `Card` with Bob Marketplace branding.
  - Transparent description of requested OAuth permissions.
  - Primary Action: HeroUI `Button` "Continue with GitHub" triggering Supabase OAuth:
    ```typescript
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${location.origin}/auth/callback` }
    });
    ```
- **Acceptance Criteria**:
  - Button triggers GitHub OAuth consent flow and returns an authenticated user session.

---

### C.4 Marketplace Discovery & Catalog Interface (`app/(marketplace)/page.tsx`)
- **Description**: Main discovery portal showcasing extensions registered in the catalog.
- **Page Structure**:
  - **Hero Section**: Overview headline and interactive search bar with debounced input.
  - **Main Grid**: Fetches data from `GET /api/v1/packages`.
  - **Package Card (HeroUI Card)**:
    - `CardHeader`: Publisher avatar, package title, and category badge (`HeroUI Chip`).
    - `CardBody`: Concise summary of extension capabilities.
    - `CardFooter`: Total download counter and interactive `Snippet` with copy command:
      ```text
      @marketplace add <name>
      ```
- **Acceptance Criteria**:
  - Cards populate dynamically from database, real-time search functions accurately, and command snippets copy directly to clipboard.

---

### C.5 Package Detail Interface (`app/(marketplace)/packages/[name]/page.tsx`)
- **Description**: In-depth documentation, manifest specifications, and installation guides for a selected package.
- **Page Features**:
  - **Header Section**: Title, semantic version badge, maintainer username, source GitHub repository link, and direct bundle download button.
  - **Quick Install Box**: Interactive snippet for `@marketplace add <name>`.
  - **HeroUI Tabs**:
    - **"README" Tab**: Renders repository markdown documentation via `react-markdown` with syntax highlighting.
    - **"Manifest & Files" Tab**: Lists target installation paths within the user's `.bob/` workspace.
    - **"Versions" Tab**: Changelog history and release dates.
- **Acceptance Criteria**:
  - `/packages/sample` displays complete metadata, file mappings, and pristine README rendering.

---

### C.6 Publisher Dashboard (`app/(dashboard)/dashboard/page.tsx`)
- **Description**: Private workspace for authenticated creators to manage their published extensions.
- **Route Guard**: Protected by Edge Middleware (unauthenticated requests redirect to `/login`).
- **Dashboard Features**:
  - **Quick Metrics**: Summary cards displaying total published packages and cumulative download count.
  - **My Packages (HeroUI Table)**:
    - Columns: Package Name, Latest Version, Total Downloads, Release Date, and Actions.
    - Actions: View in Marketplace, Release Update, or Remove Package.
  - **Navigation**: "Publish New Package" button routing to `/publish`.
- **Acceptance Criteria**:
  - Displays exclusively the packages owned by the authenticated GitHub user.

---

### C.7 Package Release Interface (`app/(dashboard)/publish/page.tsx`)
- **Description**: One-step interface to inspect and import extensions from public GitHub repositories.
- **UI Elements**:
  - Public GitHub repository URL input field (`HeroUI Input`).
  - "Inspect Repository" action to validate `bob-package.json` in real time.
  - Preview card summarizing detected package metadata prior to publication.
  - Primary Action: "Publish to Marketplace" calling `POST /api/v1/publish` with loading spinner and status feedback.
- **Acceptance Criteria**:
  - Validates GitHub URL, triggers backend ingestion, and redirects publisher to their newly published package page.

---

### C.8 Deployment & Vercel Configuration
- **Description**: Deploy Next.js web application to Vercel for public global accessibility.
- **Execution Steps**:
  1. Configure `vercel.json` and ensure `npm run build` completes with zero errors.
  2. Register required Environment Variables in Vercel project dashboard:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
  3. Deploy to production and verify custom domain routing.
- **Acceptance Criteria**:
  - Application is publicly reachable without SSR or CSR runtime errors.

---

## 5. Module Readiness Checklist
- [x] C.1: Next.js + HeroUI + Tailwind + Dark theme configured.
- [x] C.2: Route Groups & Nested Layouts (Auth, Marketplace, Dashboard) completed.
- [x] C.3: Login page `/login` with GitHub OAuth operational.
- [x] C.4: Marketplace catalog `/marketplace` and `/` completed.
- [x] C.5: Package detail `/packages/[name]` with interactive tabs operational.
- [x] C.6: Publisher dashboard `/dashboard` protected by Edge auth middleware.
- [x] C.7: Publishing interface `/publish` via repository URL completed.
- [x] C.8: Successfully deployed on Vercel with active public domain.
