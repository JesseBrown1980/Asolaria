/**
 * Prevents Windows from sleeping while Asolaria agents are working.
 *
 * Translated from Claude Code's macOS caffeinate pattern to Windows.
 * Uses PowerShell to call SetThreadExecutionState in a loop, which
 * tells Windows "this thread is still doing work, don't sleep."
 *
 * The PowerShell process runs with a built-in 5-minute timeout.
 * We restart it every 4 minutes to maintain continuous prevention.
 * If Node crashes (SIGKILL / unclean exit), the orphaned PowerShell
 * auto-exits after 5 minutes — self-healing, same as caffeinate.
 *
 * Only runs on Windows — no-op on other platforms.
 *
 * Exports:
 *   startPreventSleep()  — increment ref count, start on first ref
 *   stopPreventSleep()   — decrement ref count, stop on last deref
 *   forceStopPreventSleep() — force stop, ignoring ref count
 *   isPreventingSleep()   — returns boolean
 */

'use strict';

const { spawn } = require('child_process');

// Timeout in seconds. PowerShell auto-exits after this duration.
const TIMEOUT_SECONDS = 300; // 5 minutes

// Restart interval — restart before expiry to maintain continuous prevention.
const RESTART_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

// SetThreadExecutionState flags
// ES_CONTINUOUS (0x80000000) + ES_SYSTEM_REQUIRED (0x00000001)
// Keeps the system awake but allows the display to sleep.
const PS_SCRIPT = `
$timeout = ${TIMEOUT_SECONDS}
$start = [DateTime]::UtcNow

# P/Invoke SetThreadExecutionState
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class SleepPreventer {
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern uint SetThreadExecutionState(uint esFlags);
    public const uint ES_CONTINUOUS    = 0x80000000;
    public const uint ES_SYSTEM_REQUIRED = 0x00000001;
}
"@

# Assert: don't sleep
[SleepPreventer]::SetThreadExecutionState(
    [SleepPreventer]::ES_CONTINUOUS -bor [SleepPreventer]::ES_SYSTEM_REQUIRED
) | Out-Null

# Hold until timeout (poll every 30s so we don't spin)
while (([DateTime]::UtcNow - $start).TotalSeconds -lt $timeout) {
    # Re-assert every iteration in case something cleared it
    [SleepPreventer]::SetThreadExecutionState(
        [SleepPreventer]::ES_CONTINUOUS -bor [SleepPreventer]::ES_SYSTEM_REQUIRED
    ) | Out-Null
    Start-Sleep -Seconds 30
}

# Clear the assertion on exit
[SleepPreventer]::SetThreadExecutionState(
    [SleepPreventer]::ES_CONTINUOUS
) | Out-Null
`.trim();

let keepAwakeProcess = null;
let restartInterval = null;
let refCount = 0;

/**
 * Increment the reference count and start preventing sleep if needed.
 */
function startPreventSleep() {
  refCount++;

  if (refCount === 1) {
    spawnKeepAwake();
    startRestartInterval();
  }
}

/**
 * Decrement the reference count and allow sleep if no more work is pending.
 */
function stopPreventSleep() {
  if (refCount > 0) {
    refCount--;
  }

  if (refCount === 0) {
    stopRestartInterval();
    killKeepAwake();
  }
}

/**
 * Force stop preventing sleep, regardless of reference count.
 * Use this for cleanup on exit.
 */
function forceStopPreventSleep() {
  refCount = 0;
  stopRestartInterval();
  killKeepAwake();
}

/**
 * Returns whether sleep prevention is currently active.
 */
function isPreventingSleep() {
  return refCount > 0 && keepAwakeProcess !== null;
}

// --- internals ---

function startRestartInterval() {
  if (process.platform !== 'win32') return;
  if (restartInterval !== null) return;

  restartInterval = setInterval(() => {
    if (refCount > 0) {
      killKeepAwake();
      spawnKeepAwake();
    }
  }, RESTART_INTERVAL_MS);

  // Don't let the interval keep Node alive
  restartInterval.unref();
}

function stopRestartInterval() {
  if (restartInterval !== null) {
    clearInterval(restartInterval);
    restartInterval = null;
  }
}

function spawnKeepAwake() {
  if (process.platform !== 'win32') return;
  if (keepAwakeProcess !== null) return;

  try {
    // Encode the script as Base64 so we can pass it as a single argument
    // without worrying about quoting/escaping.
    const encoded = Buffer.from(PS_SCRIPT, 'utf16le').toString('base64');

    keepAwakeProcess = spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-WindowStyle', 'Hidden',
        '-EncodedCommand', encoded,
      ],
      { stdio: 'ignore' }
    );

    // Don't let the child process keep Node alive
    keepAwakeProcess.unref();

    const thisProc = keepAwakeProcess;

    keepAwakeProcess.on('error', () => {
      if (keepAwakeProcess === thisProc) keepAwakeProcess = null;
    });

    keepAwakeProcess.on('exit', () => {
      if (keepAwakeProcess === thisProc) keepAwakeProcess = null;
    });
  } catch {
    keepAwakeProcess = null;
  }
}

function killKeepAwake() {
  if (keepAwakeProcess !== null) {
    const proc = keepAwakeProcess;
    keepAwakeProcess = null;
    try {
      proc.kill();
    } catch {
      // Process may have already exited
    }
  }
}

// Clean up on process exit (best-effort, won't fire on SIGKILL)
process.on('exit', () => {
  forceStopPreventSleep();
});

module.exports = {
  startPreventSleep,
  stopPreventSleep,
  forceStopPreventSleep,
  isPreventingSleep,
};
