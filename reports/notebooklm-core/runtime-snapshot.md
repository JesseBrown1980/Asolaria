# Asolaria Runtime Snapshot
Origin: live runtime
# Asolaria Runtime Snapshot

Primary provider: anthropic
Voice output mode: gemini_live_audio
Wake word: asolaria
Bridge auto-sync enabled: true
Agent colony watchdog enabled: true
Selected route: usb
Route reason: Matched preferred secure channel: usb.
Phone bridge keeper running: false
Phone tunnel monitor running: false
NotebookLM enterprise ready: true
NotebookLM access: true
NotebookLM recent notebook count: 1

## Memory Architecture Split

- Asolaria shared memory handles low-latency, multi-turn phone/live memory.
- Gemini Live / Vertex Live handles app-managed realtime voice interaction.
- NotebookLM Enterprise is reserved for curated, slower-changing long-form project knowledge.
- The phone Gemini edge route now carries `chatId=phone-live` and writes turns into Asolaria shared memory.

## Current Control Principle

- Asolaria is the control plane.
- Gemini is the live voice/model surface under Asolaria routing and task control.
- NotebookLM is project knowledge, not the instant wake-word memory store.