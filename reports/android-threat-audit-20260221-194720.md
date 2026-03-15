# Android Threat Audit

- checkedAt: 2026-02-21T22:47:20.8656193+00:00
- device: R5CXA4MGQXV
- model: SM-S721U1
- android: 16
- userPackages: 130
- suspiciousTop: 16

## High-Risk Signals
- overlayAllowed: 7
- accessibilityEnabled: 1
- activeAdmins: 1
- notificationListeners: 4
- owners: 1

## Defaults
- browser: com.android.chrome/com.google.android.apps.chrome.IntentDispatcher
- home: com.sec.android.app.launcher/.activities.LauncherActivity

## Top Suspicious Packages
- com.termux | score=55 | installer=null | reasons=overlay_allowed, third_party_app, installed_within_30_days
- com.termux.api | score=55 | installer=null | reasons=overlay_allowed, third_party_app, installed_within_30_days
- cloud.izt.voice | score=45 | installer=com.android.vending | reasons=overlay_allowed, third_party_app
- com.azure.authenticator | score=45 | installer=com.android.vending | reasons=overlay_allowed, third_party_app
- com.google.android.projection.gearhead | score=43 | installer= | reasons=notification_listener_enabled, name_keyword_match
- com.google.android.googlequicksearchbox | score=40 | installer= | reasons=overlay_allowed
- com.google.android.youtube | score=40 | installer= | reasons=overlay_allowed
- com.sec.android.app.samsungapps | score=40 | installer= | reasons=overlay_allowed
- com.microsoft.appmanager | score=35 | installer= | reasons=notification_listener_enabled
- com.samsung.android.smartmirroring | score=35 | installer= | reasons=notification_listener_enabled
- com.sec.android.app.launcher | score=35 | installer= | reasons=notification_listener_enabled
- com.root.tendadrive.Activities | score=23 | installer=com.android.vending | reasons=name_keyword_match, third_party_app, installed_within_30_days
- com.expressvpn.vpn | score=13 | installer=com.android.vending | reasons=name_keyword_match, third_party_app
- com.mercadolibre | score=13 | installer=com.android.vending | reasons=name_keyword_match, third_party_app
- com.netshort.abroad | score=13 | installer=com.android.vending | reasons=name_keyword_match, third_party_app
- com.tsheets.android.hammerhead | score=13 | installer=com.android.vending | reasons=name_keyword_match, third_party_app

