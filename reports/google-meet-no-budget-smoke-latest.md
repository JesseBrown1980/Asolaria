# Google Meet No-Budget Smoke Test

- Timestamp: 2026-03-04T09:50:20.0672622-03:00
- Scope: validate no-cost local STT path + backend Meet page reachability

## Runtime
- /api/health ok=true
- Local Whisper available: True
- Cloud STT available: True
- Voice capture mode selected: dshow_microphone

## Devices / Capture Backend
- FFmpeg backend detected: dshow
- dshow input devices detected: 1
- Primary dshow device: Grupo de microfones (Realtek High Definition Audio)
- Note: WASAPI backend not available in current FFmpeg build, so meeting_mix (speaker+mic) cannot be fully validated right now.

## Local STT Proof (No OpenAI budget required)
- TTS generated locally via Kitty TTS: captures/voice/meet-local-tts-test.wav
- Transcribe result mode: local-whisper
- Transcript sample: Google Meet local transcription test this sentence should appear in transcript

## Live Pipeline Proof
- Live session id: 20260304124707-e95939
- Mode used: dshow_microphone
- After 90s: totalChunks=5, successfulChunks=5, failedChunks=0, lastError=<empty>
- Transcript captured injected test phrase (OCR-like errors expected).

## Backend Meet Reachability
- Browser task job: job_1772628578908_06dxau
- Status: completed
- Title: Google Meet: videoconfer?ncias e liga??es na Web | Google Workspace
- Final URL: https://workspace.google.com/products/meet/

## Conclusion
- Yes: we can test Google Meet path without adding money right now.
- Current limitation: full incoming+outgoing audio mix capture needs WASAPI-capable FFmpeg (or equivalent loopback source), which is not present in this host build.
