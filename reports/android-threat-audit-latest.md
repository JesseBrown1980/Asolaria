# Android Threat Audit

- checkedAt: 2026-04-28T17:58:09.1899479+00:00
- device: R5CXA4MGQXV
- model: SM-S721U1
- android: 16
- userPackages: 153
- suspiciousTop: 27

## High-Risk Signals
- overlayAllowed: 7
- accessibilityEnabled: 1
- activeAdmins: 1
- notificationListeners: 13
- owners: 1

## Defaults
- browser: com.android.chrome/com.google.android.apps.chrome.IntentDispatcher
- home: com.sec.android.app.launcher/.activities.LauncherActivity

## Top Suspicious Packages
- com.termux.api | score=80 | installer=null | reasons=overlay_allowed, notification_listener_enabled, third_party_app
- cloud.izt.voice | score=45 | installer=com.android.vending | reasons=overlay_allowed, third_party_app
- com.azure.authenticator | score=45 | installer=com.android.vending | reasons=overlay_allowed, third_party_app
- com.termux | score=45 | installer=null | reasons=overlay_allowed, third_party_app
- com.google.android.projection.gearhead | score=43 | installer= | reasons=notification_listener_enabled, name_keyword_match
- br.com.vivo | score=40 | installer=com.android.vending | reasons=notification_listener_enabled, third_party_app
- com.google.android.googlequicksearchbox | score=40 | installer= | reasons=overlay_allowed
- com.google.android.youtube | score=40 | installer= | reasons=overlay_allowed
- com.microsoft.launcher | score=40 | installer=com.android.vending | reasons=notification_listener_enabled, third_party_app
- com.sec.android.app.samsungapps | score=40 | installer= | reasons=overlay_allowed
- com.google.android.as | score=35 | installer= | reasons=notification_listener_enabled
- com.google.android.gms | score=35 | installer= | reasons=notification_listener_enabled
- com.microsoft.appmanager | score=35 | installer= | reasons=notification_listener_enabled
- com.samsung.android.app.routines | score=35 | installer= | reasons=notification_listener_enabled
- com.samsung.android.audiomirroring | score=35 | installer= | reasons=notification_listener_enabled
- com.samsung.android.forest | score=35 | installer= | reasons=notification_listener_enabled
- com.samsung.android.smartmirroring | score=35 | installer= | reasons=notification_listener_enabled
- com.samsung.android.smartsuggestions | score=35 | installer= | reasons=notification_listener_enabled
- com.sec.android.app.launcher | score=35 | installer= | reasons=notification_listener_enabled
- com.anxcye.anx_reader | score=33 | installer=com.machiav3lli.fdroid | reasons=name_keyword_match, third_party_app, untrusted_installer:com.machiav3lli.fdroid
- org.chromium.webapk.a32c10678bcad2402_v2 | score=33 | installer=com.android.chrome | reasons=name_keyword_match, third_party_app, untrusted_installer:com.android.chrome
- com.expressvpn.keys | score=13 | installer=com.android.vending | reasons=name_keyword_match, third_party_app
- com.expressvpn.vpn | score=13 | installer=com.android.vending | reasons=name_keyword_match, third_party_app
- com.mercadolibre | score=13 | installer=com.android.vending | reasons=name_keyword_match, third_party_app
- com.netshort.abroad | score=13 | installer=com.android.vending | reasons=name_keyword_match, third_party_app
- com.root.tendadrive.Activities | score=13 | installer=com.android.vending | reasons=name_keyword_match, third_party_app
- com.tsheets.android.hammerhead | score=13 | installer=com.android.vending | reasons=name_keyword_match, third_party_app

