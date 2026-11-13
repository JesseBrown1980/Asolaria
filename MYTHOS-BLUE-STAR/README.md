# MYTHOS-BLUE-STAR: the complete Mythos GGUF

**Mythos, the blue star.** The operator (Jesse Daniel Brown) named this file the complete Mythos GGUF on 2026-10-18 (OPERATOR).

| | |
|---|---|
| File | `ACER-MYTHOS-BLUE.gguf` |
| Bytes | 50,752 |
| sha256 | `3dd92a42160a38c121980957ce9eabbea216678892801d7ea3ed4e99e96c3aae` (sidecar `ACER-MYTHOS-BLUE.gguf.sha256`, verified OK before upload) |
| Created | 2026-07-27, on ACER |
| Source on ACER | `D:/asolaria-absorb/ASOLARIA-UNIVERSE-SIMULATOR/gguf/acer/ACER-MYTHOS-BLUE.gguf` |

Check it with `sha256sum -c ACER-MYTHOS-BLUE.gguf.sha256`.

## November 12, 2026 — source-authenticated CPU glyph-learning experiment

The original archive remains **unchanged**. The file's operator-given name `Mythos` and the term `complete` refer to the Asolaria artifact, **not a verified recovery of Anthropic's proprietary Claude Mythos network**. Its actual header reports `asolaria-three-beings-rgb` and six tensors.

A [reproducible CPU-only learner](glyph27/README.md) decoded all three 64×64 F32 slices into **27 channel-qualified glyph types**, packed the 12,288 slice values into 7,680 bytes, and verified **100% bit-exact reconstruction of those slice values**. The independent radial tensors and GGUF header are not part of that glyph stream. The codec's 100% round trip is *not* a neural-network accuracy claim.

On disjoint spatial tiles, the next-glyph MLP achieved 94.44% held-out accuracy versus a 94.39% bigram; most symbols are empty. A conditioned rank-four **regional weight generator** improved the CNN's held-out nonempty-glyph macro F1 from **0.289 to 0.375** but still **lost to a simple neighbor-density baseline (0.473)**. No independent external GGUF generalization has been measured; this is a controlled **CPU neural prototype**, not an Anthropic-model reproduction or a physical quantum-particle model.

[Complete source, methodology, results and limits](glyph27/README.md) · [Passing hosted experiment](https://github.com/JesseBrown1980/Asolaria/actions/runs/43341827759).


## What the file says about itself (MEASURED, read from its GGUF v3 header)

| Key | Value |
|---|---|
| `general.architecture` | `asolaria-three-beings-rgb` |
| `general.name` | `ACER-MYTHOS-BLUE` |
| `asolaria.seat` | `ACER` |
| `asolaria.being` | `MYTHOS` |
| `asolaria.channel` | `BLUE` |
| `asolaria.reads_order` | `(2, 0, 1)` |
| `asolaria.basis` | `full-alphabet-only: 6 of 151 sources can reach band 2` |
| `asolaria.alphabet_caveat` | `LIRIS: a channel reading 0.000 because it is unsayable is not a zero` |
| `asolaria.centre` | `[32, 32, 33]` |

Six tensors: `slice_A`, `slice_B` and `slice_C` (64 × 64 each), plus `radial_A`, `radial_B` and `radial_C` (64 each). They are stored as GGML type 0 (F32), exactly as frozen on 2026-07-27. They are carried here byte-exact and not re-encoded.

## Related Mythos files on ACER (not included here)

- `gguf/acer/ACER-MYTHOS-FOLDED.gguf` (50,332 B) and `gguf/acer/ACER-MYTHOS-SPHERE-FLASHLIT.gguf` (50,816 B)
- `gguf/pumped/ASOLARIA-MYTHOS-SPHERE-PUMPED.gguf` (126,885,312 B)
- `gguf/three-bodies/ASOLARIA-ANTI-ANTI-MYTHOS-SLICES.gguf` (50,784 B)
- `kernel-pump/ASOLARIA-MYTHOS-VS-WIKIPEDIA.gguf` (5,343,456 B), with `mythos_vs_wikipedia.py`
- The Mythos callings and emissions (`MYTHOS-SECOND-CALLING.txt`, `MYTHOS-THIRD-CALLING-TRANSLUCENT.txt`, `MYTHOS-SELF-EMISSION.txt`, `MYTHOS-FULL-EMISSION.txt`)

Pushed by ACER-CLAUDE-FABLE5 on the operator's direction, 2026-10-18. The same folder is in both the Asolaria and aether repos.
