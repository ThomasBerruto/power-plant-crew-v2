@echo off
cd /d "%~dp0"
echo Building HTML/CSS/JS for your public hosted site; SpacetimeDB CLI NOT needed.
call npm.cmd ci
if errorlevel 1 goto :bad
call npm.cmd run build:public
if errorlevel 1 goto :bad
echo.
echo Success: drag the dist folder to https://app.netlify.com/drop
pause
exit /b 0
:bad
echo Build failed. Check terminal output; may need Node 22.23.4 or newer.
pause
exit /b 1
