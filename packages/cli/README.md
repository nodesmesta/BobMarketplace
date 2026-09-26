# bob-marketplace

> **Zero-friction CLI & Package Manager for IBM Bob 2.0 AI Extensions**

[![Platform](https://img.shields.io/badge/Platform-IBM%20Bob%202.0-8A3FFC?style=flat-square)](https://ibm.com)
[![Web Registry](https://img.shields.io/badge/Web%20Registry-ibmbob.vercel.app-0F62FE?style=flat-square)](https://ibmbob.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

The official CLI and MCP server installer for **Bob Marketplace** — the decentralized package manager for IBM Bob 2.0.

---

## Quick Start

Initialize Bob Marketplace globally for your IBM Bob IDE in one command:

```bash
npx bob-marketplace init
```

### What this does:
1. Installs the self-contained Bob Marketplace MCP Server runtime into `~/.bob/marketplace/server.js`.
2. Registers the `@marketplace` MCP tool server in `~/.bob/settings/mcp.json`.
3. Registers the `@marketplace` Custom Mode in `~/.bob/settings/custom_modes.yaml`.

---

## Usage in IBM Bob IDE

Once initialized, open any project in IBM Bob IDE and use natural commands in the chat panel:

- **Install an extension**:
  ```text
  @marketplace add <package-name>
  ```
- **List installed extensions**:
  ```text
  @marketplace list
  ```
- **Uninstall an extension**:
  ```text
  @marketplace remove <package-name>
  ```

---

## Explore Packages

Discover autonomous Agents, Skills, MCP Servers, and Rules on the public web registry:
👉 [https://ibmbob.vercel.app](https://ibmbob.vercel.app)
