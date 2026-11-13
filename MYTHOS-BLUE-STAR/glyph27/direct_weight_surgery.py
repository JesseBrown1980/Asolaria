#!/usr/bin/env python3
"""Precommitted, gradient-free surgery on the actual Asolaria 919-weight CNN.

Read WEIGHT-SURGERY-FREEZE.hbp before this program; the hypothesis, edit,
comparison models, seeds and metrics were frozen before the first evaluation.
This is a preliminary, REUSED held-out partition, not external generalization.
"""
import copy
import hashlib
import json
import math
import os
from pathlib import Path

import numpy as np
import train_glyph27_cpu as core

SOURCE = Path("MYTHOS-BLUE-STAR/ACER-MYTHOS-BLUE.gguf")
FREEZE = Path("MYTHOS-BLUE-STAR/glyph27/WEIGHT-SURGERY-FREEZE.hbp")
EXPECTED_BASE_SHA = "353bd7a5e9f0a574b0d7d85f4e74ae8a4367e4a9a92b930585377406e8df73df"
EXPECTED_SPLIT_SHA = "1312f2cdb9ff54c0b2952d4c6f94aea5e5aa687cedb925289222fa747ce32cbd"
RANDOM_SEED = 271828
N_RANDOM = 64
N_BOOT = 1000

def eval_one(name, probabilities, labels, groups):
    val, test = groups["validation"], groups["test"]
    thresholds=[core.choose_threshold(labels[val,c], probabilities[val,c]) for c in range(3)]
    channel=[core.score_binary(labels[test,c], probabilities[test,c], thresholds[c]) for c in range(3)]
    return {
        "model":name,
        "validation_threshold":thresholds,
        "test_macro_f1":float(np.mean([v["f1"] for v in channel])),
        "test_macro_balanced_accuracy":float(np.mean([v["balanced_accuracy"] for v in channel])),
        "test_macro_average_precision":float(np.mean([v["ap"] for v in channel])),
        "test_logloss":float(core.bce(probabilities[test], labels[test])),
        "test_brier":float(np.mean((probabilities[test]-labels[test])**2)),
        "test_channel":channel,
    }

def main():
    assert os.environ.get("CUDA_VISIBLE_DEVICES", "") == "", "CPU_ONLY"
    freeze=FREEZE.read_text(encoding="utf-8")
    assert "status=SEALED_BEFORE_EVALUATION" in freeze
    assert "64_equal_norm_random_bias_directions_seed_271828" in freeze
    _, metadata, arrays, words=core.read_gguf(SOURCE)
    assert metadata["general.architecture"]=="asolaria-three-beings-rgb"
    vocab,glyphs,_=core.codec(words)
    split,split_sha=core.split_tiles()
    assert split_sha==EXPECTED_SPLIT_SHA
    cols,labels,groups,_,_=core.make_data(arrays,words,glyphs,vocab,split)
    weights,positives,_=core.train_cnn(cols,labels,groups)
    # Reproductions across hosted CPU/BLAS runners show distinct full-precision
    # hashes despite identical six-decimal trained output parameters.
    # This tolerance accepts ONLY the exact audited 16x3 and 3-bias values
    # printed in the initial pre-edit audit, not an arbitrary new model.
    actual_base_sha=core.parameter_sha(weights)
    audit_w2=np.array([[-0.393215,-1.13216,0.107497],[-0.24681,-0.468368,-1.234052],[-0.6531,-0.07824,0.321201],[0.149102,0.971563,-0.981463],[1.104304,-0.244764,-0.396612],[0.417498,-0.375386,-1.198248],[-0.540557,-2.173013,0.069936],[-0.405725,0.275228,-0.186711],[0.205658,0.35178,0.358505],[0.445309,0.662932,0.778191],[0.451767,-0.439316,0.113359],[-0.870144,-0.477935,-0.980528],[-0.040803,-0.091557,0.004068],[-0.883143,0.242228,0.096389],[-0.092191,-0.08397,-0.01659],[-0.07796,-0.830822,0.340046]],dtype=float)
    audit_b2=np.array([-0.244262,-0.264269,-0.289822],dtype=float)
    assert np.allclose(weights["w2"],audit_w2,rtol=0,atol=6e-7), "output_layer_drift"
    assert np.allclose(weights["b2"],audit_b2,rtol=0,atol=6e-7), "output_bias_drift"
    print("WEIGHT_SURGERY_BASE|full_sha="+actual_base_sha+
          "|frozen_sha="+EXPECTED_BASE_SHA+
          "|audited_output_within_6e-7=PASS|json=0",flush=True)
    assert sum(x.size for x in weights.values())==919
    train=groups["train"]
    class_weight=np.minimum(25.,(len(train)-np.array(positives))/np.array(positives))
    # Direct, analytic correction for the class-weighted BCE training recipe.
    # If fitted weighted odds are c times true odds, subtract log(c) from b2.
    shift=-np.log(class_weight)
    assert np.allclose(shift,[-3.2188758248682006,-3.1129035012989688,-3.2188758248682006],atol=1e-10)

    edit={k:v.copy() for k,v in weights.items()}
    edit["b2"] += shift
    assert all(np.array_equal(weights[k],edit[k]) for k in weights if k!="b2")
    assert np.count_nonzero(weights["b2"]!=edit["b2"])==3
    assert np.allclose(edit["b2"]-weights["b2"],shift,rtol=0,atol=1e-15)

    norm_edit={k:v.copy() for k,v in weights.items()}
    norms=np.linalg.norm(weights["w2"],axis=0)
    target_norm=float(np.median(norms))
    assert norms[1]>norms[2]>norms[0]
    ratio=target_norm/norms[1]
    assert abs(ratio-0.8121453330436265)<1e-6
    norm_edit["w2"][:,1]*=ratio
    combo={k:v.copy() for k,v in norm_edit.items()}
    combo["b2"]+=shift

    p_base=core.cnn_predict(cols,weights)
    p_bias=core.cnn_predict(cols,edit)
    p_norm=core.cnn_predict(cols,norm_edit)
    p_combo=core.cnn_predict(cols,combo)
    p_neighbor=core.calibrated_neighbor(cols,labels,train)
    p_reverse=core.cnn_predict(cols,{**weights,"b2":weights["b2"]-shift})

    # Verify output-bias edits equal a direct log-odds shift.
    old_logit=np.log(np.clip(p_base,1e-12,1-1e-12))-np.log1p(-np.clip(p_base,1e-12,1-1e-12))
    assert np.allclose(p_bias,core.sigmoid(old_logit+shift),rtol=0,atol=1e-13)

    candidates=[
        ("unaltered_cnn",p_base),
        ("raw_weight_bias_surgery_3_parameters",p_bias),
        ("raw_weight_B_norm_equalization_16_parameters",p_norm),
        ("combined_bias_plus_B_norm",p_combo),
        ("opposite_sign_bias_sabotage",p_reverse),
        ("nonneural_neighbor_density",p_neighbor),
    ]
    scores={name:eval_one(name,p,labels,groups) for name,p in candidates}
    assert abs(scores["unaltered_cnn"]["test_macro_f1"]-0.288584)<0.000003
    for name in scores:
        print("WEIGHT_SURGERY_TEST|"+json.dumps(scores[name],sort_keys=True,separators=(",",":"))+"|json=0",flush=True)

    # Fixed random directions, matched to the L2 magnitude of the three bias edits.
    # Random controls are *not* optimized/selected; record the entire distribution.
    rng=np.random.default_rng(RANDOM_SEED)
    random_logloss=[]
    random_f1=[]
    for i in range(N_RANDOM):
        direction=rng.normal(size=3)
        direction/=np.linalg.norm(direction)
        b=weights["b2"]+direction*np.linalg.norm(shift)
        prob=core.cnn_predict(cols,{**weights,"b2":b})
        result=eval_one("random_bias_"+str(i),prob,labels,groups)
        random_logloss.append(result["test_logloss"])
        random_f1.append(result["test_macro_f1"])
    random_logloss=np.array(random_logloss)
    random_f1=np.array(random_f1)
    target=scores["raw_weight_bias_surgery_3_parameters"]
    random_summary={
        "n":N_RANDOM,"seed":RANDOM_SEED,"matched_parameter_count":3,
        "matched_l2_norm":float(np.linalg.norm(shift)),
        "random_test_logloss_min_median_max":[float(np.min(random_logloss)),float(np.median(random_logloss)),float(np.max(random_logloss))],
        "random_test_f1_min_median_max":[float(np.min(random_f1)),float(np.median(random_f1)),float(np.max(random_f1))],
        "random_test_logloss_at_most_proposed":int(np.sum(random_logloss<=target["test_logloss"])),
        "random_test_f1_at_least_proposed":int(np.sum(random_f1>=target["test_macro_f1"])),
    }
    print("WEIGHT_SURGERY_RANDOM_CONTROLS|"+json.dumps(random_summary,sort_keys=True,separators=(",",":"))+"|json=0",flush=True)

    # Paired cluster bootstrap by held-out 8x8 tile; no edits use the result.
    test=groups["test"]
    tileids=test//64
    unique=np.unique(tileids)
    assert len(unique)==12 and all(np.sum(tileids==v)==64 for v in unique)
    y_test=labels[test]
    b_test=p_base[test]
    s_test=p_bias[test]
    rng_boot=np.random.default_rng(20261113)
    cluster_deltas=np.empty(N_BOOT)
    for i in range(N_BOOT):
        tiles=rng_boot.choice(unique,size=len(unique),replace=True)
        indices=np.concatenate([np.flatnonzero(tileids==t) for t in tiles])
        cluster_deltas[i]=core.bce(s_test[indices],y_test[indices])-core.bce(b_test[indices],y_test[indices])
    ci=np.quantile(cluster_deltas,[.025,.5,.975]).tolist()
    estimated=float(core.bce(s_test,y_test)-core.bce(b_test,y_test))
    bootstrap={
        "test_logloss_delta_surgery_minus_unchanged":estimated,
        "tile_cluster_bootstrap_95pct_interval":[float(ci[0]),float(ci[2])],
        "bootstrap_median":float(ci[1]),
        "tiles":12,"bootstrap_draws":N_BOOT,
        "test_partition_previously_published":True
    }
    print("WEIGHT_SURGERY_BOOTSTRAP|"+json.dumps(bootstrap,sort_keys=True,separators=(",",":"))+"|json=0",flush=True)

    result={
        "schema":"ASOLARIA-WEIGHT-SPACE-SURGERY-CPU-V1",
        "freeze_sha256":hashlib.sha256(FREEZE.read_bytes()).hexdigest(),
        "source_sha256":core.EXPECTED_SHA,
        "trained_base_weight_sha256":core.parameter_sha(weights),
        "surgery_weight_sha256":core.parameter_sha(edit),
        "changed_output_parameters":3,
        "primary_edit_shift":shift.tolist(),
        "per_channel_training_class_weight":class_weight.tolist(),
        "secondary_weight_only_B_norm_ratio":ratio,
        "models":scores,
        "negative_controls":random_summary,
        "tile_bootstrap":bootstrap,
        "device":"CPU_ONLY",
        "limitations":[
            "Heldout test split was previously published and is not independent new-source generalization.",
            "Correcting class-weighted odds is theoretically motivated but not guaranteed to improve this CNN.",
            "No GPT authored pretrained Anthropic weights and no quantum simulation is performed.",
            "This is a direct small-model weight edit, not hypernetwork training and not a claim of universal optimal weights."
        ]
    }
    Path("weight_surgery_result.json").write_text(json.dumps(result,sort_keys=True,indent=2)+"\n",encoding="utf-8")
    print("WEIGHT_SURGERY|status=PASS|source=VERIFIED|base=NUMERIC_AUDIT_MATCH|"
          "training=BASE_CNN_ONLY|edit=NO_GRADIENTS|edited_parameters=3|"
          "controls=64_RANDOM_PLUS_NEIGHBOR_PLUS_OPPOSITE|"
          "test_data_not_used_for_edit=PASS|cpu=PASS|"
          "improvement_not_assumed=YES|json=0",flush=True)

if __name__=="__main__":
    main()
