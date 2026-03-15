# Phone Developer Options Sweep

- runId: 20260306-001104Z
- startedAt: 2026-03-06T00:11:04.583Z
- finishedAt: 2026-03-06T00:12:39.794Z
- durationMs: 95211
- deviceId: R5CXA4MGQXV
- selected: 18
- passed: 14
- failed: 4
- mistakes: 8
- capture: on (1200ms interval)
- includeRisky: false
- onlyDefaultSweep: true

## Options

- PASS animator_duration_scale (drawing) before=0.0 afterOn=1 afterOff=0 restored=0.0
- PASS show_hw_layers_updates (drawing) before=0 afterOn=1 afterOff=0 restored=0
- PASS show_hw_screen_updates (drawing) before=0 afterOn=1 afterOff=0 restored=0
- PASS debug_layout (drawing) before=0 afterOn=1 afterOff=0 restored=0
- PASS transition_animation_scale (drawing) before=0.0 afterOn=1 afterOff=0 restored=0.0
- PASS window_animation_scale (drawing) before=0.0 afterOn=1 afterOff=0 restored=0.0
- PASS debug_hw_overdraw (hardware) before=off afterOn=show afterOff=off restored=off
- FAIL debug_egl_force_msaa (hardware) before=0 afterOn=1 afterOff=null restored=0
- PASS debug_hwui_profile (hardware) before=false afterOn=visual_bars afterOff=false restored=false
- PASS debug_hwui_show_dirty_regions (hardware) before=false afterOn=true afterOff=false restored=false
- PASS pointer_location (input) before=0 afterOn=1 afterOff=0 restored=0
- PASS show_touches (input) before=1 afterOn=1 afterOff=0 restored=1
- PASS bluetooth_disable_absolute_volume (media) before=0 afterOn=1 afterOff=0 restored=0
- PASS disable_usb_audio_routing (media) before=1 afterOn=1 afterOff=0 restored=1
- PASS show_notification_channel_warnings (media) before=0 afterOn=1 afterOff=0 restored=0
- FAIL tether_offload_disabled (system) before=0 afterOn=1 afterOff=0 restored=null
- FAIL mobile_data_always_on (system) before=null afterOn=null afterOff=null restored=null
- FAIL wifi_verbose_logging_enabled (system) before=null afterOn=null afterOff=null restored=null

## Mistakes

- debug_egl_force_msaa stage=capture_on error=no_authorized_phone_device
- debug_egl_force_msaa stage=apply_off error=write_failed
- tether_offload_disabled stage=capture_off error=no_authorized_phone_device
- tether_offload_disabled stage=restore error=write_failed
- mobile_data_always_on stage=apply_on error=write_failed
- mobile_data_always_on stage=apply_off error=write_failed
- wifi_verbose_logging_enabled stage=apply_on error=write_failed
- wifi_verbose_logging_enabled stage=apply_off error=write_failed

## Artifacts

- json: C:\Users\acer\Asolaria\reports\phone-developer-options-sweep-20260306-001104Z.json
- markdown: C:\Users\acer\Asolaria\reports\phone-developer-options-sweep-20260306-001104Z.md
- jsonLatest: C:\Users\acer\Asolaria\reports\phone-developer-options-sweep-latest.json
- markdownLatest: C:\Users\acer\Asolaria\reports\phone-developer-options-sweep-latest.md
- mistakeLog: C:\Users\acer\Asolaria\data\phone-developer-options-mistakes.json
