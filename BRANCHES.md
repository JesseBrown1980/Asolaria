# Asolaria Repository Branch Analysis

This document provides a breakdown of the current state of the branches in the Asolaria repository as of April 11, 2026.

## Branch Overview

The repository features a large number of branches, many of which are specialized "cube" or "ai" research branches. However, as of the latest check, most of these branches are currently synchronized at a specific milestone.

### Key Branch: `dev` (Active Lead)
The `dev` branch is currently the most advanced branch in the repository. It contains the latest architectural refinements and conceptual work.
*   **Latest Commit:** `a975502` — "Phone orbitals + sovereignty USB boot concept"
*   **Key Additions over other branches:**
    *   **README Rewrite:** A comprehensive architecture document intended for the core team.
    *   **Sovereignty USB Boot:** Implementation of the "sovereignty USB boot" concept (found in `docs/SOVEREIGNTY-USB-BOOT.md`).
    *   **Phone Orbitals:** Likely relates to the `src/connectors/phoneTermuxConnector.js` and associated logic.

### The "47D Milestone" Group
The following branches are all currently pointed at commit `217ec3f` ("47D Brown-Hilbert cube + real engines + full gate wiring"):
*   `master`
*   `staging`
*   `ai/awareness`, `ai/mistake-to-dimension`, `ai/self-diagnosis`
*   `brown-hilbert/canon`, `brown-hilbert/shadow-sync`
*   `cube/*` (all 15+ cube branches, e.g., `cube/d47-boundary`, `cube/d25-trinity`)
*   `sovereignty/usb-mirror`
*   `liris/shadow`
*   `acer/shadow`

These branches represent a stable snapshot of the "47D Brown-Hilbert cube" implementation, including the full gate wiring and core engine logic.

### `main` (Legacy / Landing)
The `main` branch is significantly behind the others and serves as a minimal landing page.
*   **Gap:** Over 7,000 files behind the `dev` branch.
*   **Status:** Not suitable for active development; use `dev` or `master` instead.

## Structural Differences Summary

| Feature / File | `dev` Branch | `47D Milestone` (Master/Cube/AI) |
| :--- | :--- | :--- |
| **README.md** | Rewritten for "honest architecture" | Original 47D version |
| **docs/SOVEREIGNTY-USB-BOOT.md** | Present (Concept & Implementation) | Absent |
| **src/connectors/phoneTermuxConnector.js** | Present | Absent |
| **Brown-Hilbert Cube** | 47D + Orbitals Concept | 47D Baseline |

## Recommendation for Interaction
For any work involving the full feature set or the latest architectural direction, **always work on the `dev` branch**. The specialized branches (`cube/*`, `ai/*`) appear to be frozen at the 47D milestone and should likely be used only if specifically requested for isolation testing or if they diverge in the future.
