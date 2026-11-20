@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 goto :failed
)
call npm.cmd run dev
if errorlevel 1 goto :failed
exit /b 0
:failed
echo Error. Check Node version and dependencies using CHECK_SETUP_WINDOWS.cmd.
pause
exit /b 1
