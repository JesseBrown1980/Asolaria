#!/data/data/com.termux/files/usr/bin/sh
set +e

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ROOT="$HOME/.asolaria"
BIN="$ROOT/bin"
STATE="$ROOT/state"
LOG="$STATE/falcon-frontend-force-fix-$STAMP.log"
ACER_BUS="${ACER_BUS:-http://127.0.0.1:4947/behcs/send}"
ACER_HEALTH="${ACER_HEALTH:-http://127.0.0.1:4947/behcs/health}"

mkdir -p "$BIN" "$STATE"

{
  echo "$STAMP BEGIN falcon-frontend-force-fix"
  echo "whoami=$(whoami)"
  echo "home=$HOME"
  echo "pwd=$(pwd)"

  echo "STEP termux-package-update"
  pkg update -y
  echo "RC $? pkg update"

  echo "STEP termux-package-upgrade"
  pkg upgrade -y
  echo "RC $? pkg upgrade"

  echo "STEP install-required-cli"
  pkg install -y termux-api curl jq git python openssl-tool procps coreutils nano
  echo "RC $? pkg install required"

  if ! command -v node >/dev/null 2>&1; then
    echo "STEP install-nodejs"
    pkg install -y nodejs
    echo "RC $? pkg install nodejs"
  fi

  echo "STEP versions"
  command -v termux-info >/dev/null 2>&1 && termux-info | head -80
  echo "node=$(node -v 2>/dev/null)"
  echo "npm=$(npm -v 2>/dev/null)"
  echo "curl=$(curl --version 2>/dev/null | head -1)"
  echo "jq=$(jq --version 2>/dev/null)"
  echo "python=$(python --version 2>/dev/null)"

  echo "STEP npm-safe-config"
  npm config set fund false 2>/dev/null
  npm config set audit false 2>/dev/null
  npm config set update-notifier false 2>/dev/null

  echo "STEP write falcon-law001-health"
  cat > "$BIN/falcon-law001-health" <<'EOS'
#!/data/data/com.termux/files/usr/bin/sh
set +e
echo "Falcon frontend LAW-001 health"
echo "local/reverse:"
curl -s --max-time 5 http://127.0.0.1:4947/behcs/health
echo
echo "acer-lan:"
curl -s --max-time 5 http://192.168.1.12:4947/behcs/health
echo
echo "falcon-lan:"
curl -s --max-time 5 http://192.168.1.8:4947/behcs/health
echo
EOS
  chmod 700 "$BIN/falcon-law001-health"

  echo "STEP write falcon-spawn"
  cat > "$BIN/falcon-spawn" <<'EOS'
#!/data/data/com.termux/files/usr/bin/sh
set +e
PROMPT="$*"
if [ -z "$PROMPT" ]; then
  PROMPT="Falcon frontend proxy smoke. Return compact JSON with ok=true, lane=falcon_frontend_forced_termux, and one repair note."
fi
ID="falcon-termux-frontend-$(date +%s)"
MODEL="${FALCON_MODEL:-opencode/gpt-5-nano}"
BUS="${ACER_BUS:-http://127.0.0.1:4947/behcs/send}"
if ! command -v jq >/dev/null 2>&1; then
  echo "jq_missing"
  exit 2
fi
PAYLOAD="$(jq -nc \
  --arg id "$ID" \
  --arg model "$MODEL" \
  --arg prompt "$PROMPT" \
  '{verb:"falcon-opencode-proxy-request",id:$id,requestId:$id,from:"falcon-termux-frontend",target:"acer",lane:"falcon_frontend_forced_termux",model:$model,prompt:$prompt,falconPid:("BH.AGENT.PID.FALCON.FRONTEND." + ($id|split("-")|last|tostring))}')"
echo "$PAYLOAD" > "$HOME/.asolaria/state/$ID.request.json"
echo "posting $ID to $BUS"
curl -s --max-time 8 -X POST "$BUS" -H "Content-Type: application/json" --data "$PAYLOAD"
echo
EOS
  chmod 700 "$BIN/falcon-spawn"

  if ! grep -q '.asolaria/bin' "$HOME/.profile" 2>/dev/null; then
    echo 'export PATH="$HOME/.asolaria/bin:$PATH"' >> "$HOME/.profile"
  fi
  export PATH="$BIN:$PATH"

  echo "STEP health"
  falcon-law001-health

  echo "STEP visible-spawn-smoke"
  falcon-spawn "Falcon frontend force-fix smoke after Termux visual repair. Return compact JSON: ok, lane, proxy_ready, next_hold."

  echo "$STAMP END status=ok_with_native_opencode_hold_if_android_binary_missing"
  echo "log=$LOG"
} 2>&1 | tee -a "$LOG"

