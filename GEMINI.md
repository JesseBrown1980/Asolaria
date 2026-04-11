# Asolaria — GEMINI.md

Asolaria is a sovereign AI Agent orchestration framework and control plane built on the **Brown-Hilbert canon**. It is designed to manage AI agents across multiple surfaces (desktop, mobile, cloud) with a heavy focus on identity, safety, and "civilization law" for autonomous systems.

## Project Overview

*   **Purpose:** Orchestrating AI agents (Codex, Claude, Gemini, etc.) while maintaining local authority and safety guardrails.
*   **Technologies:** Node.js (Express), Model Context Protocol (MCP), Playwright, MQTT, Python (GNN models), and PowerShell/Batch automation.
*   **Architecture:**
    *   **Control Plane:** A Node.js server (`server.js`) that manages agent sessions and connectors.
    *   **Connectors:** Modular adapters for external AI APIs and local tools (Chrome, Atlassian, Slack, etc.).
    *   **Guardian:** A safety and approval engine for high-risk actions.
    *   **Brown-Hilbert Canon:** A set of model-neutral rules (found in `BROWN-HILBERT.md` and `brown-hilbert/`) that govern agent behavior, identity, and authority.

## Repository Structure & Branches

The `main` branch is currently a lightweight landing page. Most active development and the full codebase reside in the following branches:
*   `dev`: The primary integration branch with the complete feature set.
*   `master`: The stable version of the control plane and tools.
*   `ai/*`, `cube/*`: Specialized research and implementation branches for GNNs, safety protocols, and "dimension" experiments.

## Key Files (Reference from `dev` branch)

*   `BROWN-HILBERT.md`: The canonical root file for agent identity and authority.
*   `AGENTS.md`: Local safety and workspace operating practices.
*   `server.js`: The main entry point for the Asolaria Control Plane.
*   `package.json`: Project metadata, dependencies, and core scripts.
*   `src/`: Core logic, including the `brainOrchestrator`, `riskEngine`, and various `connectors`.
*   `tools/`: A vast collection of PowerShell, Python, and JS tools for system interaction and maintenance.
*   `brown-hilbert/`: Detailed constitutional laws for the framework (Identity, Continuity, Operating Model, etc.).

## Building and Running

The project is primarily a Node.js application. Commands should generally be run from the `dev` or `master` branches.

*   **Initialize:** `npm install`
*   **Start Control Plane:** `npm start` or `node server.js`
*   **Validate Skills:** `npm run skills:validate`
*   **Gateway Mode:** `npm run gateway:start`
*   **Memory Indexer:** `npm run memory:start`

*Note: Many tools and start scripts (`Start-Asolaria.cmd`, etc.) are designed for Windows environments but are being adapted for cross-platform use.*

## Development Conventions

*   **Agent-First Scan Doctrine:** Adhere to the `SCAN -> SEEK -> FIND` order for workspace navigation.
*   **Cube Rules:** Keep each "Brown-Hilbert cube point" (documentation or logic segments) at or under 35 lines.
*   **Identity First:** Never collapse "civilization identity" into a model vendor name. The canon (`BROWN-HILBERT.md`) always wins over model-specific instructions.
*   **Safety:** High-risk actions must be routed through the `Guardian` or require explicit user approval. Never approve destructive commands without local inspection.
*   **Task Tracking:** Maintain and update `TASKS.md` for session continuity.

---
*This file is generated as instructional context for Gemini CLI interactions in the Asolaria workspace.*
