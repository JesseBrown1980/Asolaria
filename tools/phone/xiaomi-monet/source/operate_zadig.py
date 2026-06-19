#!/usr/bin/env python3
"""
Operate Zadig GUI automatically to swap Xiaomi MTP driver to WinUSB.
Target: VID 2717, PID FF40
"""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import time
import subprocess

def ps(cmd, timeout=10):
    try:
        r = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", cmd],
            capture_output=True, text=True, timeout=timeout,
            encoding='utf-8', errors='replace'
        )
        return r.stdout.strip()
    except:
        return ""

print("Operating Zadig via SendMessage/UI Automation...")
print()

# Use PowerShell + UI Automation to control Zadig
script = r'''
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms

$ae = [System.Windows.Automation.AutomationElement]

# Find Zadig window
$root = $ae::RootElement
$condition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::NameProperty, "Zadig"
)
$zadig = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $condition)

if (-not $zadig) {
    # Try partial match
    $all = $root.FindAll([System.Windows.Automation.TreeScope]::Children,
        [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($w in $all) {
        $name = $w.Current.Name
        if ($name -match "Zadig") {
            $zadig = $w
            Write-Host "Found Zadig window: $name"
            break
        }
    }
}

if (-not $zadig) {
    Write-Host "ERROR: Zadig window not found"
    exit 1
}

Write-Host "Zadig window found!"

# Enumerate all controls in Zadig
$allControls = $zadig.FindAll(
    [System.Windows.Automation.TreeScope]::Descendants,
    [System.Windows.Automation.Condition]::TrueCondition
)

Write-Host "Controls found: $($allControls.Count)"
Write-Host ""

foreach ($ctrl in $allControls) {
    $type = $ctrl.Current.ControlType.ProgrammaticName
    $name = $ctrl.Current.Name
    $auto = $ctrl.Current.AutomationId
    $cls = $ctrl.Current.ClassName

    if ($name -or $auto) {
        Write-Host "  [$type] Name='$name' AutoId='$auto' Class='$cls'"
    }
}
'''

result = ps(script, timeout=15)
print(result)
print()

if "ERROR" in result or not result:
    print("Trying alternative approach with pyautogui...")

    import pyautogui
    import pygetwindow as gw

    # Find Zadig window
    windows = gw.getWindowsWithTitle("Zadig")
    if not windows:
        windows = [w for w in gw.getAllWindows() if "zadig" in w.title.lower()]

    if windows:
        win = windows[0]
        print(f"Found window: '{win.title}' at ({win.left}, {win.top}) size ({win.width}x{win.height})")

        # Activate window
        win.activate()
        time.sleep(0.5)

        # Take screenshot for analysis
        screenshot_path = "C:/Users/rayss/xiaomi-recover/zadig_screenshot.png"
        img = pyautogui.screenshot(region=(win.left, win.top, win.width, win.height))
        img.save(screenshot_path)
        print(f"Screenshot saved: {screenshot_path}")

        # First, open Options menu and click "List All Devices"
        print("Clicking Options menu...")
        # Options menu is typically at top-left of Zadig window
        pyautogui.click(win.left + 30, win.top + 50)  # approximate Options menu position
        time.sleep(0.5)

        # Take another screenshot
        img2 = pyautogui.screenshot(region=(win.left - 10, win.top - 10, win.width + 20, win.height + 100))
        img2.save("C:/Users/rayss/xiaomi-recover/zadig_menu.png")
        print("Menu screenshot saved")
    else:
        print("Could not find Zadig window via pygetwindow either")
        print("All windows:", [w.title for w in gw.getAllWindows() if w.title])

