# Overnight Phone Voice Fixes

Date: 2026-03-10

## Scope

- Updated `C:\Users\acer\Asolaria\public\phone-mode.js` only.
- Left `C:\Users\acer\Asolaria-Android\AsolariaCompanion\app\src\main\java\com\jessebrown\asolaria\MainActivity.kt` unchanged.

## Changes

- One-shot mic capture now computes auto-dispatch with the requested `oneShot` flag before chunk capture starts, so push-to-talk sends immediately when a transcript exists even if the general auto-send toggle is off.
  - Relevant lines: `shouldAutoDispatchPhoneLiveSpeech` at line 1583 and chunk-capture assignment sites at lines 2754 and 2814.
- Spoken reply sanitization now strips or softens fenced code, markdown links, file/path chatter, route/provider metadata, and symbol-heavy operators before TTS playback.
  - Relevant line: `buildSpeechFriendlyReplyText` at line 2460.
- Windows voice selection now prefers better local US voices and de-prioritizes non-US accents when voice mode would otherwise use server audio; server-mode replies will prefer the local Windows voice when available.
  - Relevant lines: Windows voice hints at lines 1253, 1262, and 1269; voice scoring at line 1288; Windows browser preference at line 1370.

## Evidence

- `node --check C:\Users\acer\Asolaria\public\phone-mode.js`
  - Passed with no syntax errors.
- Inline Node harness against extracted `phone-mode.js` functions
  - Verified one-shot auto-dispatch returns `true` when `autoSend=false` and `oneShot=true`.
  - Verified Windows voice ranking picked `Microsoft Aria Online (Natural) - English (United States)` over `Google UK English Female`.
  - Verified markdown-heavy reply text sanitized to:
    - `Status Code example is on screen. Use foo bar ready`
- Live page probe
  - `Invoke-WebRequest http://127.0.0.1:4781/phone-mode.html`
  - Timed out, so no browser smoke test was run against a live local phone page in this session.

## Commands Run

- `node --check C:\Users\acer\Asolaria\public\phone-mode.js`
- Inline `node -` harness to exercise `shouldAutoDispatchPhoneLiveSpeech`, `chooseSpeechVoice`, `shouldPreferWindowsBrowserSpeech`, and `buildSpeechFriendlyReplyText`
- `Invoke-WebRequest http://127.0.0.1:4781/phone-mode.html`
- `rg -n "function shouldAutoDispatchPhoneLiveSpeech|const SPEECH_WINDOWS_PREFERRED_HINTS|const SPEECH_WINDOWS_US_HINTS|const SPEECH_WINDOWS_DEPRIORITIZED_HINTS|function scoreSpeechVoice|function shouldPreferWindowsBrowserSpeech|function buildSpeechFriendlyReplyText|rt.autoDispatch = shouldAutoDispatchPhoneLiveSpeech\\(" C:\Users\acer\Asolaria\public\phone-mode.js`
