# Amy Owner-Saved Startup Recovery Packet

Generated: 2026-03-29 21:02:10 -03:00
PID: gaia-20260329-amy-startup-recovery
Profile: gaia

## Artifact collapse

- `amy-oracle-asolaria-source-attach-20260329-182212.zip`, `amy-rose-asolaria-source-attach-20260329-182212.zip`, and `amy-asolaria-source-attach-20260329-182212.zip` are byte-identical and should be treated as one canonical Asolaria source snapshot
- `amy-oracle-codex-bootstrap-20260329-133940.zip` is the Windows bootstrap pack
- `amy-rose-codex-bootstrap-20260329-133940.zip` is the macOS bootstrap pack
- the two larger WhatsApp screenshots are identical
- `systems thinking.jpg` and the smaller WhatsApp image are concept/visual support, not extra startup steps

## Recovery order

1. restore the local Asolaria source tree from the canonical source snapshot
2. run the correct host bootstrap pack
3. start `codex` and load the generated bootstrap prompt
4. start the runtime surfaces from the restored source tree
5. verify `4781` and `4791`

## Preserved truth from the crash packet

- the screenshot shows scaffold/index verification passed
- the screenshot also shows the remaining blocker was still “no local Asolaria source tree on this host”
- the crash transcript shows `4781` could bind without becoming healthy
- the crash transcript also shows `4791` could be up while audit integrity and authority state were still bad

## 3-lane attack

### Source lane
- prove the restore root and whether the target host still lacks a source tree

### Bootstrap lane
- prove the exact host-specific bootstrap order and guardrails

### Runtime lane
- prove the exact current truth of `4781` main runtime versus `4791` gateway

## Current boundary

This packet is enough to restart the system only if it is treated as:

- one source artifact
- one host-specific bootstrap path
- one live runtime truth check

It is not proof that the system is already healthy.
