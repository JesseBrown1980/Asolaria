#!/usr/bin/env python3
"""Operate Zadig: Options > List All Devices > Select Xiaomi > Replace Driver"""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import time
import pyautogui
import pygetwindow as gw

pyautogui.PAUSE = 0.3

# Find Zadig
windows = [w for w in gw.getAllWindows() if "Zadig" in w.title]
if not windows:
    print("Zadig not found!")
    sys.exit(1)

win = windows[0]
win.activate()
time.sleep(0.5)

print(f"Zadig: '{win.title}' at ({win.left},{win.top}) {win.width}x{win.height}")

# Close the "Driver Installation" error dialog first if it's showing
# The "Close" button is visible in the dialog
# Look for it
img = pyautogui.screenshot(region=(win.left, win.top, win.width, win.height))
# The error dialog has a "Close" button - click it
# From the UI dump: Name='Close' AutoId='7'
# Let's try clicking it - it should be in the dialog area
# Looking at screenshot: the "Close" button is roughly at center of dialog

# First try pressing Escape to close any dialog
pyautogui.press('escape')
time.sleep(0.3)

# Click on "Options" in menu bar
# Menu bar: "Device" | "Options" | "Help"
# From screenshot, Options is at approximately x=345 from left edge of screen
options_x = win.left + 57  # "Options" text position relative to window
options_y = win.top + 33   # menu bar height
print(f"Clicking Options at ({options_x}, {options_y})...")
pyautogui.click(options_x, options_y)
time.sleep(0.5)

# Take screenshot to see menu
img2 = pyautogui.screenshot()
img2.save("C:/Users/rayss/xiaomi-recover/zadig_step1.png")
print("Step 1 screenshot saved")

