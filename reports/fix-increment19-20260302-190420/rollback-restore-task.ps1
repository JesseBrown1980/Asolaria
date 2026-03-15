param()
 = Join-Path  'before-task.xml'
schtasks /create /tn \"Asolaria NotebookLM Upgrade Loop\" /xml \"\" /f
