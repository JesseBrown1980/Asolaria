#!/usr/bin/env python3
"""CPU-only conditional weight generation for compact Mythos glyph regions.

A low-rank hypernetwork generates different output matrices from a hidden
neighborhood descriptor z of the local 8x8 meta-pixel tile:
    W(z) = A @ diag(tanh(z @ G + g)) @ B.
A frozen trained CNN supplies base logits and local descriptor z supplies
conditional residual logits: logit'=logit_CNN + z @ W(z) + b.

The generated regional matrices are not independent parameter arrays and the
training is ordinary CPU backprop, NOT a GPT model editing weights. We compare
an explicit constant-rank adapter, frozen output-bias edit and local-density
lookup baseline on the exact same held-out 12 tiles.
"""
import argparse
import hashlib
import json
import math
import os
import time
from pathlib import Path

import numpy as np

import train_glyph27_cpu as core

SEED=20261112


def descriptors(cols):
    # Center is masked by the original generator. No true center labels
    # enter the local descriptor. All 3x3 neighborhoods stay in their 8x8 tile.
    n=len(cols)
    small=cols[:,4].reshape(n,3,3,6)
    avg=small.mean(axis=(1,2))
    r=small[:,1,2,:3]-small[:,1,0,:3]
    d=small[:,2,1,3:]-small[:,0,1,3:]
    z=np.concatenate((avg,r,d),axis=1)
    assert z.shape==(4096,12) and np.all(np.isfinite(z))
    return z


def adam(weights, grads, m, v, t, lr):
    for k,g in grads.items():
        m[k]=.9*m[k]+.1*g
        v[k]=.999*v[k]+.001*(g*g)
        weights[k]-=lr*(m[k]/(1-.9**t))/(np.sqrt(v[k]/(1-.999**t))+1e-8)


def init_adapter(style):
    rng=np.random.default_rng(SEED+83)
    weights={
        "A": rng.normal(0,.07,(12,4)),
        "B": rng.normal(0,.07,(4,3)),
        "bias": np.zeros(3),
    }
    if style=="conditional":
        weights["G"]=rng.normal(0,.1,(12,4))
        weights["g"]=rng.normal(0,.03,4)
    return weights


def adapter_forward(z,base,w,style):
    q=z@w["A"]
    if style=="conditional":
        gate=np.tanh(z@w["G"]+w["g"])
    else:
        gate=np.ones_like(q)
    adj=(q*gate)@w["B"]+w["bias"]
    logits=base+adj
    return core.sigmoid(logits), (q,gate)


def train_adapter(style,z,base,labels,train,val,weights_positive):
    rng=np.random.default_rng(SEED+(41 if style=="conditional" else 42))
    w=init_adapter(style)
    moments={k:np.zeros_like(v) for k,v in w.items()}
    powers={k:np.zeros_like(v) for k,v in w.items()}
    best=None
    best_loss=float("inf")
    for step in range(1,901):
        i=rng.choice(train,size=128,replace=True)
        zx=z[i]; y=labels[i]
        pred,(q,gate)=adapter_forward(zx,base[i],w,style)
        d=(pred-y)*np.where(y>0,weights_positive,1)/(128*3)
        back=d@w["B"].T
        grads={
            "B": (q*gate).T@d,
            "A": zx.T@(back*gate),
            "bias": d.sum(axis=0),
        }
        if style=="conditional":
            theta=back*q*(1-gate*gate)
            grads["G"]=zx.T@theta
            grads["g"]=theta.sum(axis=0)
        adam(w,grads,moments,powers,step,.012)
        if step%30==0:
            vp,_=adapter_forward(z[val],base[val],w,style)
            # Validation macro BCE only, no test labels considered.
            score=core.bce(vp,labels[val])
            if score<best_loss:
                best_loss=score
                best={k:v.copy() for k,v in w.items()}
    assert best is not None
    return best,best_loss


def bias_only_train(base,labels,train,val):
    # Three post-training output-bias edits, no gradient update to base CNN.
    best=np.zeros(3)
    best_loss=float("inf")
    for shift in np.arange(-2,2.01,.1):
        candidate=core.sigmoid(base[val]+shift)
        # Common single shift is optimized against validation only.
        score=core.bce(candidate,labels[val])
        if score<best_loss:
            best_loss=score
            best[:]=shift
    return best,best_loss


def classify(y,p,val,test):
    thresholds=[
        core.choose_threshold(y[val,c],p[val,c]) for c in range(3)
    ]
    return {
        "validation":[core.score_binary(y[val,c],p[val,c],thresholds[c])
                      for c in range(3)],
        "test":[core.score_binary(y[test,c],p[test,c],thresholds[c])
                for c in range(3)],
    }


def hash_weights(w):
    h=hashlib.sha256()
    for k in sorted(w):
        h.update(k.encode("ascii")+b"\0")
        h.update(np.asarray(w[k],dtype="<f8").tobytes())
    return h.hexdigest()


def run(args):
    start=time.monotonic()
    _,meta,arrays,word=core.read_gguf(args.source)
    vocabulary,glyphs,_=core.codec(word)
    split,split_hash=core.split_tiles()
    cols,labels,groups,_,_=core.make_data(
        arrays,word,glyphs,vocabulary,split
    )
    tr,va,te=(groups[k] for k in ("train","validation","test"))
    z=descriptors(cols)
    cnn,positive,_=core.train_cnn(cols,labels,groups)
    base=core.cnn_predict(cols,cnn)
    base_logits=np.log(np.clip(base,1e-12,1-1e-12))-np.log1p(
        -np.clip(base,1e-12,1-1e-12)
    )
    class_weights=np.minimum(25.0,
        (len(tr)-np.array(positive,dtype=float))/np.array(positive)
    )
    hyper,vloss_h=train_adapter(
        "conditional",z,base_logits,labels,tr,va,class_weights
    )
    static,vloss_s=train_adapter(
        "static",z,base_logits,labels,tr,va,class_weights
    )
    calibrated_bias,vloss_b=bias_only_train(
        base_logits,labels,tr,va
    )
    p_h,_=adapter_forward(z,base_logits,hyper,"conditional")
    p_s,_=adapter_forward(z,base_logits,static,"static")
    p_b=core.sigmoid(base_logits+calibrated_bias)
    p_neighbor=core.calibrated_neighbor(cols,labels,tr)
    methods={
        "original_cnn":base,
        "conditional_hypernetwork":p_h,
        "static_lowrank":p_s,
        "bias_surgery":p_b,
        "neighbor_density":p_neighbor,
        "all_empty":np.zeros_like(base),
    }
    results={name:classify(labels,p,va,te)
             for name,p in methods.items()}
    # The dynamic weight matrix must vary with the source's spatial context.
    gates=np.tanh(z@hyper["G"]+hyper["g"])
    assert np.any(np.std(gates,axis=0)>1e-8), "not_state_conditional"
    one=hyper["A"]@np.diag(gates[tr[0]])@hyper["B"]
    two=hyper["A"]@np.diag(gates[tr[-1]])@hyper["B"]
    assert not np.array_equal(one,two), "identical_generated_matrices"
    # Mutating a single learned weight must alter real predictions.
    tampered={k:v.copy() for k,v in hyper.items()}
    tampered["B"][0,0]+=0.5
    mutated,_=adapter_forward(z[te],base_logits[te],tampered,"conditional")
    assert np.max(np.abs(mutated-p_h[te]))>1e-7, "sabotage_not_detected"

    param_counts={
        "original_cnn":sum(v.size for v in cnn.values()),
        "conditional_hypernetwork":sum(v.size for v in hyper.values()),
        "static_lowrank":sum(v.size for v in static.values()),
        "bias_surgery":3,
    }
    # Compare base CNN against patch-conditionals only on strictly held-out
    # tiles. Validation was used for early stopping and thresholds.
    test_f1={k:sum(x["f1"] for x in val["test"])/3
             for k,val in results.items()}
    report={
        "schema":"MYTHOS-GLYPH27-HYPERNET-CPU-V1",
        "source_sha256":core.EXPECTED_SHA,
        "source_architecture":meta["general.architecture"],
        "meta_pixel_tiles":64,
        "train_tiles":40,
        "validation_tiles":12,
        "test_tiles":12,
        "split_sha256":split_hash,
        "training_device":"CPU_NUMPY_ONLY",
        "regional_weight_generator":"W(z)=A*diag(tanh(zG+g))*B",
        "generated_matrix_shape":[12,3],
        "rank":4,
        "regional_weights_shared_parameters":True,
        "parameters":param_counts,
        "validation_bce":{
            "hypernet":vloss_h,"static":vloss_s,"bias":vloss_b,
        },
        "learned_weight_sha256":{
            "cnn":core.parameter_sha(cnn),
            "hypernet":hash_weights(hyper),
            "static":hash_weights(static),
        },
        "dynamic_gates_std":gates.std(axis=0).tolist(),
        "matrix_varies_across_positions":True,
        "tamper_prediction_detection":True,
        "binary_models":results,
        "test_macro_f1":test_f1,
        "heldout_neural_vs_neighbor":(
            "HYPERNET_BETTER" if test_f1["conditional_hypernetwork"]>
            test_f1["neighbor_density"] else "NEIGHBOR_BETTER_OR_EQUAL"
        ),
        "limits":[
            "This is ordinary gradient-trained hypernetwork, not direct GPT6 weight editing.",
            "The matrices are virtual per-site conditional output weights; no explicit GPU used.",
            "The model still operates on an Asolaria-coded GGUF, not Anthropic original Mythos weights.",
            "No particle-identification or quantum-physics interpretation proven.",
            "Validation-selected thresholds; test labels never used for model optimization.",
            "Single small sparse data file; generalization needs independent external sources."
        ],
        "wall_seconds":round(time.monotonic()-start,3)
    }
    args.out.mkdir(parents=True,exist_ok=True)
    (args.out/"HYPERNET-RESULT.json").write_text(
        json.dumps(report,sort_keys=True,indent=2)+"\n",encoding="utf-8"
    )
    np.savez_compressed(args.out/"HYPERNET-WEIGHTS.npz",
        **{"hyper_"+k:v for k,v in hyper.items()},
        **{"static_"+k:v for k,v in static.items()},
        **{"cnn_"+k:v for k,v in cnn.items()})
    (args.out/"HYPERNET-SHA256SUMS").write_text(
        "".join(hashlib.sha256(p.read_bytes()).hexdigest()+
                "  "+p.name+"\n" for p in
                (args.out/"HYPERNET-RESULT.json",
                 args.out/"HYPERNET-WEIGHTS.npz")),
        encoding="ascii")
    print("MYTHOS_HYPER_SOURCE|sha256=%s|region=8x8|train=40|"
          "validation=12|test=12|splits=%s|json=0" %(
              core.EXPECTED_SHA,split_hash),flush=True)
    for k,score in results.items():
        print("MYTHOS_HYPER_TEST|model=%s|macro_F1=%.6f|"
              "F1_A=%.6f|F1_B=%.6f|F1_C=%.6f|"
              "balanced_A=%.6f|balanced_B=%.6f|balanced_C=%.6f|json=0"%(
              k,test_f1[k],*[a["f1"] for a in score["test"]],
              *[a["balanced_accuracy"] for a in score["test"]]
          ),flush=True)
    print("MYTHOS_HYPER_RESULT|comparison=%s|"
          "conditioned_output_matrix_varies=PASS|"
          "perturbed_weight_control=PASS|cpu=PASS|"
          "original_anthropic_weights=NOT_ESTABLISHED|json=0"%(
          report["heldout_neural_vs_neighbor"]),flush=True)


def main():
    args=argparse.ArgumentParser()
    args.add_argument("--source",type=Path,required=True)
    args.add_argument("--out",type=Path,required=True)
    a=args.parse_args()
    core.need(os.environ.get("CUDA_VISIBLE_DEVICES","")=="",
              "GPU_must_be_disabled")
    run(a)


if __name__=="__main__":
    main()
