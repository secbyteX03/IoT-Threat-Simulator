@echo off
SET NODE_PATH=C:\Users\Administrator\AppData\Local\nvm\v20.17.0
SET PATH=%NODE_PATH%;%NODE_PATH%\node_modules\npm\bin;%PATH%

cd /d %~dp0

echo Checking TypeScript in web app...
cd apps\web
call npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo TypeScript check failed in web app
    exit /b %ERRORLEVEL%
)
cd ..\..

echo Checking TypeScript in server...
cd server
call npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo TypeScript check failed in server
    exit /b %ERRORLEVEL%
)
cd ..\..

echo All TypeScript checks passed!
pause
