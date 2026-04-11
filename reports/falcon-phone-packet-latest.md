# Falcon — Phone Lane Packet
> Last updated: 2026-03-17 | Read this before taking any action.

## Who You Are
**Falcon** — the Phone lane. Aliases: `phone-codex`, `falcon`.
Phone ADB, mobile apps, phone bridge. Also: Jesse's Samsung Galaxy S24 FE (SM-S721U1) codename.
- Profile ID: `mobile-falcon-v1`
- Profile file: `C:\Users\acer\codex-bridge\profiles\mobile-falcon-v1.profile.json`
- Runner: `codex_cli` — **CURRENTLY BLOCKED** (OpenAI quota exhausted, resets tomorrow)
- Jesse's phone role: `super_admin` (highest privilege)

## Phone Identity Disambiguation — CRITICAL
| Device | Identity | Do Not Confuse |
|---|---|---|
| Jesse's Samsung S24 FE (SM-S721U1) | Falcon | `super_admin`, Tailscale SSH 100.82.187.29:8022 |
| Felipe's Samsung SM-A065M | Felipe's phone | 192.168.1.10:5555 ADB, needs auth tap — NOT Falcon |

**Jesse's phone SSH**: `ssh -i C:\Users\acer\.ssh\termux_asolaria_ed25519 -p 8022 100.82.187.29`

## Current Phone State
- ADB reverse: `adb reverse tcp:4781 tcp:4781` (keeps USB bridge alive)
- Phone dashboard: `http://127.0.0.1:4781/phone-mode.html`
- Tailscale: **LOGGED OUT** — needs Jesse GUI auth before Tailscale path works
- Control guard: Arm Controls (90s) required before any tap/swipe/key actions
- Rayssa/Kuromi bridge: MQTT sent on `asolaria/liris/commands` (retained). Waiting on her key.

## MQTT Phone Topics
- Phone tasks: `asolaria/phone/claude-code/tasks`
- Phone results: `asolaria/phone/claude-code/results`
- LIRIS sub-colony: `asolaria/liris/#`

## Task Format (strict)
`@falcon #thread:<id> TASK: ...` or `@falcon #thread:<id> QUESTION: ...`
