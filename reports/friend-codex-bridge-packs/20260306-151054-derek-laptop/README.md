# Friend Codex Bridge Pack

Generated: 2026-03-06 15:10:54 -03:00

## Purpose
This pack connects a friend's Codex CLI to your existing codex-bridge relay using a dedicated room and sender identity.

## Bridge Identity
- Friend label: Derek-Laptop
- Sender handle: friend-derek-laptop-codex
- Relay room: asolaria_friend_derek-laptop
- Allowed supervisors: this-codex

## Files
- friend-derek-laptop-codex.profile.json: no-secrets bridge profile
- friend-derek-laptop-codex.env.example: environment variable template
- this-codex-bot.js: generic Codex bridge bot
- Start-Friend-Codex-Bridge.ps1: one-command launcher
- relay-policy.example.json: optional host-side relay policy example

## Host-side Steps
1. Keep your relay reachable and stable:
   powershell -ExecutionPolicy Bypass -File C:\Users\acer\codex-bridge\bridgectl.ps1 -Command start
2. Share only the bridge URL and relay token with your friend.
3. Preferred hardening: merge relay-policy.example.json into your live bridge policy and restart the relay with policy enabled.

## Friend-side Steps
1. Put this folder on the friend's machine.
2. Install prerequisites already expected by the bootstrap: node, codex, and access to codex.cmd.
3. Fill the real values from friend-derek-laptop-codex.env.example into the friend's shell session.
4. Dry run the resolved config:
   powershell -ExecutionPolicy Bypass -File .\Start-Friend-Codex-Bridge.ps1 -CheckProfile
5. Start the bridge bot:
   powershell -ExecutionPolicy Bypass -File .\Start-Friend-Codex-Bridge.ps1

## Message Contract
Use this form from your side when talking to the friend's bot:

@friend-derek-laptop-codex #thread:friend-bootstrap TASK: Run host discovery and report OS, shell, node, codex, and browser status.

The friend's bot requires mention + actionable prefix by default.

## Notes
- This pack does not embed real secrets.
- If you leave bridge policy disabled, the relay token is the only server-side guard.
- Use a dedicated room for each friend machine to avoid cross-talk.
