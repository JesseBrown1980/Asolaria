# Omnispindle: The Agent Spawner

Omnispindle has evolved from a simple script into the core **Orchestration Layer and Agent Process Manager** of the Asolaria framework. It serves as the physical engine that spawns, tracks, and manages the various named agents within the civilization.

## 1. Core Architecture
Located at `src/omnispindle.js`, Omnispindle is a Node.js-based process manager. Its primary function is to spawn isolated instances of the **Anthropic Claude Code CLI** (or other model executables) and bind them to specific "lanes." 

It acts as a **Remote MCP (Model Context Protocol) Server**, allowing these distinct agent instances to communicate, be supervised, and be commanded by the broader Asolaria control plane.

## 2. The Five Agent Lanes
Omnispindle partitions the civilization's work into five distinct agent identities, each initialized with a specific, hardcoded system prompt and role:

1.  **Helm (Controller Admin Terminal):** The apex orchestrator. Has admin-level authority, coordinates other agents, and prioritizes system stability and owner directives.
2.  **Vector (Main Brain):** The deep-reasoning engine. Defaults to complex planning, architecture decisions, and heavy coding tasks.
3.  **Rook (Ops Lane):** The DevOps entity. Handles deployments, monitoring, infrastructure health, and responding to system alerts.
4.  **Forge (Build Lane):** The CI/CD entity. Responsible for compilation, test coverage, build reliability, and artifact production.
5.  **Falcon (Phone Lane):** The edge node controller. Manages the mobile edge, ADB (Android Debug Bridge) commands, and the phone-desktop bridge.

## 3. Process Management and Resilience
Omnispindle isn't just a launcher; it's a self-healing process supervisor:
*   **Auto-Restart & Healing:** If an agent crashes or hits a context window exhaustion (e.g., Helm dying at 4% context), Omnispindle catches the `exitCode` and automatically restarts the agent, up to a maximum of 5 times within a 10-minute window.
*   **State Tracking:** It maintains the exact status (`idle`, `starting`, `running`, `stopping`, `crashed`) of every lane, tracking `pid`, `startedAt`, `promptCount`, and the `lastOutput`.
*   **API Control:** Through `routes/omnispindle.js`, the Asolaria UI and other agents can programmatically start, stop, broadcast prompts, or check the health of any agent lane in real-time.
