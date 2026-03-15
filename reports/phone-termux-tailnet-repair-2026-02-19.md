# Phone Termux + Tailnet Repair (2026-02-19)

## Goal
- Re-establish stable private phone<->Asolaria connectivity.
- Restore Termux tooling lost after security clean.
- Validate Termux API bridge end-to-end.

## Completed
- Desktop + phone Tailscale connected and verified in same tailnet.
- Tailnet-only Asolaria mobile endpoint kept active:
  - `tailscale serve --http=4782 127.0.0.1:4781`
  - Endpoint: `http://desktop-j99vcnh.tailb47e0e.ts.net:4782`
- `tools/Start-Asolaria-Phone.ps1` enhanced to:
  - auto-configure tailnet proxy (`4782`)
  - auto-update `/api/mobile/connections` remote base URL
  - keep secure connection preference set (`usb,vpn,private_internet`)

## Termux Repair
- Resolved Termux repo access from ADB context by relaying official repo through tailnet:
  - `tailscale serve --http=4790 https://packages.termux.dev`
  - Mirror base: `http://desktop-j99vcnh.tailb47e0e.ts.net:4790`
- Wrote Termux mirror profile:
  - `files/usr/etc/termux/mirrors/asolaria_tailnet`
- Set `chosen_mirrors` symlink to `mirrors/asolaria_tailnet`.
- Ran:
  - `pkg update -y`
  - `pkg upgrade -y` (handled conffile prompt with force-confold follow-up)
  - `apt --fix-broken install` (`DEBIAN_FRONTEND=noninteractive`, `--force-confold`)
  - `apt install -y nodejs-lts python termux-api jq tmux` (same noninteractive options)

## Installed/Verified Packages
- `apt 2.8.1-1`
- `openssl 1:3.6.1`
- `nodejs-lts 24.13.0-1`
- `python 3.12.12-1`
- `termux-api 0.59.1-1`
- `jq 1.8.1-1`
- `tmux 3.6a`
- Runtime checks:
  - `node -v` -> `v24.13.0`
  - `python -V` -> `Python 3.12.12`
  - `jq --version` -> `jq-1.8.1`
  - `tmux -V` -> `tmux 3.6a`

## Termux:API Companion App
- Installed via ADB from GitHub release:
  - `termux-api-app_v0.53.0+github.debug.apk`
- Verified package present:
  - `package:com.termux.api`
- Verified live API command:
  - `termux-battery-status` returned JSON successfully.

## Added Helper Script
- New script:
  - `tools/Repair-Termux-Over-Tailnet.ps1`
- Purpose:
  - one-command reconfiguration of tailnet mirror relay + Termux package repair/install.

## Current Private Endpoints
- Asolaria mobile UI/API:
  - `http://desktop-j99vcnh.tailb47e0e.ts.net:4782`
- Termux repo relay:
  - `http://desktop-j99vcnh.tailb47e0e.ts.net:4790`
