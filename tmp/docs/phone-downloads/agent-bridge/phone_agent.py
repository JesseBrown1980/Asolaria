from __future__ import annotations

import asyncio
import concurrent.futures
from dataclasses import dataclass
from datetime import datetime, timezone
import ipaddress
import json
import os
import shutil
import socket
import subprocess
from typing import Any, Dict, Iterable, List, Optional
import uuid
from urllib.parse import quote_plus

import websockets


def utc_now_iso() -> str:
  return datetime.now(timezone.utc).isoformat()


def text(value: Any) -> str:
  return str(value or "").strip()


def env_int(name: str, fallback: int) -> int:
  raw = os.getenv(name)
  if raw is None:
    return fallback
  try:
    return int(raw)
  except ValueError:
    return fallback


def env_float(name: str, fallback: float) -> float:
  raw = os.getenv(name)
  if raw is None:
    return fallback
  try:
    return float(raw)
  except ValueError:
    return fallback


PC_BRIDGE_HOST = text(os.getenv("PC_BRIDGE_HOST"))
PC_BRIDGE_PORT = env_int("PC_BRIDGE_PORT", 8765)
BRIDGE_SHARED_TOKEN = text(os.getenv("BRIDGE_SHARED_TOKEN"))
PHONE_DEVICE_ID = text(os.getenv("PHONE_DEVICE_ID")) or f"s24fe-{uuid.uuid4().hex[:8]}"
DISCOVERY_CIDR = text(os.getenv("DISCOVERY_CIDR"))
DISCOVERY_TIMEOUT_SECONDS = env_float("DISCOVERY_TIMEOUT_SECONDS", 0.35)
HEARTBEAT_INTERVAL_SECONDS = env_int("HEARTBEAT_INTERVAL_SECONDS", 8)
RECONNECT_MAX_SECONDS = env_int("RECONNECT_MAX_SECONDS", 30)
DISCOVERY_MAX_WORKERS = env_int("DISCOVERY_MAX_WORKERS", 64)
ENABLE_CLIPBOARD_CONNECTOR = text(os.getenv("ENABLE_CLIPBOARD_CONNECTOR")).lower() in ("1", "true", "yes", "on")


def command_exists(command: str) -> bool:
  return shutil.which(command) is not None


def run_command(
  args: List[str],
  *,
  timeout_seconds: float = 10.0,
  input_text: str = ""
) -> Dict[str, Any]:
  try:
    completed = subprocess.run(
      args,
      input=input_text if input_text else None,
      capture_output=True,
      text=True,
      timeout=max(1.0, timeout_seconds),
      check=False
    )
    return {
      "ok": completed.returncode == 0,
      "code": completed.returncode,
      "stdout": text(completed.stdout),
      "stderr": text(completed.stderr)
    }
  except Exception as error:
    return {
      "ok": False,
      "code": -1,
      "stdout": "",
      "stderr": text(error)
    }


def run_termux_json(command: str) -> Dict[str, Any]:
  if not command_exists(command):
    return {"ok": False, "error": f"{command} not found"}
  result = run_command([command], timeout_seconds=8.0)
  if not result["ok"]:
    return {"ok": False, "error": result["stderr"] or f"{command} failed"}
  try:
    return {
      "ok": True,
      "data": json.loads(result["stdout"] or "{}")
    }
  except json.JSONDecodeError:
    return {
      "ok": False,
      "error": f"{command} output is not JSON",
      "raw": result["stdout"]
    }


def get_local_ipv4() -> str:
  try:
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
      sock.connect(("8.8.8.8", 80))
      return text(sock.getsockname()[0])
  except Exception:
    try:
      host_ip = socket.gethostbyname(socket.gethostname())
      return text(host_ip)
    except Exception:
      return ""


def network_targets(local_ip: str, cidr_hint: str = "") -> List[str]:
  ip_text = text(local_ip)
  if not ip_text:
    return []

  network: ipaddress.IPv4Network
  if cidr_hint:
    network = ipaddress.ip_network(cidr_hint, strict=False)  # type: ignore[arg-type]
  else:
    network = ipaddress.ip_network(f"{ip_text}/24", strict=False)

  if network.version != 4:
    return []

  if network.num_addresses > 4096:
    return []

  local_addr = ipaddress.ip_address(ip_text)
  rows: List[str] = []
  for host in network.hosts():
    if host == local_addr:
      continue
    rows.append(str(host))
  return rows


def probe_host(host: str, port: int, timeout_seconds: float) -> bool:
  try:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
      sock.settimeout(max(0.1, timeout_seconds))
      return sock.connect_ex((host, int(port))) == 0
  except Exception:
    return False


def discover_pc_host() -> str:
  if PC_BRIDGE_HOST:
    if probe_host(PC_BRIDGE_HOST, PC_BRIDGE_PORT, DISCOVERY_TIMEOUT_SECONDS):
      return PC_BRIDGE_HOST

  local_ip = get_local_ipv4()
  targets = network_targets(local_ip, DISCOVERY_CIDR)
  if not targets:
    return ""

  workers = max(8, min(DISCOVERY_MAX_WORKERS, len(targets)))
  with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
    futures = {
      pool.submit(probe_host, host, PC_BRIDGE_PORT, DISCOVERY_TIMEOUT_SECONDS): host
      for host in targets
    }
    for future in concurrent.futures.as_completed(futures):
      host = futures[future]
      try:
        if future.result():
          for other in futures:
            if other is not future:
              other.cancel()
          return host
      except Exception:
        continue
  return ""


def detect_connectors() -> Dict[str, Any]:
  clipboard_read_available = ENABLE_CLIPBOARD_CONNECTOR and command_exists("termux-clipboard-get")
  clipboard_write_available = ENABLE_CLIPBOARD_CONNECTOR and command_exists("termux-clipboard-set")
  return {
    "termux_api": command_exists("termux-battery-status"),
    "battery_read": command_exists("termux-battery-status"),
    "clipboard_enabled": ENABLE_CLIPBOARD_CONNECTOR,
    "clipboard_read": clipboard_read_available,
    "clipboard_write": clipboard_write_available,
    "notification_push": command_exists("termux-notification"),
    "location_read": command_exists("termux-location"),
    "file_read_write": True
  }


def execute_command(action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
  name = text(action).lower()
  params = parameters or {}

  if name in ("ping", "health", "status"):
    return {
      "ok": True,
      "action": name,
      "deviceId": PHONE_DEVICE_ID,
      "at": utc_now_iso(),
      "connectors": detect_connectors()
    }

  if name in ("list_connectors", "get_connectors"):
    return {"ok": True, "connectors": detect_connectors()}

  if name in ("get_battery", "battery_status"):
    return run_termux_json("termux-battery-status")

  if name in ("read_clipboard", "clipboard_get"):
    if not ENABLE_CLIPBOARD_CONNECTOR:
      return {"ok": False, "error": "clipboard connector disabled"}
    if not command_exists("termux-clipboard-get"):
      return {"ok": False, "error": "termux-clipboard-get not found"}
    result = run_command(["termux-clipboard-get"], timeout_seconds=6.0)
    return {
      "ok": bool(result["ok"]),
      "text": result["stdout"],
      "error": result["stderr"] if not result["ok"] else ""
    }

  if name in ("write_clipboard", "clipboard_set"):
    if not ENABLE_CLIPBOARD_CONNECTOR:
      return {"ok": False, "error": "clipboard connector disabled"}
    value = text(params.get("text") or params.get("value"))
    if not value:
      return {"ok": False, "error": "text is required"}
    if not command_exists("termux-clipboard-set"):
      return {"ok": False, "error": "termux-clipboard-set not found"}
    result = run_command(["termux-clipboard-set"], timeout_seconds=6.0, input_text=value)
    return {
      "ok": bool(result["ok"]),
      "error": result["stderr"] if not result["ok"] else ""
    }

  if name in ("notify", "push_notification"):
    if not command_exists("termux-notification"):
      return {"ok": False, "error": "termux-notification not found"}
    title = text(params.get("title") or "Agent Bridge")
    content = text(params.get("text") or params.get("message") or "Notification from PC")
    result = run_command(
      ["termux-notification", "--title", title, "--content", content],
      timeout_seconds=8.0
    )
    return {"ok": bool(result["ok"]), "error": result["stderr"] if not result["ok"] else ""}

  return {
    "ok": False,
    "error": f"unsupported action: {name}"
  }


def make_envelope(
  sender: str,
  target: str,
  intent: str,
  payload: Optional[Dict[str, Any]] = None,
  request_id: str = ""
) -> Dict[str, Any]:
  return {
    "id": uuid.uuid4().hex,
    "at": utc_now_iso(),
    "sender": text(sender),
    "target": text(target),
    "intent": text(intent),
    "request_id": text(request_id),
    "payload": payload or {}
  }


@dataclass
class AgentRuntime:
  connected_host: str = ""
  last_pong_at: str = ""
  connectors: Dict[str, Any] = None  # type: ignore[assignment]

  def __post_init__(self) -> None:
    self.connectors = detect_connectors()


runtime = AgentRuntime()


async def send_json(ws: Any, payload: Dict[str, Any]) -> None:
  await ws.send(json.dumps(payload, ensure_ascii=False))


async def heartbeat_loop(ws: Any) -> None:
  while True:
    await asyncio.sleep(max(3, HEARTBEAT_INTERVAL_SECONDS))
    payload = make_envelope(
      sender="phone_agent",
      target="pc_server",
      intent="ping",
      payload={
        "deviceId": PHONE_DEVICE_ID,
        "connectors": runtime.connectors
      }
    )
    await send_json(ws, payload)


async def handle_server_message(ws: Any, raw: str) -> None:
  try:
    message = json.loads(raw)
  except json.JSONDecodeError:
    return
  if not isinstance(message, dict):
    return

  intent = text(message.get("intent")).lower()
  request_id = text(message.get("request_id"))
  payload = message.get("payload")
  if not isinstance(payload, dict):
    payload = {}

  if intent == "pong":
    runtime.last_pong_at = utc_now_iso()
    return

  if intent == "welcome":
    runtime.connectors = detect_connectors()
    await send_json(ws, make_envelope(
      sender="phone_agent",
      target="pc_server",
      intent="register_connectors",
      payload=runtime.connectors
    ))
    return

  if intent == "execute_command":
    action = text(payload.get("action"))
    params = payload.get("parameters")
    if not isinstance(params, dict):
      params = {}
    result = await asyncio.to_thread(execute_command, action, params)
    await send_json(ws, make_envelope(
      sender="phone_agent",
      target="pc_server",
      intent="command_result",
      payload={
        "action": action,
        "result": result
      },
      request_id=request_id
    ))
    return

  if intent == "agent_message":
    incoming = text(payload.get("message") or payload.get("text"))
    response = f"[phone_ai_ack] {incoming[:280]}"
    await send_json(ws, make_envelope(
      sender="phone_ai",
      target="pc_ai",
      intent="agent_message",
      payload={"message": response},
      request_id=request_id
    ))
    return


async def connect_once(host: str) -> None:
  token_qs = f"&token={quote_plus(BRIDGE_SHARED_TOKEN)}" if BRIDGE_SHARED_TOKEN else ""
  uri = f"ws://{host}:{PC_BRIDGE_PORT}/ws/phone?device_id={quote_plus(PHONE_DEVICE_ID)}{token_qs}"
  print(f"[agent] connecting to {uri}")

  async with websockets.connect(
    uri,
    ping_interval=20,
    ping_timeout=20,
    max_size=2_000_000
  ) as ws:
    runtime.connected_host = host
    runtime.connectors = detect_connectors()
    await send_json(ws, make_envelope(
      sender="phone_agent",
      target="pc_server",
      intent="register_connectors",
      payload=runtime.connectors
    ))

    hb_task = asyncio.create_task(heartbeat_loop(ws))
    try:
      async for raw in ws:
        await handle_server_message(ws, raw)
    finally:
      hb_task.cancel()
      try:
        await hb_task
      except Exception:
        pass


async def run_forever() -> None:
  backoff = 1
  while True:
    host = await asyncio.to_thread(discover_pc_host)
    if not host:
      print("[agent] PC not found on subnet. Waiting...")
      await asyncio.sleep(min(RECONNECT_MAX_SECONDS, max(2, backoff)))
      backoff = min(RECONNECT_MAX_SECONDS, backoff * 2)
      continue

    try:
      await connect_once(host)
      backoff = 1
    except Exception as error:
      print(f"[agent] connection error: {error}")
      await asyncio.sleep(backoff)
      backoff = min(RECONNECT_MAX_SECONDS, max(2, backoff * 2))


if __name__ == "__main__":
  print(f"[agent] starting deviceId={PHONE_DEVICE_ID} port={PC_BRIDGE_PORT}")
  asyncio.run(run_forever())
