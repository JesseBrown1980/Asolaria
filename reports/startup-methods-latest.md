# Asolaria Startup Method Catalog

Generated: 2026-03-15 23:14:17 -03:00
JSON: C:\Users\acer\Asolaria\logs\startup-method-paths.json

## desktop_default
- cmd: C:\Users\acer\Asolaria\Start-Asolaria.cmd
- ps1: C:\Users\acer\Asolaria\tools\Start-Asolaria-OneButton.ps1
- note: Primary launcher icon target. Reuses running session and keeps phone bridge services alive.

## desktop_one_button
- cmd: C:\Users\acer\Asolaria\Start-Asolaria-OneButton.cmd
- ps1: C:\Users\acer\Asolaria\tools\Start-Asolaria-OneButton.ps1
- note: One-button launcher with optional phone dashboard and recovery switches.

## desktop_one_window
- cmd: C:\Users\acer\Asolaria\Start-Asolaria-OneWindow.cmd
- ps1: C:\Users\acer\Asolaria\tools\Open-Asolaria-AppShell.ps1
- note: One-window app-shell launcher with explicit UI mode preset (simple/admin/advanced).

## desktop_phone_connect
- cmd: C:\Users\acer\Asolaria\Start-Asolaria-Phone.cmd
- ps1: C:\Users\acer\Asolaria\tools\Start-Asolaria-Phone.ps1
- note: Direct phone bootstrap workflow (USB/tunnel URL copy + bridge setup).

## desktop_core_legacy
- cmd: C:\Users\acer\Asolaria\Start-Asolaria-Core.cmd
- ps1: C:\Users\acer\Asolaria\tools\Start-Asolaria.ps1
- note: Core legacy startup path without one-button orchestration.

## desktop_control_plane
- cmd: C:\Users\acer\Asolaria\Start-Asolaria-ControlPlane.cmd
- ps1: C:\Users\acer\Asolaria\tools\Start-Asolaria-ControlPlane.ps1
- note: Core app plus control-plane tooling.

## desktop_control_plane_sandbox
- cmd: C:\Users\acer\Asolaria\Start-Asolaria-ControlPlane-Sandbox.cmd
- ps1: C:\Users\acer\Asolaria\tools\Start-Asolaria-ControlPlane.ps1
- note: Control-plane + sandbox manager path (manual test path only).

## phone_background_keeper
- ps1: C:\Users\acer\Asolaria\tools\Start-Asolaria-PhoneBackgroundKeeper.ps1
- note: Maintains adb reverse and phone health checks in background.

## phone_tunnel_monitor
- ps1: C:\Users\acer\Asolaria\tools\Start-Asolaria-PhoneTunnelMonitor.ps1
- note: Runs recurring tunnel smoke tests and writes latest report.

## public_tunnel_keeper
- ps1: C:\Users\acer\Asolaria\tools\Start-Asolaria-PublicTunnelKeeper.ps1
- note: Maintains one managed cloudflared tunnel process and live URL artifact.

## health_guardrail_monitor
- ps1: C:\Users\acer\Asolaria\tools\Start-Asolaria-HealthGuardrailMonitor.ps1
- note: Scheduled guardrail monitor with bridge alerts and state persistence.

## health_guardrail_probe
- ps1: C:\Users\acer\Asolaria\tools\Test-Asolaria-HealthGuardrail.ps1
- note: PS5-safe health probe for 4781/5443 plus optional Oli 8787 contract check.

## skills_parity
- ps1: C:\Users\acer\Asolaria\tools\Test-Asolaria-SkillsParity.ps1
- note: Codex/Wrapper parity inventory+compare tool with missingOnLocal/missingOnOther output.

## codex_bridge_colony
- ps1: C:\Users\acer\codex-bridge\watchdog.ps1
- note: Optional manual mode: starts relay, tunnel, and lane bots (Vector/Rook/Forge/Falcon) only when explicitly enabled.

## recovery
- ps1: C:\Users\acer\Asolaria\tools\Heal-Cure-Asolaria-Phone.ps1
- note: Compatibility and cleanup audit for phone connectors/artifacts.

