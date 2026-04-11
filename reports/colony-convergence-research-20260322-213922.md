# Colony Convergence Research

- Generated: `2026-03-22 21:39 -03:00`
- Scope: process the available Liris-side evidence, extract Dan's design signals, think through the plan, then research the architecture needed to connect colonies while preserving progressive memory and separation

## Inputs Processed

- `C:\Users\acer\Downloads\Updated Plan during research of the begnnings and improving the system to be able to work better.docx`
- `C:\Users\acer\Downloads\Jesse an Dan first conversations on Facebook Missing the stuff like phos and videos but all available in facebook and downlaods.docx`
- existing local canon: `IX-035`, `IX-036`, `IX-037`, `IX-238`, `IX-244`, `IX-245`, `IX-249`

## Important Boundary

I do **not** see a clean current inbound Liris startup report in the local workspace yet.

What I do see is:

- the current outbound startup order to Liris
- older local Rayssa/Liris path archaeology
- a historical embedded Liris response inside the Facebook export

So the plan below separates:

1. historical Liris evidence
2. current sovereign-side truth
3. future architecture work

## What Liris Said, As Far As The Local Evidence Shows

From the Facebook export, the strongest historical Liris-side response is:

- she treated `18886` as the correct LAN MQTT port for that phase
- she updated the Rayssa bridge config from `18883` to `18886`
- she reported the MQTT bridge connected after that change
- she verified QDD EZ Protect pages returning `200` and the dashboard API returning `422` as expected
- she treated Asolaria on Jesse's host as the execution surface needed to dispatch deeper work

This is useful, but it is **historical**, not current live truth. Current sovereign-side inspection on this machine still says:

- manual owner relay is authoritative
- the friend bridge is staged, not live
- `4799` is dead or unaudited
- the protected `4781` listener still blocks some main-runtime rollout work

## Dan's Useful Seed Ideas

From the Facebook export, the strongest architecture signals from Dan/Jesse are:

- a **tool control layer** matters
- tools, skills, mistakes, and projects should be reduced to a **numbered index table**
- the model should load **index numbers instead of the whole tool list**
- local memory should exist as a separate layer
- nightly upgrade/research jobs should feed that memory
- MQTT can be used for coordination and centralized logging
- agents can be ephemeral, construct-bound workers that load a profile, do one bounded job, hand off, and exit

The photo itself is not preserved in this `.docx` in usable form. The export contains only tiny UI/media icons rather than the missing large photos/videos, so the recoverable design signal comes from the text statements, not the absent media.

## First Impression

The problem is no longer "invent a language." That already exists.

The real missing pieces are:

1. a canonical replicated memory layer shared across colonies
2. a separate local draft layer so colonies can think and store progressively without polluting canon
3. a transport/discovery layer that does not force canonical truth to ride on ad hoc bridge paths
4. a versioned transport registry so `18883` vs `18886` style drift becomes machine-readable instead of archaeological
5. a retrieval surface that exposes the same language to agents without loading everything

## Research Findings

### 1. Canon should be local-first, not server-first

Ink & Switch's local-first paper says local devices should hold the primary copy and sync quietly in the background, while servers hold secondary copies.

Source:
- https://www.inkandswitch.com/essay/local-first/local-first.pdf

Why it matters here:

- each colony should own a primary local copy of its own memory/state
- the sovereign should not be the only place where truth "really exists"
- sync should happen in the background, not by forcing every action through a live central surface

### 2. Shared language should be a small set of replicated documents with explicit migrations

Automerge's official modeling guidance says:

- many documents are fine, but granularity matters
- all peers must share the same initial document ancestry if they are meant to merge
- migrations should be hard-coded, versioned changes instead of ad hoc rewrites
- many docs can sync over a single connection if each message is tagged with the document ID

Sources:
- https://automerge.org/docs/cookbook/modeling-data/
- https://automerge.org/docs/reference/repositories/
- https://automerge.org/docs/reference/repositories/dochandles/

Why it matters here:

- the IX/LX language should become a versioned document family, not just markdown files discovered later
- colonies need a shared root schema and migration discipline
- the shared language can stay small while project and colony details remain separate documents

### 3. Progressive separation needs draft memory, not immediate promotion

The strongest local-first implication is that colonies need local primary copies first, then merge into shared state when ready.

For Asolaria, that means:

- IX stays sovereign/shared canon
- LX stays colony-local canon
- a new draft layer should sit above both for unconfirmed work, experiments, and partial archaeology

This matches the missing "layered development" idea much better than dumping raw chat into global memory.

### 4. MQTT should carry heartbeat, discovery, and ephemeral traffic; not be the only canonical store

Official MQTT 5 material shows:

- shared subscriptions are server-scoped
- shared subscriptions do **not** send retained messages when a session first subscribes
- retained/session behavior must be chosen deliberately depending on whether you need bootstrap state or only live flow

Sources:
- https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html
- search anchors used: shared subscriptions, retained-message behavior, session scope

Why it matters here:

- MQTT is good for heartbeat, discovery, commands, and ephemeral coordination
- it is dangerous to assume a shared subscription is enough for bootstrap or canonical replay
- colony bootstrap state should live in durable documents or non-shared retained surfaces, not only in ad hoc bridge traffic

### 5. MCP is the right retrieval/access layer, not the canonical memory layer

Official MCP docs show:

- tools can be listed with pagination and list-changed notifications
- resources are addressable by URI, can be listed/read, can expose templates, and can be subscribed to for updates

Sources:
- https://modelcontextprotocol.io/specification/draft/server/tools
- https://modelcontextprotocol.io/specification/draft/server/resources

Why it matters here:

- colonies can share the same language through URIs and resource templates
- IX/LX entries can be exposed as addressable resources
- agents can subscribe to specific memory surfaces instead of reloading everything
- this gives us the "same language" across colonies without collapsing all memory into one file

### 6. NotebookLM should be treated as a local read-mirror, not canonical replicated memory

Official NotebookLM help says imported sources are static copies, Google files require manual resync, and other uploaded files must be deleted and uploaded again to refresh.

Source:
- https://support.google.com/notebooklm/answer/16215270?hl=en

Why it matters here:

- Dan's "create memory locally using NotebookLM" idea is good for local read/analysis
- it is not good as the canonical federation substrate
- NotebookLM should sit above the replicated memory layer as a colony-local research mirror

## Research-Based Plan

### Layer 1: Shared Canon

- keep IX as the shared inter-colony language
- define a small shared root schema and migration path
- store canonical transport facts, chain anchors, and colony registry refs there

### Layer 2: Colony Canon

- keep LX as colony-local memory and archaeology
- let each colony own its own district and local anchors
- sync references upward only when promoted or linked

### Layer 3: Draft / Progressive Memory

- add a draft layer for partial finds, speculative plans, and unconfirmed runtime readings
- drafts can promote to LX or IX later
- this is the missing separation needed for progressive memory

### Layer 4: Transport Registry

- create a machine-readable registry that records the active transport epoch
- store current broker endpoints, bridge room status, sender-policy status, and relay fallback rule
- this is how we stop reliving `18883` vs `18886` and "friend bridge staged vs live" confusion

### Layer 5: MQTT / Ephemeral Coordination

- use MQTT for heartbeat, ephemeral coordination, and action dispatch
- do not use it as the only source of canonical memory
- keep retained bootstrap state deliberate and explicit

### Layer 6: MCP Retrieval Surface

- expose IX/LX/draft nodes as MCP resources with URIs
- expose parameterized lookups as resource templates
- expose mutation work as guarded tools

### Layer 7: Local Research Mirror

- use NotebookLM or similar local notebooks as colony-specific research memory
- mirror the canon into that layer
- never treat it as the authoritative replicated state

## Immediate Research Priorities

1. document schema for a shared colony registry root
2. transport epoch/version negotiation between sovereign and colony
3. promotion rules from draft -> LX -> IX
4. MCP URI design for IX/LX resource exposure
5. what durable subset of runtime truth belongs in canonical docs versus ephemeral topics

## Best Next Slice

The next implementation slice should **not** be "turn the bridge back on and hope."

It should be:

1. define a `colony-registry` schema
2. define a `transport-epoch` record
3. define `draft` promotion rules
4. surface them locally through workspace knowledge and MCP resources

That would give the colonies:

- the same language
- progressive local memory
- clean separation between canon, local memory, and ephemeral coordination
- a path to reconnect without repeating archaeology every time
