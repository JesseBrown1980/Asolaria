# Bridge Realtime Upgrade Report

Generated: 2026-03-01 12:29:26 -03:00

## Summary
- Asolaria health ok: True
- Agent colony online: 6/6
- Relay running: True
- Bridge tunnel running: True
- Watchdog enabled: True
- Phone bridge keeper running: True
- Phone tunnel monitor running: True
- Routing selected channel: usb
- Routing reason: Matched preferred secure channel: usb.

## Vertex
- Vertex enabled: True
- Vertex configured: True
- Vertex model: gemini-2.5-flash
- Budget day: 2026-03-01
- Budget usage requests: 2/40
- Budget near limit: False
- Budget exhausted: False

## Bridge Lanes
- this-codex: running=True; state=active; lastSeenAt=2026-03-01T15:29:11.356Z
- other-codex: running=True; state=active; lastSeenAt=2026-03-01T15:29:11.849Z
- build-codex: running=True; state=active; lastSeenAt=2026-03-01T15:29:12.420Z
- phone-codex: running=True; state=active; lastSeenAt=2026-03-01T15:29:13.330Z
- watchdog: running=True; state=active; lastSeenAt=2026-03-01T15:24:14.447Z

## Night Ops Monitors
- tag=gcp; pid=17668; running=True
- tag=john008; pid=21932; running=True
- tag=john009; pid=22176; running=True

## UI
- New page: /oli-john-ops.html
- Script: /oli-john-ops.js
- Purpose: Mac-first Oli/John handoff UI, sanitized packet generator, John phone setup checklist.

## Bridge Status Tail
```text
Bridge status (root=C:\Users\acer\codex-bridge)
- relayLocal=http://127.0.0.1:8788
- tunnelUrl=https://photographers-lyric-confidential-salem.trycloudflare.com
- bridge2.pid=21648 running=True
- cloudflared-quick.pid=9912 running=True
- this-codex-bot.pid=22448 running=True
- other-codex-bot.pid=788 running=True
- build-codex-bot.pid=20508 running=True
- phone-codex-bot.pid=1252 running=True
- notify-bot.pid=21764 running=True
- anydesk-sentry.pid=(empty) running=False
- airlock-ingress.pid=(empty) running=False
- core-gate-bot.pid=(empty) running=False
- watchdog.pid=20580 running=True
- localHealth=OK time=2026-03-01T15:29:25.343Z
- tunnelHealth=OK time=2026-03-01T15:29:25.687Z
- registryUpdatedAt=2026-03-01T15:29:23.215Z
- lastSeen other-codex: 2026-03-01T15:29:11.849Z (id=20542)
- lastSeen build-codex: 2026-03-01T15:29:12.420Z (id=20543)
- lastSeen phone-codex: 2026-03-01T15:29:13.330Z (id=20544)
- lastSeen watchdog: 2026-03-01T15:24:14.447Z (id=20537)
- lastSeen this-codex: 2026-03-01T15:29:11.356Z (id=20541)
```
