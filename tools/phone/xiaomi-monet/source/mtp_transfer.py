"""
MTP Transfer — Pull photos from Xiaomi, push to Samsung via ADB
Uses Windows Shell COM to navigate MTP device
"""
import subprocess
import sys
import os
import win32com.client

def find_mtp_device(name_filter):
    """Find MTP device in My Computer"""
    shell = win32com.client.Dispatch("Shell.Application")
    mypc = shell.NameSpace(17)  # My Computer
    for item in mypc.Items():
        if name_filter.lower() in item.Name.lower():
            return item
    return None

def list_mtp_contents(folder, depth=0, max_depth=3):
    """Recursively list MTP folder contents"""
    items = []
    if depth > max_depth:
        return items
    try:
        f = folder.GetFolder
        if f:
            for item in f.Items():
                prefix = "  " * depth
                print(f"{prefix}-> {item.Name}")
                items.append(item)
                if item.IsFolder:
                    items.extend(list_mtp_contents(item, depth + 1, max_depth))
    except Exception as e:
        print(f"  Error: {e}")
    return items

def copy_from_mtp(src_folder, dest_path):
    """Copy files from MTP folder to local path"""
    os.makedirs(dest_path, exist_ok=True)
    shell = win32com.client.Dispatch("Shell.Application")
    dest = shell.NameSpace(dest_path)

    try:
        f = src_folder.GetFolder
        if f:
            for item in f.Items():
                print(f"  Copying: {item.Name}")
                dest.CopyHere(item, 16 | 4)  # 16=yes to all, 4=no progress
    except Exception as e:
        print(f"  Copy error: {e}")

import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
print("=== MTP TRANSFER ===")

# Find Xiaomi
print("\n[1] Finding Xiaomi...")
xiaomi = find_mtp_device("Mi 10")
if not xiaomi:
    xiaomi = find_mtp_device("Mi")
if not xiaomi:
    print("Xiaomi not found in My Computer!")
    sys.exit(1)

print(f"Found: {xiaomi.Name}")

# List contents
print("\n[2] Listing contents...")
list_mtp_contents(xiaomi, max_depth=2)

# Find and copy Imagens (photos)
print("\n[3] Looking for photo folders...")
try:
    device_folder = xiaomi.GetFolder
    if device_folder:
        for storage in device_folder.Items():
            print(f"Storage: {storage.Name}")
            sf = storage.GetFolder
            if sf:
                for folder in sf.Items():
                    name = folder.Name.lower()
                    if any(k in name for k in ['imag', 'dcim', 'photo', 'picture', 'camera']):
                        print(f"  PHOTO FOLDER: {folder.Name}")
                        dest = f"C:\\Users\\rayss\\xiaomi-backup\\{folder.Name}"
                        print(f"  Copying to {dest}...")
                        copy_from_mtp(folder, dest)
                    elif 'aether' in name:
                        print(f"  AETHER DATA: {folder.Name}")
                        dest = f"C:\\Users\\rayss\\xiaomi-backup\\{folder.Name}"
                        print(f"  Copying to {dest}...")
                        copy_from_mtp(folder, dest)
except Exception as e:
    print(f"Error navigating: {e}")

print("\n[4] Transfer complete. Check C:\\Users\\rayss\\xiaomi-backup\\")

