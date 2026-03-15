# Phone Antivirus / Process Block Investigation (2026-02-19)

## Scope
- Device: Samsung `SM-S721U1` (Android 16)
- Target apps: `com.jessebrown.asolaria`, `com.termux`, `com.termux.api`, `com.tailscale.ipn`
- Objective: determine whether phone antivirus/security is blocking Asolaria -> Termux process starts.

## Key Findings
1. Asolaria -> Termux process start is currently **allowed**.
- Evidence (logcat): `ActivityManager: Background started FGS: Allowed ... callingPackage: com.jessebrown.asolaria ... intent: com.termux/.app.RunCommandService`.
- Captured in:
  - `reports/phone-logcat-sshd-trigger-20260219-165833-focus.txt` (line 744)
  - `reports/phone-logcat-post-clean-20260219-165919-focus.txt` (line 566)

2. Termux service execution is working post-trigger.
- `sshd` process starts successfully after trigger.
- Evidence command result:
  - PID observed: `17774 /data/data/com.termux/files/usr/bin/sshd`

3. The antivirus/security popup likely came from Samsung App Verification flow (package scan), not from an active block of the Asolaria runtime path.
- Android event log shows `com.samsung.android.sm.devicesecurity` starting `AppVerificationService`, then launching `AppVerificationDialog`.
- Timestamped evidence:
  - `16:51:44` service start for package verification
  - `16:51:53` `AppVerificationDialog` activity launch
- This indicates an APK verification event, not a persistent runtime deny of current Asolaria->Termux command execution.

4. Legacy connector cleanup completed.
- Removed old package: `com.maazm7d.termuxhub` (unused by current Asolaria flow).
- Remaining relevant packages:
  - `com.jessebrown.asolaria`
  - `com.termux`
  - `com.termux.api`
  - `com.tailscale.ipn`
  - `org.fdroid.fdroid`

## Artifacts
- Baseline security parse:
  - `reports/phone-logcat-20260219-165532.txt`
  - `reports/phone-logcat-20260219-165532-strict-denials.txt`
- Trigger run (Asolaria menu -> Termux actions):
  - `reports/phone-logcat-post-trigger-20260219-165805.txt`
  - `reports/phone-logcat-post-trigger-20260219-165805-focus.txt`
- Clean one-action trigger capture:
  - `reports/phone-logcat-sshd-trigger-20260219-165833.txt`
  - `reports/phone-logcat-sshd-trigger-20260219-165833-focus.txt`
- Post-clean validation capture:
  - `reports/phone-logcat-post-clean-20260219-165919.txt`
  - `reports/phone-logcat-post-clean-20260219-165919-focus.txt`

## Conclusion
- No active antivirus/process block was reproduced on the Asolaria -> Termux execution path during this investigation.
- Current path is healthy, and legacy cleanup reduced potential false-positive noise.
