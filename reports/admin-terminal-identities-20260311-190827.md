# Admin Terminal Identities - 2026-03-11

## Naming Correction

The earlier `Vector` / `Rook` admin-terminal mapping was wrong.

Those names are already used by internal bridge lanes and must stay separate from the two human-facing admin terminals.

## Admin Terminal Layer

- Controller admin terminal: `Helm`
- Helper/watcher admin terminal: `Sentinel`

## Internal Lane Layer

These are not the admin-terminal names:

- `vector`
- `rook`
- `forge`
- `falcon`
- `asolaria`
- `watchdog`

They remain inner coordination identities only.

## Canonical Local Memory Files

- Shared identity registry:
  - `C:\Users\acer\Asolaria\reports\admin-terminal-identities-latest.md`
- Controller profile card:
  - `C:\Users\acer\Asolaria\reports\admin-terminal-helm-profile-latest.md`
- Helper/watch profile card:
  - `C:\Users\acer\Asolaria\reports\admin-terminal-sentinel-profile-latest.md`
- Machine-readable admin profiles:
  - `C:\Users\acer\codex-bridge\profiles\admin-helm-v1.profile.json`
  - `C:\Users\acer\codex-bridge\profiles\admin-sentinel-v1.profile.json`
  - `C:\Users\acer\codex-bridge\profiles\admin-terminal-identities.json`

Obsolete admin-terminal cards kept only as historical correction points:

- `C:\Users\acer\Asolaria\reports\admin-terminal-vector-profile-latest.md`
- `C:\Users\acer\Asolaria\reports\admin-terminal-rook-profile-latest.md`

## Restart Rule

For `Helm`, reload:

1. `C:\Users\acer\Asolaria\reports\admin-terminal-helm-profile-latest.md`
2. `C:\Users\acer\Asolaria\reports\admin-terminal-identities-latest.md`
3. `C:\Users\acer\AGENTS.md`
4. `C:\Users\acer\Asolaria\TASKS.md`
5. any active project restart packet

For `Sentinel`, reload:

1. `C:\Users\acer\Asolaria\reports\admin-terminal-sentinel-profile-latest.md`
2. `C:\Users\acer\Asolaria\reports\admin-terminal-identities-latest.md`
3. `C:\Users\acer\AGENTS.md`
4. `C:\Users\acer\Asolaria\TASKS.md`
5. the active controller packet or active project restart packet
