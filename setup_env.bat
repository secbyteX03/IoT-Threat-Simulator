@echo off
SET NODE_PATH=C:\Users\Administrator\AppData\Local\nvm\v20.17.0
SET PATH=%NODE_PATH%;%NODE_PATH%\node_modules\npm\bin;%PATH%

call npm install

if %ERRORLEVEL% EQU 0 (
    echo Dependencies installed successfully!
    echo Now you can run: npm run dev
) else (
    echo Failed to install dependencies. Please check the error above.
)

pause
