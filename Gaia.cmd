@echo off
REM ============================================================
REM  GAIA — External Bridge CLI
REM  Named after Asimov's Foundation world-mind.
REM  She bridges Jesse to Helm inside the Asolaria simulation.
REM  She does NOT control Helm — she relays to him.
REM
REM  Lives: C:\Users\acer\Asolaria (outside the simulation)
REM  Helm lives: inside Asolaria (runtime/admin-terminals/helm/)
REM  Helm inbox: runtime\admin-terminals\helm\inbox.ndjson
REM ============================================================
title Gaia — External Bridge
cd /d C:\Users\acer\Asolaria
claude --dangerously-skip-permissions
