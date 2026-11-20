@echo off
setlocal
cd /d "%~dp0"
echo === Power Plant Crew diagnostics ===
echo PROJECT: %CD%
echo.
echo === Node and npm ===
where node
node --version
where npm.cmd
call npm.cmd --version
echo.
echo === SpacetimeDB CLI (only needed to modify and publish backend) ===
where spacetime
if errorlevel 1 (
  echo NOTE: spacetime not found on PATH. The public hosted game does not require it.
  echo Open a NEW PowerShell after installing SpacetimeDB CLI.
) else (
  spacetime --version
  spacetime help dev
)
echo.
echo === Production configuration ===
type .env.production
echo.
echo === Server config ===
type spacetime.json
echo.
echo For website preview run: npm.cmd run dev
echo For public hosting run: DEPLOY_HTTPS_VERCEL_WINDOWS.cmd
pause
