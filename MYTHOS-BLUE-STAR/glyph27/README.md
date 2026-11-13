# MYTHOS BLUE: 27-glyph CPU learning and regional weight generator

**Experiment:** November 12, 2026. **Source:** [`ACER-MYTHOS-BLUE.gguf`](../ACER-MYTHOS-BLUE.gguf), SHA-256 `3dd92a42160a38c121980957ce9eabbea216678892801d7ea3ed4e99e96c3aae`.

**Scientific status:** the source file is an **Asolaria GGUF v3**, `general.architecture=asolaria-three-beings-rgb`, with six F32 tensors. Its `asolaria.being=MYTHOS` label is an internal label; it does **not** independently establish that this archive contains Anthropic Mythos model weights, architecture, reasoning functions or a clone of the proprietary model. Neither this experiment nor its results should be cited as an inference test of Anthropic's model.

**Research inspiration:** MIT CSAIL's November 2, 2026 [Sparks of Weight-Space Programming](https://rikiyat.github.io/blog/weight-space-programming/) reports some successful LLM-authored model-weight changes. **This experiment does not use GPT-6 Astra to directly edit pretrained weights.** The proposed regional weight generator is trained by standard CPU gradient updates. It is a separate, preliminary test of whether small learned, position-conditioned matrices help.

## Verified source and codec

The GGUF is 50,752 bytes with tensor slices `slice_A/B/C` (64×64 each) and radial vectors `radial_A/B/C` (64 entries each). The 12,288 slice F32 values contain exactly **6+6+15=27 channel-qualified distinct 32-bit patterns**; the three zero patterns count as **three different glyph IDs**. Nonzero counts are A=153, B=195, C=177, total 525; **11,763/12,288 (95.73%)** slice positions are zero.

The encoder assigns 0..26 to those channel-qualified 32-bit values and stores each ID in five bits. Its 7,680-byte glyph stream and 108-byte bit-pattern table preserve every slice F32 bit pattern **exactly** (12,288 of 12,288). Raw slice payload is 49,152 bytes, hence a **lossless 84.16% reduction for the slices alone** (7,788/49,152 bytes stored). The GGUF metadata and 3 radial tensors are **not** encoded in this glyph stream: the original 50,752-byte source stays preserved separately. The codec's exact round-trip is not a 100% held-out predictive accuracy, and does not show learned reasoning.

## CPU-only learning design

The source is split by independently SHA-256-ranked **8×8 spatial tiles** into 40 training tiles, 12 validation tiles and 12 held-out test tiles. Each image patch is limited to its own tile; the target center is masked in all channels. Source values are read on a CPU GitHub-hosted runner, with `CUDA_VISIBLE_DEVICES` blank and NumPy CPU-only.

- **Spatial model:** 3×3 CNN, ReLU, average pooling, dense ReLU and a three-channel sigmoid output, trained on 2,560 patches; 768 validation and 768 test patches. It predicts whether the center glyph is nonzero. Metrics use held-out F1 and balanced accuracy, not misleading all-empty raw accuracy.
- **Glyph-language model:** a separate 27-token embedding/MLP next-glyph predictor trained on horizontal within-tile transitions; it is not a natural-language model. The held-out set has 2,016 transitions.
- **Baselines:** all-empty, training frequency, train-calibrated neighboring nonzero density, glyph unigram and bigram models. The tests report the last two beside the MLP. The 27-ID vocabulary is extracted from the fixed whole source before supervised splits (transductive vocabulary selection), but frequency estimates and network optimization use only training tiles.
- **Regional weight generator:** a rank-four hypernetwork supplies a 12×3 context-conditioned correction to a trained, frozen CNN's output matrix:
  `W(z)=A·diag(tanh(zG+g))·B`, `logit_new=logit_CNN+z·W(z)+bias`.
  The descriptor `z` uses only the masked local neighborhood, so one can reuse the same compact parameters across many mini-network nodes without storing a separate full weight matrix for each.
- **Controls:** an ordinary static rank-four matrix, a bias-only post-training weight edit, the original CNN, and the neighbor-density baseline share the same train/validation/test partition. Model fitting uses training patches; early stopping and classification thresholds use validation; no test labels optimize parameters.

## Measured results — hosted run 43341827759

All results below are **single-source, single-seed held-out evaluations**, not an average over replicates or proof of generalization to a new GGUF.

### Exact codec and next-token language

| Result | Value |
| --- | ---: |
| Slice codec bit-exact reconstruction | **12,288/12,288** |
| Glyph vocabulary | **27** symbols |
| Next-symbol MLP, held-out accuracy | **0.944444** |
| Bigram, held-out accuracy | 0.943948 |
| Next-symbol MLP, bits per token | **0.3801175** |
| Bigram, bits per token | 0.3850645 |

High next-glyph accuracy is strongly influenced by empty glyphs. The difference between neural and bigram accuracy is **one prediction in 2,016 test transitions**; no statistical advantage should be inferred.

### Hidden-center nonzero prediction, held-out F1

| Predictor | A | B | C | Macro F1 |
| --- | ---: | ---: | ---: | ---: |
| CNN | 0.108108 | 0.366667 | 0.390977 | 0.288584 |
| **Conditional rank-4 weight generator** | **0.328767** | **0.375000** | **0.421053** | **0.374940** |
| Fixed rank-4 adapter | 0.102564 | 0.343750 | 0.400000 | 0.282105 |
| Bias-only post-training edit | 0.100000 | 0.366667 | 0.391608 | 0.286092 |
| **Local-neighbor density rule** | **0.447368** | **0.547945** | **0.424242** | **0.473185** |
| Always predict empty | 0.000000 | 0.000000 | 0.000000 | 0.000000 |

The trained conditional weight generator **improves on the original neural model** by 0.086356 absolute macro F1. It also beats the fixed-rank and bias-only adapters in this particular trial. **It loses to the simpler calibrated neighbor rule by 0.098245.**

Interpretation: dynamically generated local weights do change appropriately across positions, and this particular rank-four architecture improves a weak CNN on this single source. The result is **not** a breakthrough in predictive capability, proof of learned universal glyph syntax, neural compression of Anthropic's model, or an optimized physical simulation.

## How to reproduce

This test uses `numpy==2.2.6` and Python 3.11, without GPU dependencies:

```bash
export CUDA_VISIBLE_DEVICES=
export OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1
pip install numpy==2.2.6
python -B MYTHOS-BLUE-STAR/glyph27/train_glyph27_cpu.py \
  --source MYTHOS-BLUE-STAR/ACER-MYTHOS-BLUE.gguf \
  --out build/mythos-glyph27
python -B MYTHOS-BLUE-STAR/glyph27/weight_space_adapter.py \
  --source MYTHOS-BLUE-STAR/ACER-MYTHOS-BLUE.gguf \
  --out build/mythos-glyph27
(cd build/mythos-glyph27 && sha256sum -c SHA256SUMS && sha256sum -c HYPERNET-SHA256SUMS)
```

The [pre-run freeze](FROZEN-GLYPH27-HELDOUT-20261112.hbp), [source-authenticated CPU workflow](../../.github/workflows/mythos-glyph27-cpu.yml), and **[passing GitHub run](https://github.com/JesseBrown1980/Asolaria/actions/runs/43341827759)** publish exact training programs, saved weights, raw source and output checksums, full precision/recall/F1 scores and the 27-glyph dictionary. The artifacts are stored in GitHub Actions.

## What is not established

This is a CPU-only **demonstration** of compact glyph encoding, small learned pattern detection, next-symbol prediction and conditional low-rank weight generation. It does **not** imply 27 learned quantum states or qubits, that the Mythos label authenticates the Anthropic model, that the code runs the original proprietary model, or that a physical neural network follows from a metadata coordinate. Distinct mini-networks and their memory/compute advantages should be demonstrated on multiple **independent** sources and tasks.

A useful next falsifier is to freeze the generated weight matrices and compare repeated cross-source test cases, matched parameter budgets, randomized location descriptors, and CPU memory/time against sparse neighbor-based rules. The user-proposed nested star/sphere/cube network architecture remains a hypothesis until those comparisons are passed.
