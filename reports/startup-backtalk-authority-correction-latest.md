# Startup Back-Talk Authority Correction

- Generated: `2026-03-23 02:44 -03:00`
- Scope: preserve Jesse's direct correction on startup communication, constitution authority, and QDD priority

## Trigger

During review of the latest Rayssa/Liris WhatsApp thread, the visible message was a copy-pasted status packet, not a new transport or startup mechanism.

Jesse then gave the direct correction:

- the point of this system is fast back-talk chat while the host is present
- those comms must remain observable if Jesse wants to watch them
- during startup of Asolaria for Gaia/Liris, hidden relay/inbox mechanisms are not the default path
- if Jesse explicitly says to use them, use them
- otherwise do not silently switch startup comms into hidden packet append behavior

## Durable Rule

For startup and live bring-up conversations with Liris:

- default to owner-visible chat/relay surfaces
- do not use `runtime/outbound-liris-inbox.ndjson` as the operative startup channel unless Jesse explicitly orders it
- do not treat local packet append as equivalent to live authorized delivery
- keep startup talk observable, inspectable, and interruptible by the owner

## Constitution Boundary

The constitution is not to be rewritten by agent choice.

Only Jesse may direct constitution changes, except for narrow crash-prevention corrections required to keep the system from collapsing before startup.

## QDD Priority

QDD completion remains a financial survival constraint and outranks speculative architecture expansion.

System work must support:

- finishing QDD
- keeping Asolaria bootable
- preventing architecture or relay complexity from consuming the remaining runway

## Operational Consequence

The earlier local practice of appending startup packets to `runtime/outbound-liris-inbox.ndjson` remains historical evidence only.

It is not the default startup communication path going forward.
