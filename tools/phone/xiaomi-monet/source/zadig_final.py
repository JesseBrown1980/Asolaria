"""Final Zadig operation — exact pixel targeting from hi-res screenshot"""
import sys; sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import pyautogui, time, pygetwindow as gw

pyautogui.PAUSE = 0.15

win = [w for w in gw.getAllWindows() if 'Zadig' in w.title]
if not win:
    print("Zadig not open!")
    sys.exit(1)
win = win[0]
win.activate()
time.sleep(0.5)

# From hi-res screenshot (zadig_hires.png), window at (388,72) size 589x261:
# Layout (relative to window top-left):
#   Row 1 (y~32): Menu bar: Device | Options | Help
#   Row 2 (y~68): [dropdown ComboBox] ................ [Edit checkbox]
#   Row 3 (y~100): Driver  [current] ====> [target WinUSB]  [up/down arrows]
#   Row 4 (y~130): USB ID  [04E8]  [6860]
#   Row 5 (y~155): WCID    [x]      [Replace Driver button]
#   Row 6 (y~185): Status bar

WL = win.left
WT = win.top

# Step 1: Make sure Edit is checked
edit_x = WL + 536
edit_y = WT + 68
print(f"1. Checking Edit at ({edit_x},{edit_y})")
# Take screenshot to see if already checked
img = pyautogui.screenshot(region=(WL, WT, win.width, win.height))
img.save("C:/Users/rayss/xiaomi-recover/zf_before.png")

# Step 2: Click the VID field "04E8" — it's at USB ID row
# From screenshot: "USB ID" label ~x+18, "04E8" ~x+80, "6860" ~x+125
vid_x = WL + 80
vid_y = WT + 130
print(f"2. Triple-click VID at ({vid_x},{vid_y})")
pyautogui.tripleClick(vid_x, vid_y)
time.sleep(0.3)
pyautogui.typewrite('2717', interval=0.1)
time.sleep(0.3)

# Step 3: Click PID field "6860"
pid_x = WL + 125
pid_y = WT + 130
print(f"3. Triple-click PID at ({pid_x},{pid_y})")
pyautogui.tripleClick(pid_x, pid_y)
time.sleep(0.3)
pyautogui.typewrite('FF40', interval=0.1)
time.sleep(0.3)

# Screenshot to verify
img2 = pyautogui.screenshot(region=(WL, WT, win.width, win.height))
img2.save("C:/Users/rayss/xiaomi-recover/zf_after_vid.png")

# Step 4: Click "Replace Driver" button
# Button is at approximately x+220, y+155 (centered in the window)
replace_x = WL + 260
replace_y = WT + 160
print(f"4. Clicking Replace Driver at ({replace_x},{replace_y})")
pyautogui.click(replace_x, replace_y)
time.sleep(1)

# Final screenshot
img3 = pyautogui.screenshot(region=(WL-5, WT-5, win.width+10, win.height+50))
img3.save("C:/Users/rayss/xiaomi-recover/zf_result.png")
print("Done. Check screenshots.")

