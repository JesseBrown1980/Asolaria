"""
Zadig Attack — Select Xiaomi, Install libusbK, then immediately run AOA keyboard.
Shannon Pipeline Phase 3: Combined exploit.
"""
import sys; sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import pyautogui, pygetwindow as gw, time

pyautogui.PAUSE = 0.15

# Find Zadig
win = [w for w in gw.getAllWindows() if 'Zadig' in w.title]
if not win:
    print("[-] Zadig not open!")
    sys.exit(1)
win = win[0]
win.activate()
time.sleep(0.5)

WL = win.left
WT = win.top
print(f"Zadig at ({WL},{WT}) {win.width}x{win.height}")

# Step 1: Click the dropdown to open it
# Dropdown is at roughly center of the combobox area
dropdown_x = WL + 280
dropdown_y = WT + 78
print(f"[1] Clicking dropdown at ({dropdown_x},{dropdown_y})")
pyautogui.click(dropdown_x, dropdown_y)
time.sleep(0.5)

# Screenshot the open dropdown
img = pyautogui.screenshot(region=(WL-10, WT-10, win.width+20, win.height+200))
img.save("C:/Users/rayss/xiaomi-recover/zadig_dropdown_open.png")
print("[1] Dropdown opened, screenshot saved")

# Step 2: Look for Mi 10 Lite in the dropdown
# The dropdown items appear below the combobox
# Try clicking each item and checking if VID changes to 2717
# First, let's try arrow keys to navigate
# Press Home to go to top of list
pyautogui.press('home')
time.sleep(0.3)

# Iterate through dropdown items looking for Mi 10
found = False
for i in range(20):
    # Screenshot to read current selection
    img = pyautogui.screenshot(region=(WL+15, WT+120, 200, 30))
    # Check USB ID area for 2717
    img2 = pyautogui.screenshot(region=(WL+60, WT+148, 80, 20))
    img2.save(f"C:/Users/rayss/xiaomi-recover/za_item_{i:02d}.png")

    # Also grab the full line to see device name
    img3 = pyautogui.screenshot(region=(WL+15, WT+68, 500, 25))
    img3.save(f"C:/Users/rayss/xiaomi-recover/za_name_{i:02d}.png")

    # Press Enter to select, check VID
    # Actually, just press down arrow to cycle
    if i > 0:
        pyautogui.press('down')
        time.sleep(0.3)

# After cycling, screenshot to see where we are
time.sleep(0.3)
img_final = pyautogui.screenshot(region=(WL, WT, win.width, win.height))
img_final.save("C:/Users/rayss/xiaomi-recover/zadig_after_cycle.png")
print(f"[2] Cycled through {20} items. Check screenshots.")
print("[2] Now selecting current item...")
pyautogui.press('enter')
time.sleep(0.5)

# Final screenshot
img_sel = pyautogui.screenshot(region=(WL, WT, win.width, win.height))
img_sel.save("C:/Users/rayss/xiaomi-recover/zadig_selected.png")
print("[3] Selection made. Check zadig_selected.png")

