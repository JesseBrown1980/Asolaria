#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

export PC_BRIDGE_PORT="${PC_BRIDGE_PORT:-8765}"
export BRIDGE_SHARED_TOKEN="${BRIDGE_SHARED_TOKEN:-change_me}"
export HEARTBEAT_INTERVAL_SECONDS="${HEARTBEAT_INTERVAL_SECONDS:-8}"

python "${SCRIPT_DIR}/phone_agent.py"
