# BEHCS-1024 P16 Redaction Plan

Generated: 2026-05-13T20:16:50.039Z
Candidate files scanned: 17
Findings: 38
Public promotion: blocked_until_redacted

## Category Counts

- android_path: 4
- device_serial: 9
- operator_label: 10
- phone_model: 5
- private_ip: 3
- windows_path: 7

## Files With Findings

- tools/behcs/behcs-bus.js: 16
- reports/behcs1024-p01-p02-baseline-git-segmentation-20260513.md: 4
- tools/behcs/behcs1024-free-agent-wave.mjs: 3
- tools/Start-Asolaria.ps1: 2
- tools/behcs/omnicoder/omnicoder-server.mjs: 2
- tools/behcs/omnicoder-pilot-daemon.mjs: 2
- tools/behcs/Start-FalconOmnicoder.ps1: 2
- plans/BEHCS-1024-REMAKE-GITHUB-200-STEP-IMPROVEMENT-PLAN.md: 2
- tools/Start-GnnSidecar.ps1: 1
- tools/behcs/omnicoder/start-omnicoder.sh: 1
- tools/behcs/Start-OmnicoderPilot.ps1: 1
- tools/behcs/Test-FalconOmnicoder.ps1: 1
- tools/behcs/fabric-revolver.mjs: 1

## Redaction Catalog

- device_serial def2c96f914b862e (6x) -> `${BEHCS_DEVICE_SERIAL}`
- operator_label 1ecb9e6bdf6cc808 (3x) -> `${BEHCS_OPERATOR_NAME}`
- operator_label 3f2e23b2ee1991da (3x) -> `${BEHCS_OPERATOR_NAME}`
- android_path 6b89780d7319a7e7 (2x) -> `${ANDROID_ASOLARIA_ROOT}`
- operator_label 76c91471d760073b (2x) -> `${BEHCS_OPERATOR_LABEL}`
- phone_model 9a54ec693a8a6b63 (2x) -> `${BEHCS_DEVICE_MODEL}`
- windows_path 515dedb6819ef12d (2x) -> `${ASOLARIA_ROOT}`
- windows_path e7b5cb1e3fc7ef66 (2x) -> `${WINDOWS_LOCAL_PATH}`
- android_path 912bf4175f4aa2d5 (1x) -> `${ANDROID_ASOLARIA_ROOT}/omnicoder`
- android_path ab231bebbf362f36 (1x) -> `${ANDROID_ASOLARIA_ROOT}/omnicoder/packets/${name}`
- device_serial 4be8ddda16b038c1 (1x) -> `${BEHCS_DEVICE_SERIAL}`
- device_serial 60d321924a2b8873 (1x) -> `${BEHCS_DEVICE_SERIAL}`
- device_serial d377c53e17e39a50 (1x) -> `${BEHCS_DEVICE_SERIAL}`
- operator_label 3634bd18ae2bd2fa (1x) -> `${BEHCS_OPERATOR_NAME}`
- operator_label ee95743fdac796e8 (1x) -> `${BEHCS_OPERATOR_NAME}`
- phone_model 3ba16bf2812999e1 (1x) -> `${BEHCS_DEVICE_MODEL}`
- phone_model d7235e280ca8543a (1x) -> `${BEHCS_DEVICE_MODEL}`
- phone_model fba0d68fa5f88add (1x) -> `${BEHCS_DEVICE_MODEL}`
- private_ip aaf2daed5a516b7c (1x) -> `${BEHCS_PRIVATE_HOST}`
- private_ip b5fc5e0389850fc0 (1x) -> `${BEHCS_PRIVATE_HOST}`
- private_ip ba753efa2015157b (1x) -> `${BEHCS_PRIVATE_HOST}`
- windows_path 3a7853f465984184 (1x) -> `${USER_HOME}\anaconda3\python.exe`
- windows_path 5f7a2f4ed5877e57 (1x) -> `${NODE_HOME}\nodejs\node.exe`
- windows_path 836fafb1e6d8c942 (1x) -> `${WINDOWS_LOCAL_PATH}`

## Required Next Actions

- Move private hosts, device serials, and local roots into env/config placeholders.
- Keep Group D docs internal-only until sanitized summaries exist.
- Re-run this adapter before any public projection or GitHub commit candidate promotion.
- Use `--include-raw` only on a private terminal when making manual source edits.
