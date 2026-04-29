#!/usr/bin/env bash
# start-bus.sh — BEHCS bus daemon launcher
#
# 2026-04-28 D14: flips canon types FIRST_MESSAGE_CANON + CANON_LOADED_ACK
# from warn-mode to enforce-mode via BEHCS_SCHEMA_ENFORCE_TYPES.
# Other types stay warn-mode (default empty per-type override).
#
# Run from C:/Users/acer/Asolaria:
#   nohup bash tools/behcs/start-bus.sh > logs/behcs-bus.out 2>&1 &
# or directly:
#   bash tools/behcs/start-bus.sh

set -e

cd "$(dirname "$0")/../.."

export BEHCS_SCHEMA_ENFORCE_TYPES="FIRST_MESSAGE_CANON,CANON_LOADED_ACK"

# Preserve any other env already set by the caller (BEHCS_PORT, BEHCS_DEVICE,
# BEHCS_ROOT, BEHCS_SCHEMA_INGRESS_MODE, BEHCS_SEND_RPS,
# BEHCS_GC_INTERVAL_MINUTES, ED25519_REGISTRY, etc.) — only the per-type
# enforce list is forced here.

NODE_BIN="${NODE_BIN:-/c/nvm4w/nodejs/node.exe}"

exec "$NODE_BIN" tools/behcs/behcs-bus.js
