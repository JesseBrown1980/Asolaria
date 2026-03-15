# Gemini Captured Code Snippets

- Source: C:\\Users\\acer\\window_dump_send_locator.xml
- Generated: 2026-03-05 01:41:33 -03:00

## Snippet 1
```toml
# ~/.codex/config.toml

[default]
model = "gpt-5.3-codex-spark" # Current 2026 flagship for agentic reasoning
approval_policy = "on-request"  # High autonomy for "takeover" tasks
sandbox_mode = "auto"         # Restricted to workspace by default

[mcp_servers.fs_connector]
# For indexing and modifying your local Asolaria lore files
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/asolaria/project"]

[mcp_servers.github_connector]
# For versioning lore changes to plasmatoid@gmail.com's repos
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { "GITHUB_PERSONAL_ACCESS_TOKEN" = "your_token_here" }

[mcp_servers.asolaria_mcp]
# Your custom MCP server for world-building logic (if applicable)
url = "http://localhost:3000/mcp" 

[agents]
# Defines the specific role for the Asolaria Takeover
instructions_file = "~/.codex/asolaria_instructions.md"
```

