@echo off
cd /d "%~dp0"
echo This script requests a unique HTTPS site from Netlify after YOU log in.
echo Your game uses SpacetimeDB Maincloud; it does not upload your source database.
echo.
call npm.cmd ci
if errorlevel 1 goto :bad
call npm.cmd run build:public
if errorlevel 1 goto :bad
echo.
echo Netlify will ask you to authenticate and choose/create a website.
echo It will output the exact https://...netlify.app address if the upload succeeds.
call npx.cmd --yes netlify-cli deploy --prod --dir=dist
if errorlevel 1 goto :bad
echo.
echo Deploy complete: open the URL printed above and create a lobby.
pause
exit /b 0
:bad
echo Deployment did not complete. No public URL can be claimed yet.
pause
exit /b 1
