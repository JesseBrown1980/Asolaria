# QDD Seed Datasets — Complete Test Data for Every EZ Protect Page
# Status: ACTIVE
# Goal: Generate realistic fake data so every page renders with content

## What Each Page Needs

### /ez-protect (Dashboard)
- Events with varied resultStates across time windows (1d, 7d, 14d, 30d)
- Multiple devices with different serial numbers and models
- Multiple facilities/locations
- Positive rate calculations need mix of NEGATIVE and POSITIVE states

### /ez-protect/results
- 200+ events with all 8 result states
- Multiple devices (SN-001 through SN-010)
- Multiple operators (op-1 through op-5)
- Date range spanning 30 days
- Events with all fields populated (lotNumber, rollNumber, assayCode, sampleId, etc.)

### /ez-protect/results/[id]
- Events with EVERY field populated so detail page shows all rows
- Need: readingValue, controlLineValid, temperatureC, pmStatus, calibrationStatus, moduleSlot, assayName, assayCode, sampleId, lotNumber, rollNumber

### /ez-protect/alerts
- Alert rules with all trigger types (result_state, device_offline, threshold, control_failure, pm_failure, calibration_failure)
- All channel types (email, sms, dashboard, both)
- faqLinks and videoLinks populated

### /ez-protect/alerts (History tab)
- 50+ alert history entries across time
- Mix of trigger types and channels
- Linked to alert rules

### /ez-protect/devices
- Devices with event counts
- Mix of online/offline status
- Last seen timestamps
- Multiple models and serial numbers

### /ez-protect/facility
- Facility dashboard data
- Device health summaries
- Window summaries by facility

### /ez-protect/compare
- Data across multiple time windows for comparison charts

### /ez-protect/troubleshooting
- Events with error states for troubleshooting view
