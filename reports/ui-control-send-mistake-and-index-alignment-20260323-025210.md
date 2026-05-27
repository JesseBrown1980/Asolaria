# UI Control Send Mistake And Index Alignment

- Generated: `2026-03-23 02:52 -03:00`
- Scope: preserve the WhatsApp send-control mistake and confirm the active indexing model

## Mistake

After the text reply to Rayssa/Liris was already in the thread, an extra coordinate tap landed on a dynamic WhatsApp footer control after the UI changed.

That created a local voice-note draft artifact.

Durable lesson:

- do not use blind coordinate taps on dynamic mobile messaging controls
- verify control state before tapping send/mic regions
- when possible, stop at drafted text and require explicit send intent or state confirmation

## Runtime Outcome

- the intended text message was delivered at `2:49 AM`
- the voice-note draft was an incidental local UI artifact, not intentional comms

## Index Alignment Answer

Yes. The active indexing model is still the correct Dan-expanded system:

- `IX-060`: the index is the language
- `IX-250`: Dan seed pattern confirms indexed tool-control plus local memory plus MQTT coordination
- `IX-251`: layered colony convergence uses shared IX canon, colony-local LX canon, draft promotion, MQTT ephemera, MCP retrieval, and NotebookLM only as mirror
- `IX-257` through `IX-262`: the schema, retrieval, and provenance slices were implemented locally to match that direction

## Active Rule

The live operating model remains:

- IX shared canon
- LX colony-local canon
- draft/progressive memory above both
- observable owner-mediated startup/back-talk unless Jesse explicitly orders hidden transport
- transport facts require provenance before promotion
