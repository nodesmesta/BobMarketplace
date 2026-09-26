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
