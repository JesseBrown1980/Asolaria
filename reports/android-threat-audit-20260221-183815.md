# Android Threat Audit

- checkedAt: 2026-02-21T21:38:15.7278847+00:00
- device: R9QY300BBRF
- model: SM-A065M
- android: 15
- userPackages: 16
- suspiciousTop: 2

## High-Risk Signals
- overlayAllowed: 1
- accessibilityEnabled: 1
- activeAdmins: 1
- notificationListeners: 1
- owners: 1

## Defaults
- browser: com.android.chrome/com.google.android.apps.chrome.IntentDispatcher
- home: com.sec.android.app.launcher/.activities.LauncherActivity

## Top Suspicious Packages
- com.google.android.googlequicksearchbox | score=40 | installer= | reasons=overlay_allowed
- com.sec.android.app.launcher | score=35 | installer= | reasons=notification_listener_enabled

