#!/usr/bin/env python3
"""CPU-only Mythos Blue GGUF -> exact 27 glyphs -> held-out glyph learners.

The archived 50,752-byte Asolaria GGUF is NOT Anthropic Mythos weights.
The exact codec preserves all 12,288 source F32 bit patterns; its 100%
round-trip does not represent a neural-network prediction score.

Two learned modules: spatial 3x3 CNN trained on neighbor patches to predict
nonempty locations, and a tiny 27-token neural sequence model predicting the
next glyph. Strict 8x8 tile-separated train/validation/test positions are
used. Both models run with NumPy on CPU and no GPU dependencies.
"""
import argparse
import hashlib
import json
import math
import os
import random
import struct
import time
from pathlib import Path

import numpy as np

EXPECTED_SHA = "3dd92a42160a38c121980957ce9eabbea216678892801d7ea3ed4e99e96c3aae"
EXPECTED_BYTES = 50752
SEED = 20261112
TILE = 8
CHANNELS = ("A", "B", "C")


def read_gguf(path):
    source = path.read_bytes()
    need(hashlib.sha256(source).hexdigest() == EXPECTED_SHA,
         "GGUF_sha256_does_not_match_archive")
    need(len(source) == EXPECTED_BYTES, "GGUF_size_mismatch")
    pos = 0

    def get(fmt):
        nonlocal pos
        n = struct.calcsize(fmt)
        need(pos + n <= len(source), "truncated_GGUF")
        value = struct.unpack_from(fmt, source, pos)[0]
        pos += n
        return value

    def text():
        nonlocal pos
        count = get("<Q")
        need(count <= 10000, "malformed_GGUF_string")
        end = pos + count
        need(end <= len(source), "GGUF_string_out_of_range")
        out = source[pos:end].decode("utf-8")
        pos = end
        return out

    def value(kind):
        if kind == 0:
            return get("<B")
        if kind == 4:
            return get("<I")
        if kind == 8:
            return text()
        if kind == 9:
            inner = get("<I")
            count = get("<Q")
            need(count <= 100000, "bad_GGUF_array")
            return [value(inner) for _ in range(count)]
        raise ValueError("unsupported_GGUF_metadata_type_" + str(kind))

    need(source[:4] == b"GGUF", "not_GGUF")
    pos = 4
    version, n_tensor, n_kv = get("<I"), get("<Q"), get("<Q")
    need((version, n_tensor, n_kv) == (3, 6, 9), "unexpected_GGUF_header")
    kv = {}
    for _ in range(n_kv):
        key = text()
        need(key not in kv, "duplicate_GGUF_metadata")
        kv[key] = value(get("<I"))
    need(kv["general.architecture"] == "asolaria-three-beings-rgb"
         and kv["general.name"] == "ACER-MYTHOS-BLUE"
         and kv["asolaria.being"] == "MYTHOS"
         and kv["asolaria.channel"] == "BLUE",
         "GGUF_identity_mismatch")
    info = {}
    for _ in range(n_tensor):
        name = text()
        nd = get("<I")
        need(nd in (1, 2) and name not in info, "GGUF_tensor_shape")
        shape = tuple(get("<Q") for _ in range(nd))
        typ = get("<I")
        offset = get("<Q")
        need(typ == 0, "tensor_not_F32")
        info[name] = (shape, offset)
    data_start = (pos + 31) // 32 * 32
    need(data_start == 832, "GGUF_tensor_alignment_changed")
    arrays, words = {}, {}
    for channel in CHANNELS:
        for kind in ("slice", "radial"):
            name = kind + "_" + channel
            shape, offset = info[name]
            n = math.prod(shape)
            need(shape == ((64, 64) if kind == "slice" else (64,)),
                 "unexpected_tensor_dims")
            start = data_start + offset
            need(start + 4 * n <= len(source), "GGUF_tensor_out_of_bounds")
            bitwords = np.frombuffer(source, dtype="<u4", count=n, offset=start)
            vals = np.frombuffer(source, dtype="<f4", count=n, offset=start)
            need(np.isfinite(vals).all(), "nonfinite_GGUF")
            words[name] = bitwords.copy().reshape(shape)
            arrays[name] = vals.copy().reshape(shape)
    need(data_start + 49664 + 256 == len(source), "GGUF_trailing_data_changed")
    return source, kv, arrays, words


def need(condition, message):
    if not condition:
        raise RuntimeError(message)


def pack_5(values):
    need(all(0 <= x < 27 for x in values), "alphabet_out_of_range")
    out = bytearray()
    acc = 0
    bits = 0
    for x in values:
        acc |= int(x) << bits
        bits += 5
        while bits >= 8:
            out.append(acc & 255)
            acc >>= 8
            bits -= 8
    if bits:
        out.append(acc & 255)
    return bytes(out)


def unpack_5(source, count):
    out, acc, bits = [], 0, 0
    offset = 0
    while len(out) < count:
        while bits < 5:
            need(offset < len(source), "short_glyph_bitpack")
            acc |= source[offset] << bits
            offset += 1
            bits += 8
        v = acc & 31
        need(v < 27, "invalid_glyph_id")
        out.append(v)
        acc >>= 5
        bits -= 5
    need(offset == len(source), "extra_glyph_bytes")
    return out


def codec(words):
    vocab = []
    glyph_maps = []
    labels = np.empty((3, 64, 64), dtype=np.uint8)
    for c, name in enumerate(("slice_A", "slice_B", "slice_C")):
        unique = sorted({int(v) for v in words[name].flat})
        need(len(unique) == (6, 6, 15)[c], "vocab_census_changed")
        mapping = {word: len(vocab) + i for i, word in enumerate(unique)}
        vocab.extend((name, word) for word in unique)
        glyph_maps.append(mapping)
        labels[c] = np.array(
            [mapping[int(word)] for word in words[name].flat],
            dtype=np.uint8
        ).reshape((64, 64))
    need(len(vocab) == 27, "not_27_glyphs")
    serialized = pack_5(labels.ravel())
    need(len(serialized) == 7680, "five_bit_length_wrong")
    decoded = np.array(unpack_5(serialized, 12288), dtype=np.uint8).reshape(labels.shape)
    need(np.array_equal(decoded, labels), "glyph_code_roundtrip_failed")
    for c, name in enumerate(("slice_A", "slice_B", "slice_C")):
        original = words[name]
        reconstructed = np.array(
            [vocab[int(glyph)][1] for glyph in decoded[c].flat],
            dtype="<u4"
        ).reshape((64, 64))
        need(np.array_equal(reconstructed, original), "F32_bits_not_preserved")
    return vocab, labels, serialized


def split_tiles():
    ids = list(range(64))
    ids.sort(key=lambda i: hashlib.sha256(
        ("MYTHOS-GLYPH27-TILE-%d-%d" % (SEED, i)).encode("ascii")
    ).digest())
    split = {"train": tuple(ids[:40]),
             "validation": tuple(ids[40:52]),
             "test": tuple(ids[52:])}
    need([len(split[k]) for k in split] == [40, 12, 12], "bad_split")
    need(len(set(sum((list(v) for v in split.values()), []))) == 64, "tile_overlap")
    checksum = hashlib.sha256(
        b"|".join(("%s:%s" % (k, ",".join(map(str, v)))).encode("ascii")
                  for k, v in split.items())
    ).hexdigest()
    return split, checksum


def make_data(arrays, words, labels, vocab, split):
    # Inputs are masked 5x5 patches; every patch stays within its own
    # 8x8 tile. The center is masked in all channels to avoid label leaks.
    # Six input channels: intensity and nonzero indicator for each slice.
    values = np.stack([arrays["slice_" + ch] for ch in CHANNELS], axis=-1)
    normalized = np.concatenate(
        [values.astype(np.float64) / 5.0,
         (values != 0).astype(np.float64)], axis=-1
    )
    labels_binary = (values != 0).astype(np.float64)
    examples, targets, tileids, left_tokens = [], [], [], []
    for tileid in range(64):
        by, bx = divmod(tileid, 8)
        y0, x0 = by * TILE, bx * TILE
        tile = normalized[y0:y0 + TILE, x0:x0 + TILE]
        for iy in range(TILE):
            for ix in range(TILE):
                patch = np.zeros((5, 5, 6), dtype=np.float64)
                for dy in range(-2, 3):
                    for dx in range(-2, 3):
                        jy, jx = iy + dy, ix + dx
                        if (0 <= jy < TILE and 0 <= jx < TILE
                                and (dy != 0 or dx != 0)):
                            patch[dy + 2, dx + 2] = tile[jy, jx]
                examples.append(patch)
                targets.append(labels_binary[y0 + iy, x0 + ix])
                tileids.append(tileid)
                if ix > 0:
                    left_tokens.append([int(labels[c, y0 + iy, x0 + ix - 1])
                                        for c in range(3)])
                else:
                    left_tokens.append([-1, -1, -1])
    patches = np.asarray(examples)
    lab = np.asarray(targets)
    tileids = np.asarray(tileids)
    left = np.asarray(left_tokens)
    need(patches.shape == (4096, 5, 5, 6), "patch_shape_wrong")
    need(not np.any(patches[:, 2, 2]), "center_label_leak")
    groups = {k: np.flatnonzero(np.isin(tileids, ids)) for k, ids in split.items()}
    need([len(groups[k]) for k in groups] == [2560, 768, 768],
         "split_row_count_wrong")
    need(not (set(groups["train"]) & set(groups["test"])), "split_row_overlap")
    # For kernel convolution, precompute the 9 positions of 3x3x6 windows
    cols = np.stack(
        [patches[:, y:y + 3, x:x + 3].reshape(4096, 54)
         for y in range(3) for x in range(3)], axis=1
    )
    return cols, lab, groups, left, labels


def sigmoid(logits):
    return 1 / (1 + np.exp(-np.clip(logits, -40, 40)))


def bce(p, y):
    x = np.clip(p, 1e-12, 1 - 1e-12)
    return float(np.mean(-y * np.log(x) - (1 - y) * np.log1p(-x)))


def init_cnn():
    rng = np.random.default_rng(SEED)
    w = {
        "wc": rng.normal(0, math.sqrt(2 / 54), (54, 12)),
        "bc": np.zeros(12),
        "w1": rng.normal(0, math.sqrt(2 / 12), (12, 16)),
        "b1": np.zeros(16),
        "w2": rng.normal(0, math.sqrt(2 / 16), (16, 3)),
        "b2": np.zeros(3),
    }
    return w


def cnn_predict(cols, w, batch=256):
    out = []
    for i in range(0, len(cols), batch):
        x = cols[i:i + batch]
        conv = np.maximum(0, np.matmul(x, w["wc"]) + w["bc"])
        pooled = np.mean(conv, axis=1)
        hidden = np.maximum(0, pooled @ w["w1"] + w["b1"])
        out.append(sigmoid(hidden @ w["w2"] + w["b2"]))
    return np.concatenate(out, axis=0)


def train_cnn(cols, lab, groups):
    rng = np.random.default_rng(SEED)
    tr = groups["train"]
    w = init_cnn()
    positives = np.sum(lab[tr], axis=0)
    neg = len(tr) - positives
    need(np.all(positives > 0), "training_positive_missing")
    classweight = np.minimum(25.0, neg / positives)
    m = {k: np.zeros_like(v) for k, v in w.items()}
    v = {k: np.zeros_like(vv) for k, vv in w.items()}
    lr = 0.008
    for step in range(1, 421):
        batchidx = rng.choice(tr, size=128, replace=True)
        x, y = cols[batchidx], lab[batchidx]
        zc = np.matmul(x, w["wc"]) + w["bc"]
        ac = np.maximum(zc, 0)
        pool = ac.mean(axis=1)
        zh = pool @ w["w1"] + w["b1"]
        ah = np.maximum(zh, 0)
        logit = ah @ w["w2"] + w["b2"]
        p = sigmoid(logit)
        g = (p - y) * np.where(y > 0, classweight, 1.0) / (128 * 3)
        grads = {}
        grads["w2"] = ah.T @ g
        grads["b2"] = np.sum(g, axis=0)
        gh = (g @ w["w2"].T) * (zh > 0)
        grads["w1"] = pool.T @ gh
        grads["b1"] = gh.sum(axis=0)
        gc = ((gh @ w["w1"].T)[:, None, :] / 9) * (zc > 0)
        grads["wc"] = np.einsum("nkd,nkf->df", x, gc, optimize=True)
        grads["bc"] = gc.sum(axis=(0, 1))
        # Adam, all parameters trained on CPU.
        for key in w:
            grad = grads[key]
            m[key] = 0.9 * m[key] + 0.1 * grad
            v[key] = 0.999 * v[key] + 0.001 * (grad * grad)
            w[key] -= lr * (m[key] / (1 - 0.9**step)) / (
                np.sqrt(v[key] / (1 - 0.999**step)) + 1e-8
            )
        need(all(np.isfinite(x).all() for x in w.values()),
             "CNN_nonfinite_parameter")
    return w, [int(x) for x in positives], [float(x) for x in classweight]


def calibrated_neighbor(cols, labels, train):
    # 8 surrounding positions of the current channel, and a one-count
    # Laplace-smoothed lookup (0..8); no trained neural net here.
    # The CNN im2col features reconstruct a 5x5 center-masked patch.
    # Use the 3x3 conv position at center (k=4): 9 blocks of six channels.
    x = cols[:, 4].reshape((-1, 3, 3, 6))
    counts = np.zeros((len(cols), 3), dtype=np.int64)
    for c in range(3):
        counts[:, c] = np.sum(x[:, :, :, c + 3] > 0, axis=(1, 2))
    out = np.empty_like(labels)
    for c in range(3):
        for count in range(9):
            mask_train = train[counts[train, c] == count]
            # Independent Laplace prior, trained on train tiles only.
            p = (float(labels[mask_train, c].sum()) + 1.0) / (
                len(mask_train) + 2.0
            )
            out[counts[:, c] == count, c] = p
    return out


def score_binary(y, p, threshold):
    y = np.asarray(y, dtype=np.int64)
    p = np.asarray(p, dtype=np.float64)
    pred = p >= threshold
    tp = int(np.sum((y == 1) & pred))
    fp = int(np.sum((y == 0) & pred))
    fn = int(np.sum((y == 1) & (~pred)))
    tn = int(np.sum((y == 0) & (~pred)))
    prec = tp / (tp + fp) if tp + fp else 0.0
    rec = tp / (tp + fn) if tp + fn else 0.0
    spec = tn / (tn + fp) if tn + fp else 0.0
    f1 = 2 * tp / (2 * tp + fp + fn) if 2 * tp + fp + fn else 0.0
    return dict(n=int(len(y)), positive=int(y.sum()), tp=tp, fp=fp, fn=fn,
                tn=tn, threshold=round(float(threshold), 5),
                precision=round(prec, 6), recall=round(rec, 6),
                specificity=round(spec, 6), f1=round(f1, 6),
                balanced_accuracy=round((rec + spec) / 2, 6),
                logloss=round(bce(p, y), 7),
                ap=round(average_precision(y, p), 6))


def average_precision(y, p):
    y = np.asarray(y, dtype=int)
    if not np.sum(y):
        return 0.0
    order = np.argsort(-p, kind="stable")
    ys = y[order]
    return float(np.sum(np.cumsum(ys)[ys == 1] /
                        (np.flatnonzero(ys == 1) + 1)) / np.sum(ys))


def choose_threshold(y, p):
    thresholds = np.arange(5, 96, 5) / 100
    best = max(thresholds,
               key=lambda t: (score_binary(y, p, t)["f1"],
                              -abs(t - 0.5), -t))
    return float(best)


def glyph_transitions(labels, group, tileids):
    # 3 independent channel-specific horizontal alphabets. Each tile
    # contributes 3*8*7 (=168) next-token tasks without boundary crossing.
    previous, following = [], []
    for tileid in tileids:
        by, bx = divmod(tileid, 8)
        y0, x0 = by * TILE, bx * TILE
        for channel in range(3):
            for yy in range(8):
                for xx in range(1, 8):
                    previous.append(int(labels[channel, y0 + yy, x0 + xx - 1]))
                    following.append(int(labels[channel, y0 + yy, x0 + xx]))
    return np.asarray(previous, dtype=np.int64), np.asarray(following, dtype=np.int64)


def init_language():
    rng = np.random.default_rng(SEED + 7)
    return {
        "emb": rng.normal(0, .15, (27, 8)),
        "w1": rng.normal(0, math.sqrt(2 / 8), (8, 16)),
        "b1": np.zeros(16),
        "w2": rng.normal(0, math.sqrt(2 / 16), (16, 27)),
        "b2": np.zeros(27),
    }


def softmax(z):
    z = z - np.max(z, axis=1, keepdims=True)
    ex = np.exp(z)
    return ex / np.sum(ex, axis=1, keepdims=True)


def train_language(a, b):
    rng = np.random.default_rng(SEED + 7)
    w = init_language()
    moments = {k: np.zeros_like(v) for k, v in w.items()}
    powers = {k: np.zeros_like(v) for k, v in w.items()}
    for step in range(1, 601):
        chosen = rng.integers(len(a), size=256)
        x, y = a[chosen], b[chosen]
        z1 = w["emb"][x] @ w["w1"] + w["b1"]
        a1 = np.maximum(z1, 0)
        p = softmax(a1 @ w["w2"] + w["b2"])
        dp = p.copy()
        dp[np.arange(len(y)), y] -= 1
        dp /= len(y)
        grad = {
            "w2": a1.T @ dp,
            "b2": dp.sum(axis=0),
        }
        dh = (dp @ w["w2"].T) * (z1 > 0)
        grad["w1"] = w["emb"][x].T @ dh
        grad["b1"] = dh.sum(axis=0)
        grad["emb"] = np.zeros_like(w["emb"])
        np.add.at(grad["emb"], x, dh @ w["w1"].T)
        for k in w:
            moments[k] = .9 * moments[k] + .1 * grad[k]
            powers[k] = .999 * powers[k] + .001 * grad[k]**2
            w[k] -= .02 * moments[k] / (1 - .9**step) / (
                np.sqrt(powers[k] / (1 - .999**step)) + 1e-8
            )
        need(all(np.isfinite(z).all() for z in w.values()),
             "glyph_language_nonfinite")
    return w


def language_predict(w, previous):
    z1 = w["emb"][previous] @ w["w1"] + w["b1"]
    return softmax(np.maximum(z1, 0) @ w["w2"] + w["b2"])


def language_baselines(a, b):
    counts = np.bincount(b, minlength=27).astype(float) + .5
    uni = counts / counts.sum()
    bi = np.ones((27, 27), dtype=float) * .5
    np.add.at(bi, (a, b), 1)
    bi /= bi.sum(axis=1, keepdims=True)
    return uni, bi


def language_metrics(probs, labels):
    need(len(probs) == len(labels), "language_eval_size")
    p = np.clip(probs[np.arange(len(labels)), labels], 1e-16, 1)
    loss = float(-np.mean(np.log(p)))
    return dict(count=int(len(labels)), accuracy=round(float(
        np.mean(np.argmax(probs, axis=1) == labels)), 6),
        nll_nats=round(loss, 7),
        bits_per_symbol=round(loss / math.log(2), 7),
        perplexity=round(math.exp(loss), 6))


def parameter_sha(w):
    h = hashlib.sha256()
    for k in sorted(w):
        h.update(k.encode("ascii") + b"\0")
        h.update(np.asarray(w[k], dtype="<f8").tobytes())
    return h.hexdigest()


def run(args):
    tick = time.monotonic()
    source, metadata, arrays, words = read_gguf(args.source)
    vocab, labels, packed = codec(words)
    split, split_hash = split_tiles()
    cols, targets, groups, left, label_tokens = make_data(
        arrays, words, labels, vocab, split
    )
    need([int(np.count_nonzero(arrays["slice_" + k])) for k in CHANNELS]
         == [153, 195, 177], "unexpected_source_sparsity")
    need(int(np.sum(targets)) == 525, "nonzero_census_wrong")

    # Missing-class and transductive vocabulary caveat: 27 symbols are
    # enumerated losslessly from the whole fixed source, independently of
    # supervised learning. No held-out frequencies are used for training.
    vocab_zero = {c: next(i for i, (name, val) in enumerate(vocab)
                          if name == "slice_" + CHANNELS[c] and val == 0)
                  for c in range(3)}
    full_counts = np.bincount(labels.flatten(), minlength=27)
    print("MYTHOS_SOURCE|bytes=%d|sha256=%s|architecture=%s|"
          "glyphs=%d|bitpacked_bytes=%d|slice_nonzero=153,195,177|"
          "codec_bit_exact=PASS|json=0" % (
              len(source), EXPECTED_SHA, metadata["general.architecture"],
              len(vocab), len(packed)
          ), flush=True)

    cnn, cnn_pos, weights = train_cnn(cols, targets, groups)
    pred_cnn = cnn_predict(cols, cnn)
    pred_neigh = calibrated_neighbor(cols, targets, groups["train"])
    baseline = np.tile(
        targets[groups["train"]].mean(axis=0),
        (len(targets), 1)
    )
    methods = {"cnn": pred_cnn, "neighbor": pred_neigh,
               "train_prior": baseline,
               "all_empty": np.zeros_like(pred_cnn)}
    binary = {}
    for name, p in methods.items():
        thresholds = [
            choose_threshold(targets[groups["validation"], c],
                             p[groups["validation"], c])
            if name != "all_empty" else 1.0
            for c in range(3)
        ]
        binary[name] = {
            "validation": [
                score_binary(targets[groups["validation"], c],
                             p[groups["validation"], c], thresholds[c])
                for c in range(3)
            ],
            "test": [
                score_binary(targets[groups["test"], c],
                             p[groups["test"], c], thresholds[c])
                for c in range(3)
            ],
        }

    prev_tr, next_tr = glyph_transitions(labels, "train", split["train"])
    prev_va, next_va = glyph_transitions(labels, "validation", split["validation"])
    prev_te, next_te = glyph_transitions(labels, "test", split["test"])
    language = train_language(prev_tr, next_tr)
    uni, bi = language_baselines(prev_tr, next_tr)
    language_results = {}
    for name, probs in (
        ("neural", language_predict(language, prev_te)),
        ("bigram", bi[prev_te]),
        ("unigram", np.tile(uni, (len(prev_te), 1))),
    ):
        language_results[name] = language_metrics(probs, next_te)
    # A lightweight compositional readout: the two independent learned
    # modules can supply two predictions without claiming that they are one
    # end-to-end jointly trained language network.
    channel_zero_id = np.array([vocab_zero[c] for c in range(3)])
    lang_probs_per_pixel = np.zeros_like(pred_cnn)
    for c in range(3):
        arr = np.tile(uni[None, :], (len(left), 1))
        hasleft = left[:, c] >= 0
        if np.any(hasleft):
            arr[hasleft] = language_predict(language, left[hasleft, c])
        lang_probs_per_pixel[:, c] = 1.0 - arr[:, channel_zero_id[c]]
    fused = .5 * pred_cnn + .5 * lang_probs_per_pixel
    fuse_cutoffs = [
        choose_threshold(targets[groups["validation"], c],
                         fused[groups["validation"], c])
        for c in range(3)
    ]
    binary["cnn_plus_language_equal_mix"] = {
        "validation": [
            score_binary(targets[groups["validation"], c],
                         fused[groups["validation"], c], fuse_cutoffs[c])
            for c in range(3)
        ],
        "test": [
            score_binary(targets[groups["test"], c],
                         fused[groups["test"], c], fuse_cutoffs[c])
            for c in range(3)
        ],
    }
    need(all(binary["all_empty"]["test"][c]["recall"] == 0
             for c in range(3)), "empty_control_should_have_zero_recall")
    need(len(prev_tr) == 6720 and len(prev_va) == 2016
         and len(prev_te) == 2016, "language_dataset_count")

    elapsed = time.monotonic() - tick
    report = {
        "schema": "MYTHOS-GLYPH27-CPU-HELDOUT-V1",
        "archive_sha256": EXPECTED_SHA,
        "provenance": "Asolaria-derived GGUF; not Anthropic source weights",
        "training_device": "CPU_ONLY_NUMPY",
        "gpu_detected_or_used": False,
        "source_bytes": len(source),
        "tensor_count": 6,
        "vocabulary_size": 27,
        "glyph_token_counts": full_counts.tolist(),
        "symbol_table": [
            {"id": i, "tensor": name, "F32_u32_bits_hex": "%08x" % bit}
            for i, (name, bit) in enumerate(vocab)
        ],
        "compression": {
            "payload_f32_bytes": 49152,
            "bitpacked_glyph_bytes": len(packed),
            "vocab_bits_bytes": 108,
            "bit_exact_roundtrip": True,
            "codec_is_not_neural_accuracy": True,
        },
        "split": {k: list(v) for k, v in split.items()},
        "split_sha256": split_hash,
        "split_method": "sha256 tile ranks, no crossing tile boundary",
        "split_examples": {k: len(v) for k, v in groups.items()},
        "split_positive_counts": {
            k: targets[v].sum(axis=0).astype(int).tolist()
            for k, v in groups.items()
        },
        "training_steps": {"cnn": 420, "token_mlp": 600},
        "cnn_parameter_sha256": parameter_sha(cnn),
        "glyph_language_parameter_sha256": parameter_sha(language),
        "cnn_pos_class_weights": weights,
        "binary_models": binary,
        "next_glyph_language_test": language_results,
        "next_glyph_train_size": len(prev_tr),
        "next_glyph_test_size": len(prev_te),
        "zero_glyphs": vocab_zero,
        "scopes": [
            "All 27 exact glyph ids learned from complete source; transductive symbol inventory.",
            "Train/validation/test tiles disjoint; local patches have no adjacent-tile input.",
            "CNN predicts nonzero event on heldout tiles; not language comprehension.",
            "Neural token language predicts next horizontal glyph, not natural language.",
            "Equal-weight CNN/token fusion is not end-to-end training.",
            "Small, sparse source; no claim of Anthropic Mythos model capabilities.",
            "A zero-only predictor can obtain high unbalanced accuracy.",
            "No GPU device or CUDA library used by the experiment.",
        ],
        "wall_seconds": round(elapsed, 3),
    }
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "REPORT.json").write_text(
        json.dumps(report, sort_keys=True, indent=2) + "\n", encoding="utf-8"
    )
    (args.out / "GLYPH27.bin").write_bytes(packed)
    np.savez_compressed(args.out / "LEARNED-WEIGHTS.npz",
                        **{"cnn_" + k: v for k, v in cnn.items()},
                        **{"lang_" + k: v for k, v in language.items()})
    (args.out / "SHA256SUMS").write_text(
        "".join("%s  %s\n" % (hashlib.sha256(path.read_bytes()).hexdigest(),
                             path.name) for path in
                (args.out / "REPORT.json", args.out / "GLYPH27.bin",
                 args.out / "LEARNED-WEIGHTS.npz")),
        encoding="ascii"
    )
    print("MYTHOS_HELDOUT|train=%d|validation=%d|test=%d|"
          "source_nonzero=%d|split_sha256=%s|json=0" % (
              len(groups["train"]), len(groups["validation"]),
              len(groups["test"]), int(targets.sum()), split_hash
          ), flush=True)
    for model in binary:
        scores = binary[model]["test"]
        print("MYTHOS_CNN_TEST|model=%s|F1_A=%.6f|F1_B=%.6f|F1_C=%.6f|"
              "balanced_A=%.6f|balanced_B=%.6f|balanced_C=%.6f|"
              "positive_A=%d|positive_B=%d|positive_C=%d|json=0" % (
                  model, *[s["f1"] for s in scores],
                  *[s["balanced_accuracy"] for s in scores],
                  *[s["positive"] for s in scores]), flush=True)
    for model, scores in language_results.items():
        print("MYTHOS_LANGUAGE_TEST|model=%s|tokens=%d|"
              "accuracy=%.6f|bits_per_token=%.7f|perplexity=%.6f|json=0" % (
                  model, scores["count"], scores["accuracy"],
                  scores["bits_per_symbol"], scores["perplexity"]
              ), flush=True)
    print("MYTHOS_GLYPH27_COMPLETE|status=PASS|training=CPU_ONLY|"
          "codec_exact=PASS|neural_test_metrics=MEASURED|"
          "original_Anthropic_weights=NOT_ESTABLISHED|"
          "walled_time_sec=%.3f|json=0" % elapsed, flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    need(os.environ.get("CUDA_VISIBLE_DEVICES", "") == "",
         "CUDA_VISIBLE_DEVICES_must_be_empty")
    random.seed(SEED)
    np.random.seed(SEED)
    run(args)


if __name__ == "__main__":
    main()
