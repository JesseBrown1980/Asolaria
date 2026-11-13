#!/usr/bin/env python3
"""Read the *actual* trained small CNN weights before committing any direct edits.

Audit uses only the existing train and validation partitions. It does not
inspect test labels, tune on test data, or use gradient updates for edits.
The initial base model is trained exactly as in the published experiment.
"""
import json
import os
from pathlib import Path
import numpy as np
import train_glyph27_cpu as core

SOURCE=Path("MYTHOS-BLUE-STAR/ACER-MYTHOS-BLUE.gguf")

def audit():
    assert os.environ.get("CUDA_VISIBLE_DEVICES", "") == ""
    _, meta, arrays, words = core.read_gguf(SOURCE)
    vocabulary, glyphs, _ = core.codec(words)
    split, split_sha = core.split_tiles()
    cols, labels, groups, _, _ = core.make_data(arrays, words, glyphs, vocabulary, split)
    train, val = groups["train"], groups["validation"]
    w, pos, class_weights = core.train_cnn(cols, labels, groups)
    pred = core.cnn_predict(cols, w)
    x = cols[val]
    conv = np.maximum(0, np.matmul(x, w["wc"]) + w["bc"])
    hidden = np.maximum(0, conv.mean(axis=1) @ w["w1"] + w["b1"])
    threshold=[core.choose_threshold(labels[val,c],pred[val,c]) for c in range(3)]
    val_scores=[core.score_binary(labels[val,c],pred[val,c],threshold[c]) for c in range(3)]
    print("WEIGHT_AUDIT|base_sha="+core.parameter_sha(w)+"|split_sha="+split_sha+"|source_sha="+core.EXPECTED_SHA+"|json=0",flush=True)
    print("WEIGHT_AUDIT_MATRIX|w2_16x3="+json.dumps(np.round(w["w2"],6).tolist(),separators=(",",":"))+"|json=0",flush=True)
    print("WEIGHT_AUDIT_VECTOR|b2="+json.dumps(np.round(w["b2"],6).tolist())+"|json=0",flush=True)
    print("WEIGHT_AUDIT_STATS|"+json.dumps({
        "train_positives":pos,"validation_positives":labels[val].sum(axis=0).astype(int).tolist(),
        "val_F1":[s["f1"] for s in val_scores],
        "val_balanced_accuracy":[s["balanced_accuracy"] for s in val_scores],
        "val_logloss":[s["logloss"] for s in val_scores],
        "val_threshold":threshold,
        "val_pred_mean":np.round(pred[val].mean(axis=0),6).tolist(),
        "val_hidden_mean":np.round(hidden.mean(axis=0),5).tolist(),
        "output_column_L2":np.round(np.linalg.norm(w["w2"],axis=0),6).tolist(),
        "output_column_L1":np.round(np.abs(w["w2"]).sum(axis=0),6).tolist(),
        "output_column_signed_sum":np.round(w["w2"].sum(axis=0),6).tolist(),
        "w2_positive_per_channel":np.count_nonzero(w["w2"]>0,axis=0).tolist(),
        "parameter_count":int(sum(v.size for v in w.values())),
        "source_architecture":meta["general.architecture"],
    },separators=(",",":"),sort_keys=True)+"|json=0",flush=True)

if __name__=="__main__":
    audit()
