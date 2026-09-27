# Task E: Creation of Local Sample Package (`sample/`)

## 1. Module Objective
Create the initial showcase package in the local directory `sample/` equipped with the official `bob-package.json` manifest and an autonomous codebase explainer skill. When installed via `@marketplace add sample`, this package equips IBM Bob IDE with the `/sample run` slash command, allowing developers to immediately analyze and understand any unfamiliar local repository they open.

---

## 2. Directory Structure of `sample/`
The package is structured strictly according to the generic manifest contract:

```text
sample/
├── bob-package.json              # Official package manifest specification
└── skills/
    └── sample/
        └── SKILL.md              # AI skill instructions & slash command definition
```

---

## 3. Technical Specifications

### A. Manifest Specification (`sample/bob-package.json`)
The manifest explicitly maps the source files to their destination targets in the user's workspace:

```json
{
  "name": "sample",
  "version": "1.0.0",
  "display_name": "Local Codebase Explainer",
  "description": "An intelligent skill that autonomously inspects, analyzes, and explains the architecture and structure of the active workspace.",
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
  "keywords": [
    "onboarding",
    "codebase-explainer",
    "architecture",
    "developer-tooling"
  ]
}
```

### B. Skill Recipe Specification (`sample/skills/sample/SKILL.md`)
The `SKILL.md` defines metadata frontmatter and the execution steps for Bob:

```markdown
---
name: sample
description: Analyzes and explains the active repository structure and architecture
commands:
  - /sample run
---

# Local Codebase Explainer Skill

When the user triggers `/sample run`, execute the following multi-phase analysis autonomously:

## Execution Steps:
1. **Phase 1: Project Discovery**:
   - Inspect root configuration files (`package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `requirements.txt`, `README.md`, etc.).
   - Identify the primary programming languages, runtime versions, frameworks, and key libraries.

2. **Phase 2: Directory Architecture Mapping**:
   - List the root directory and top-level subdirectories.
   - Categorize folders by responsibility (e.g., `src/`, `api/`, `components/`, `lib/`, `tests/`, `docs/`).

3. **Phase 3: Structured Synthesis**:
   - Present a clean, developer-friendly overview in the chat panel:
     - **Project Overview**: What this repository is built for.
     - **Tech Stack Summary**: Languages, frameworks, and database/ORM tools used.
     - **Architecture & Directory Roles**: Concise explanation of the core modules.
     - **Development Entrypoints**: How to run, build, test, and contribute to the code.
```

---

## 4. Executable Sub-tasks

### E.1 Initialize `sample/` Package Directory
- Create directory `sample/` and subdirectories `sample/skills/sample/`.
- Ensure directory permissions and clean layout.

### E.2 Author Package Manifest (`sample/bob-package.json`)
- Write the compliant JSON manifest with semantic versioning (`1.0.0`), clean description, and accurate file destination mapping.
- Validate the JSON syntax against the Zod schema defined in Task B.

### E.3 Author Skill Implementation (`sample/skills/sample/SKILL.md`)
- Write frontmatter declaring command `/sample run`.
- Detail the reasoning prompts and deterministic file exploration instructions so Bob executes efficiently without hallucination or context window overflow.

### E.4 Bundle & Registry Seeding
- Compress `sample/` into `sample-1.0.0.tar.gz`.
- Seed the package into Supabase database (`packages` and `package_versions`) and Supabase Storage (`packages-bundle`) to ensure immediate availability for testing and demo.

---

## 5. Acceptance Criteria
- [x] Directory `sample/` contains valid `bob-package.json` and `skills/sample/SKILL.md`.
- [x] Manifest file passes Zod schema validation with zero errors.
- [x] Compressed archive `sample-1.0.0.tar.gz` can be unpacked cleanly into target path `.bob/skills/sample/SKILL.md`.
- [x] Package metadata is seeded and discoverable in the registry API.
