# Asolaria direct weight-space surgery — 12 November 2026

**Status:** CPU evaluation completed and checks passed on [hosted run 43344383974](https://github.com/JesseBrown1980/Asolaria/actions/runs/43344383974). This is an exploratory single-source result, not a new-source generalization study or an Anthropic Mythos reproduction.

## Motivation and actual weight inspection

The small glyph27 CNN has **919** parameters and a **16×3** output matrix. Before authoring the edit, a separate read-only job printed the complete learned output matrix, biases, column norms, class imbalance, training-derived weights and validation scores. [Read-only audit run 43343724140](https://github.com/JesseBrown1980/Asolaria/actions/runs/43343724140).

Audited output norms were A=2.124366, B=3.032951, C=2.463197. Audited output biases were approximately (-0.244262, -0.264269, -0.289822). The CNN was trained using a class-weighted binary cross-entropy loss. On validation, its mean probabilities were (0.365649, 0.295518, 0.181846), substantially above validation positive rates (46, 33, 42) / 768.

**Hypothesis frozen before evaluation:** weighted binary cross-entropy can bias predicted odds upward by a class-specific positive weight c. Under the ideal weighted-optimum assumption, subtracting log(c) from each output bias restores probabilities on an unweighted scale. We inspect both architecture/training metadata and the actual weight matrix. This is not a model-weight edit inferred *from raw weights alone*.

**Primary surgery:** change **only 3 of the 919 parameters**, with no post-edit gradient training:

```python
class_weight = minimum(25, (n_train - positives_train) / positives_train)
edited_weights['b2'] = original_weights['b2'] - log(class_weight)
# Actual three shifts: (-3.2188758249, -3.1129035013, -3.2188758249)
# Everything else is unchanged.
```

**Secondary surgery:** equalize the B column output L2 norm to the median channel norm by multiplying its 16 entries by approximately 0.8121453330. This is the separate, purely output-weight-based proposal. It is reported whether it helps or not.

The pre-evaluation hypotheses, source hash, original audit weights, split, random control seed and outcome metrics are published in [WEIGHT-SURGERY-FREEZE.hbp](WEIGHT-SURGERY-FREEZE.hbp). One initial run stopped *before evaluation* because two hosted CPUs generated identical six-decimal output matrices but distinct exact full-precision model hashes. The acceptance code was corrected to verify the pre-inspected output matrix and biases to absolute tolerance 6×10^-7, report the raw weight SHA of every reproduction, and leave the edit hypothesis unchanged.

## Results on reused 12 held-out spatial tiles

All figures use the same train/validation/test tiles as the original glyph27 experiment. Test tiles have **768** central positions and three binary labels per position. Thresholds are chosen using validation only. **The test set was previously published**, so results must be considered exploratory rather than genuinely new blind data.

| Model | Test log loss ↓ | Test Brier ↓ | Test macro F1 ↑ | Test macro average precision ↑ |
| --- | ---: | ---: | ---: | ---: |
| Unedited 919-parameter CNN | 0.473760 | 0.148483 | 0.288584 | 0.307313 |
| **3-bias analytic surgery** | **0.151977** | **0.045012** | **0.295491** | 0.307313 |
| B-column output norm edit (16 entries) | 0.460842 | 0.145655 | 0.291171 | 0.307313 |
| Combined bias and B-column edit | 0.151251 | 0.044753 | 0.282609 | 0.307313 |
| Opposite-sign bias sabotage | 1.967089 | 0.575098 | 0.320262 | 0.307313 |
| **Nonneural neighboring-density rule** | **0.140798** | **0.040101** | **0.473185** | **0.383616** |

**Main finding:** changing 3 biases reduced log loss from 0.473760 to 0.151977 (a **67.9% reduction**) and Brier from 0.148483 to 0.045012. F1 improved only slightly. **Average precision did not improve** because channelwise bias shifts preserve within-channel ranking. The simple neighbor rule still beats the edited CNN on every listed metric.

Random controls: 64 fixed-seed bias edits of the *same parameter count and L2 edit magnitude* were evaluated, without selecting a winner. **0/64** had lower test log loss than the analytic edit; **23/64** had higher or equal test macro F1. These controls do not prove causal superiority against all possible weight-edit algorithms. The opposite-sign control improves macro F1 but ruins probability quality, illustrating why multiple metrics matter.

Twelve-tile paired bootstrap (1,000 resamples): estimated test log-loss change (edited minus unchanged) **-0.321783**, 95% percentile interval **[-0.394354, -0.252660]**. This interval describes variability over these existing tiles, not generalization across new GGUF sources.

## Interpretation and limits

- This is **direct GPT-6-authored weight editing**, not a post-edit gradient-trained hypernetwork: the initial CNN was previously trained normally, then 3 of its stored bias values were replaced analytically.
- The rule uses the inspected weights **and** knowledge of the model's class-weighted training objective; it is not evidence that the LLM could identify the repair from tensor values alone.
- The 16-element output-norm intervention changed the output weights directly, but improved log loss only modestly and did not beat the neighbor method.
- This shows calibration repair, **not improved ranking**, and does not demonstrate universal optimal parameter assignment to spatial nodes, actual qubits, quantum dynamics, original Anthropic model capabilities or savings across independent external GGUFs.
- Full-precision model SHA can differ slightly across CPU runners; source GGUF SHA stays fixed, and audited output weights are numerically checked on every run.
- No original source weights were overwritten. The test is CPU-only with NumPy 2.2.6, no CUDA.

## Reproduction

```bash
export CUDA_VISIBLE_DEVICES=
export OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1
pip install numpy==2.2.6
python -B MYTHOS-BLUE-STAR/glyph27/audit_weight_space.py
python -B MYTHOS-BLUE-STAR/glyph27/direct_weight_surgery.py
```

[Workflow](../../.github/workflows/weight-space-surgery-cpu.yml) · [Audit script](audit_weight_space.py) · [Surgery and controls](direct_weight_surgery.py) · [Frozen specification](WEIGHT-SURGERY-FREEZE.hbp) · [Hosted test and downloadable JSON report](https://github.com/JesseBrown1980/Asolaria/actions/runs/43344383974)

Next falsifier: same frozen surgery principle on **different GGUF sources** and model families, with genuine source-held-out predictions and matched compute/memory accounting. The spatial hypernetwork remains a separate model requiring independent validation.
