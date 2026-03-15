# Bridge Realtime Upgrade Report

Generated: 2026-03-01 13:29:22 -03:00

## Summary
- Asolaria health ok: True
- Agent colony online: 6/6
- Relay running: True
- Bridge tunnel running: True
- Watchdog enabled: True
- Phone bridge keeper running: True (pid=1824)
- Phone tunnel monitor running: True (pid=23468)
- Phone tunnel latest report pass: True
- Routing selected channel: usb
- Routing reason: Matched preferred secure channel: usb.
- Tunnel monitor route mode: public_fallback (from latest monitor log).

## Vertex
- Vertex enabled: True
- Vertex configured: True
- Vertex model: gemini-2.5-flash
- Budget day: 2026-03-01
- Budget usage requests: 2/40
- Budget near limit: False
- Budget exhausted: False

## Bridge Lanes
- this-codex: running=True; state=active; lastSeenAt=2026-03-01T16:29:17.243Z
- other-codex: running=True; state=active; lastSeenAt=2026-03-01T16:29:20.620Z
- build-codex: running=True; state=idle; lastSeenAt=2026-03-01T16:24:22.684Z
- phone-codex: running=True; state=active; lastSeenAt=2026-03-01T16:29:17.058Z
- watchdog: running=True; state=active; lastSeenAt=2026-03-01T16:24:34.056Z

## Night-Ops Monitors
- gcp: running=True; pid=17668
- john008: running=True; pid=21932
- john009: running=True; pid=22176

## UI
- Existing handoff page: /oli-john-ops.html (present=True)
- Existing script: /oli-john-ops.js (present=True)
- Includes: Mac quick commands, John phone setup checklist, sanitized handoff packet generator.

## Relay Handoff
- Posted sanitized status handoff to `asolaria_bridge` thread `gcp-vertex-guardrails-20260216` as message id `20648`.

## Bridge Status Snapshot
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
- localHealth=OK time=2026-03-01T16:29:22.437Z
- tunnelHealth=OK time=2026-03-01T16:29:22.559Z
- registryUpdatedAt=2026-03-01T16:29:21.304Z
- lastSeen other-codex: 2026-03-01T16:29:20.620Z (id=20651)
- lastSeen build-codex: 2026-03-01T16:24:22.684Z (id=20641)
- lastSeen phone-codex: 2026-03-01T16:29:17.058Z (id=20649)
- lastSeen watchdog: 2026-03-01T16:24:34.056Z (id=20642)
- lastSeen this-codex: 2026-03-01T16:29:17.243Z (id=20650)
```

