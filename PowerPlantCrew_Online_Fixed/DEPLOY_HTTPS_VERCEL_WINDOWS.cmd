@echo off
setlocal
cd /d "%~dp0"
title Power Plant Crew - Public HTTPS Vercel Deployment

echo ================================================================
echo POWER PLANT CREW - DEPLOY PUBLIC WEB GAME (VERCEL)
echo ================================================================
echo This publishes the Vite/React frontend to a unique HTTPS website.
echo Multiplayer runs on SpacetimeDB Maincloud: powerplantnov.
echo The SpacetimeDB CLI and spacetime dev are NOT needed here.
echo You will be asked to authorize Vercel and choose a project.
echo.
where node >nul 2>nul
if errorlevel 1 goto :node_missing
where npm.cmd >nul 2>nul
if errorlevel 1 goto :npm_missing

echo [1/4] Checking Node.js version...
node --version
node -e "const v=process.versions.node.split('.').map(Number); if(!((v[0]===22 && (v[1]>23||(v[1]===23&&v[2]>=4)))||(v[0]===24&&(v[1]>22||(v[1]===22&&v[2]>=1)))||(v[0]===26&&(v[1]>12||(v[1]===12&&v[2]>=1)))||v[0]>26)){console.error('This project requires Node 22.23.4+, 24.22.1+, or 26.12.1+. Upgrade Node first.'); process.exit(1)}"
if errorlevel 1 goto :failed

echo [2/4] Installing pinned dependencies...
call npm.cmd ci
if errorlevel 1 goto :failed

echo [3/4] Checking types and building production website...
call npm.cmd run build:public
if errorlevel 1 goto :failed

echo [4/4] Logging in and publishing to Vercel...
echo A browser window may open. Follow Vercel CLI's prompts.
call npx.cmd --yes vercel@latest login
if errorlevel 1 goto :failed
call npx.cmd --yes vercel@latest --prod
if errorlevel 1 goto :failed

echo.
echo SUCCESS: Your public HTTPS URL is printed by Vercel above.
echo Open that URL in a browser, create a lobby, and scan the QR on a phone.
echo It is NOT necessary to run spacetime dev or npm run dev for players.
echo.
pause
exit /b 0

:node_missing
echo Node.js is missing from PATH. Install a compatible Node LTS release.
goto :failed
:npm_missing
echo npm.cmd is missing from PATH. Reinstall Node.js and reopen this window.
goto :failed
:failed
echo.
echo Deployment did NOT complete. No live URL has been created by this script.
echo Copy the FIRST error above to troubleshoot.
pause
exit /b 1
