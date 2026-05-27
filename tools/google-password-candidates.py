#!/usr/bin/env python
import argparse
import base64
import hashlib
import json
import os
import shutil
import sqlite3
import sys
import tempfile
from pathlib import Path

import win32crypt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


DEFAULT_PROFILES = ["Profile 17", "Profile 14", "Profile 3", "Default"]
GOOGLE_NEEDLES = ("google.com", "admin.google.com", "accounts.google.com")


def chrome_root() -> Path:
    local = os.environ.get("LOCALAPPDATA") or str(Path.home() / "AppData" / "Local")
    return Path(local) / "Google" / "Chrome" / "User Data"


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def get_master_key(root: Path) -> bytes:
    local_state = read_json(root / "Local State")
    encrypted = local_state.get("os_crypt", {}).get("encrypted_key", "")
    if not encrypted:
        raise RuntimeError("Chrome Local State has no encrypted_key.")
    blob = base64.b64decode(encrypted)
    if blob.startswith(b"DPAPI"):
        blob = blob[5:]
    return win32crypt.CryptUnprotectData(blob, None, None, None, 0)[1]


def decrypt_password(encrypted: bytes, master_key: bytes) -> str:
    if not encrypted:
        return ""
    if encrypted.startswith((b"v10", b"v11")):
        nonce = encrypted[3:15]
        ciphertext = encrypted[15:]
        return AESGCM(master_key).decrypt(nonce, ciphertext, None).decode("utf-8", "replace")
    if encrypted.startswith(b"v20"):
        raise RuntimeError("Chrome v20 app-bound password encryption is not supported by this local helper.")
    return win32crypt.CryptUnprotectData(encrypted, None, None, None, 0)[1].decode("utf-8", "replace")


def copy_login_db(db: Path) -> Path:
    tmp = Path(tempfile.mkdtemp(prefix="asolaria-login-db-")) / "Login Data"
    shutil.copy2(db, tmp)
    return tmp


def iter_chrome_candidates(profiles):
    root = chrome_root()
    master_key = get_master_key(root)
    for profile in profiles:
        db = root / profile / "Login Data"
        if not db.exists():
            continue
        tmp_db = copy_login_db(db)
        try:
            con = sqlite3.connect(str(tmp_db))
            con.row_factory = sqlite3.Row
            rows = con.execute(
                "select origin_url, action_url, username_value, password_value, date_created "
                "from logins order by date_created desc"
            ).fetchall()
            con.close()
        finally:
            try:
                shutil.rmtree(tmp_db.parent, ignore_errors=True)
            except Exception:
                pass
        for row in rows:
            origin = str(row["origin_url"] or "")
            action = str(row["action_url"] or "")
            username = str(row["username_value"] or "")
            haystack = f"{origin} {action} {username}".lower()
            if not any(needle in haystack for needle in GOOGLE_NEEDLES):
                continue
            try:
                password = decrypt_password(bytes(row["password_value"]), master_key)
            except Exception as exc:
                yield {
                    "source": "chrome",
                    "profile": profile,
                    "origin": origin,
                    "action": action,
                    "username": username,
                    "decryptError": str(exc),
                    "password": "",
                }
                continue
            yield {
                "source": "chrome",
                "profile": profile,
                "origin": origin,
                "action": action,
                "username": username,
                "password": password,
            }


def summarize(candidate):
    password = candidate.get("password") or ""
    digest = hashlib.sha256(password.encode("utf-8")).hexdigest()[:12] if password else ""
    return {
        "source": candidate.get("source", ""),
        "profile": candidate.get("profile", ""),
        "origin": candidate.get("origin", ""),
        "action": candidate.get("action", ""),
        "username": candidate.get("username", ""),
        "hasPassword": bool(password),
        "passwordLength": len(password),
        "passwordHash12": digest,
        "decryptError": candidate.get("decryptError", ""),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["list"], nargs="?", default="list")
    parser.add_argument("--profiles", default=",".join(DEFAULT_PROFILES))
    args = parser.parse_args()
    profiles = [p.strip() for p in args.profiles.split(",") if p.strip()]
    rows = [summarize(candidate) for candidate in iter_chrome_candidates(profiles)]
    print(json.dumps({"ok": True, "count": len(rows), "rows": rows}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
        sys.exit(1)
