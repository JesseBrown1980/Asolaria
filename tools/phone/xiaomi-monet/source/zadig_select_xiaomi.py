#!/usr/bin/env python3
"""Select Xiaomi in Zadig dropdown and install WinUSB driver."""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import time
import pyautogui
import pygetwindow as gw

# Find Zadig
windows = gw.getWindowsWithTitle("Zadig")
if not windows:
    windows = [w for w in gw.getAllWindows() if "zadig" in w.title.lower()]

if not windows:
    print("Zadig not found!")
    sys.exit(1)

win = windows[0]
win.activate()
time.sleep(0.5)

print(f"Zadig at ({win.left}, {win.top}) {win.width}x{win.height}")

# Take screenshot first
img = pyautogui.screenshot()
img.save("C:/Users/rayss/xiaomi-recover/zadig_full.png")
print("Full screenshot saved")

# The ComboBox (device selector) is at AutoId 1001
# We need to click on it and select the Xiaomi device
# The ComboBox shows "CDC Abstract Control Model (ACM)" which is Samsung
# We need to find and click on the dropdown, then select Xiaomi

# First, let's check - maybe we need to enable "List All Devices" first
# Options menu is at the top of the Zadig window
# Let's click on Options in the menu bar

# Zadig menu bar: Device | Options | Help (approximately)
menu_y = win.top + 40  # menu bar
options_x = win.left + 80  # rough position for Options

print("Opening Options menu...")
pyautogui.click(options_x, menu_y)
time.sleep(0.5)

# Screenshot the menu
img2 = pyautogui.screenshot()
img2.save("C:/Users/rayss/xiaomi-recover/zadig_options.png")
print("Options menu screenshot saved")

# "List All Devices" should be in this menu
# Click on it (it's usually the first or second item)
print("Looking for 'List All Devices'...")
pyautogui.click(options_x, menu_y + 25)  # first menu item
time.sleep(0.3)

img3 = pyautogui.screenshot()
img3.save("C:/Users/rayss/xiaomi-recover/zadig_after_option.png")
print("After option click screenshot saved")
print()
print("Screenshots saved. Check them to see current Zadig state.")
print("Then we select Xiaomi from the dropdown.")

