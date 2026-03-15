# Runtime Path Repair

- Generated: 2026-03-02 21:52:09Z
- Applied: True
- Rollback file: C:\Users\acer\Asolaria\reports\runtime-path-repair-20260302-215209-rollback.json
- Machine PATH changed: False
- User PATH changed: True
- User JAVA_HOME changed: False

## Resolution
- where python:
  - C:\Users\acer\AppData\Local\Microsoft\WindowsApps\python.exe
  - C:\Users\acer\AppData\Local\Programs\Python\Python313\python.exe
  - C:\Users\acer\anaconda3\python.exe
- python --version: Python 3.13.12
- where java:
  - C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot\bin\java.exe
  - C:\Java\jdk1.8.0_392\bin\java.exe
- java -version (first line): openjdk version "21.0.10" 2026-01-20 LTS

## Guardrails
- WindowsApps in Machine PATH: True
- Notes:
  - Microsoft WindowsApps PATH entry was preserved.
  - Rollback file captured original PATH/JAVA_HOME values.
