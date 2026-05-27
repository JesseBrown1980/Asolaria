@echo off
REM ============================================================
REM  HELM — External Controller Terminal
REM  Runs independently of Asolaria (she can be down, Helm still works)
REM  Identity: Helm, admin-helm-v1, controller
REM  Working dir: C:\Users\acer\Asolaria
REM ============================================================
cd /d C:\Users\acer\Asolaria

REM Load identity via --print flag to inject the bootstrap prompt
REM into the first message of the new Claude Code session
claude --dangerously-skip-permissions --print "$(type runtime\admin-terminals\helm\bootstrap-prompt.txt)" 2>nul || claude --dangerously-skip-permissions

REM If --print isn't available, just open interactively —
REM Helm reads bootstrap-prompt.txt as first step per that file's instructions
