Perfect! Now I have all the information I need. Let me compile the comprehensive audit report:

## eBacMap Scheduler and Wizard Code Audit Report

### Files Found

**Scheduler-Related Components:**
- `/apps/web-ebacmap/src/components/SwabSchedules/BulkRescheduleModal.tsx` - Modal for bulk rescheduling multiple test events
- `/apps/web-ebacmap/src/components/SwabSchedules/SwabDetailDialog.tsx` - Individual test detail dialog with reschedule/cancel actions
- `/apps/web-ebacmap/src/pages/api/daily-schedule.ts` - API endpoint for daily schedules
- `/apps/web-ebacmap/src/pages/api/repeat-schedules.ts` - API endpoint for repeating schedules
- `/apps/web-ebacmap/src/pages/api/swab-schedules/swab-schedule-dates.ts` - API endpoint for schedule dates
- `/apps/web-ebacmap/src/components/SwabSchedules/ScheduleWizard.tsx` - Main wizard component (620 lines)

**Wizard Sub-Components (Wizard Folder - 47+ files):**
- `DateRangePicker.tsx` - Date range selection for schedules
- `FrequencyDays.tsx` - Frequency interval configuration
- `SamplingDays.tsx` - Sampling day frequency input
- `SitesPerDay.tsx` - Sites per day validation
- `Days.tsx` - Day selection (specify vs randomize)
- `TimingSelector.tsx`, `TimesPerCycle.tsx`, `ScheduleType.tsx` - Other scheduling inputs
- Plus 40+ other wizard step components

**Core Utilities:**
- `/apps/web-ebacmap/src/modules/swab-schedule/utils/WizardScheduleUtils.ts` (1043 lines) - Date generation logic
- `/apps/web-ebacmap/src/modules/swab-schedule/domain/SwabSchedule.ts` - Domain model with repeat() method

---

### Bug Analysis

#### 1. **"wizard-month-bug"** (Hotfix Branch: `remotes/origin/hotfix/wizard-month-bug-`)

**Commit:** `7b464d8ca` - "fixing date issue with calendar months" (Sept 6, 2024)

**Root Causes Identified:**
- Date calculation logic used incorrect arithmetic (e.g., adding 30 days for monthly, 180 days for semi-annual) instead of proper calendar arithmetic
- `endOfMonth()` and `endOfWeek()` were used incorrectly for calculating repeat dates instead of proper interval additions

**Related Fix:** `6189678aa` (Mar 16, 2026) - "fix(scheduler): resolve 8 Monday board scheduler bugs" addresses related issues:
- **SwabSchedule.repeat() date calculation errors:**
  - Monthly: `addDays(lastDate, 30)` → fixed to `addMonths(lastDate, 1)`
  - Semi-annual: `addDays(lastDate, 180)` → fixed to `addMonths(lastDate, 6)`
  - Quarterly: `addDays(lastDate, 90)` → fixed to `addMonths(lastDate, 3)`
  - Daily: `endOfWeek(lastDate)` → fixed to `addDays(lastDate, 1)`
  - Weekly: `endOfMonth(lastDate)` → fixed to `addWeeks(lastDate, 1)`

**Impact:** Schedule dates were generated with incorrect offsets, especially when repeating schedules beyond first month/year.

---

#### 2. **"bulk-select-reschedule"** (Fix Branch: `remotes/origin/fix/bulk-select-reschedule-not-working`)

**Commit:** `fbb09af05` (Jan 15, 2026) - "fix: Bulk Select Reschedule Not Working"

**Root Causes Identified:**
1. **BulkRescheduleModal.tsx:**
   - Selected date was initialized to `moment()` (today) instead of tomorrow, preventing users from selecting today
   - Reason field validation was missing - form could submit with empty reason
   - Date picker wasn't auto-focused on modal open
   
2. **SwabDetailDialog.tsx:**
   - Reschedule button visibility check only looked at `hasBeenChanged` flag, not actual action type
   - When "reschedule" action was invoked, the button wasn't visible

**Fixes Applied:**
```typescript
// BulkRescheduleModal
- selectedDate: moment() → moment(addDays(new Date(), 1))
- disabled={!selectedDate} → disabled={!selectedDate || !reason.trim()}
- Added: useEffect to auto-focus date picker
- Added: import addDays from 'date-fns'

// SwabDetailDialog  
- {hasBeenChanged && canModify...} → {(hasBeenChanged || actionType === 'reschedule') && canModify...}
- Added: setFocused(true) when action === 'reschedule'
```

**Impact:** Users couldn't reschedule bulk selections because form validation or UI state prevented submission.

---

### Additional Scheduler Fixes (8 Total Bugs - Commit `6189678aa`)

Beyond the month and bulk-select bugs, the comprehensive fix addressed:

3. **Infinity sentinel in date calculations** - WizardScheduleUtils.ts used `Infinity` in remaining date counting, replaced with `Number.MAX_SAFE_INTEGER`

4. **Site groups randomization bug** - Re-shuffling happened mid-day instead of only at cycle boundaries, causing non-deterministic sample selection

5. **Days selection preservation** - Toggling between "specify days" and "randomize days" modes would lose the other mode's selections

6. **Error message clarity** - FrequencyDays, SitesPerDay validation errors were generic, changed to specific messages showing values

7. **Input type issues** - SamplingDays `frequencyNum` input was `type="text"` (allowing non-numeric input), changed to `type="number"`

8. **SitesPerDay validation** - Error clearing logic wasn't working, causing stale errors to persist

---

### Fix Branches Status

| Branch Name | Last Commit | Date | Status |
|---|---|---|---|
| `remotes/origin/hotfix/wizard-month-bug-` | 7b464d8ca | Sept 6, 2024 | Merged into main releases |
| `remotes/origin/fix/bulk-select-reschedule-not-working` | fbb09af05 | Jan 15, 2026 | Merged (PR #495) |
| `remotes/origin/feature/bulk-actions` | dade0f0f9 | Recent | Related feature branch |
| `remotes/origin/feature/audit-ebacmap-modules-units-testresult-swapschedule` | 3bc3bc548 | Recent | Audit/refactoring branch |

---

### Key Code Patterns

**WizardScheduleUtils.ts Key Functions:**
- `generateWizardDates()` - Dispatches to frequency/sample-count/date-range handlers
- `getFrequencyMonthlyDates()` - Generates dates for monthly frequency (line ~1000+)
- `getSampleCountDates()` - Handles sample count based scheduling with Infinity sentinel issues
- `buildDateConfig()` - Applies site randomization with shuffle logic

**SwabSchedule.ts Key Method:**
- `repeat()` method (line ~620) - Calculates next repeat date based on frequency type (where month/year bugs were)

---

### Summary

**wizard-month-bug** stems from confusion between day-offset arithmetic and proper calendar month/year arithmetic. **bulk-select-reschedule** was caused by incomplete state management (missing action type check) and form validation (missing reason validation). Both have fixes merged into current codebase via commits `6189678aa` and `fbb09af05`. The broader scheduler fix resolved 8 related issues in date calculation, UI state, and validation logic.