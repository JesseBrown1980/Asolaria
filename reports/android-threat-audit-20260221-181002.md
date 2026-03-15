# Android Threat Audit

- checkedAt: 2026-02-21T21:10:02.7297844+00:00
- device: R9QY300BBRF
- model: SM-A065M
- android: 15
- userPackages: 16
- suspiciousTop: 4

## High-Risk Signals
- overlayAllowed: 1
- accessibilityEnabled: 1
- activeAdmins: 2
- notificationListeners: 1
- owners: 2

## Defaults
- browser: com.android.chrome/com.google.android.apps.chrome.IntentDispatcher
- home: com.sec.android.app.launcher/.activities.LauncherActivity

## Top Suspicious Packages
- DeviceAdminReceiver.onNetworkLogsAvailable | score=113 | installer= | reasons=active_device_admin, device_or_profile_owner, name_keyword_match
- DeviceAdminReceiver.onSecurityLogsAvailable | score=113 | installer= | reasons=active_device_admin, device_or_profile_owner, name_keyword_match
- com.google.android.googlequicksearchbox | score=40 | installer= | reasons=overlay_allowed
- com.sec.android.app.launcher | score=35 | installer= | reasons=notification_listener_enabled

