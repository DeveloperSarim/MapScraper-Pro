@echo off
title MapScraper Pro
echo.
echo  ================================
echo   MapScraper Pro - Starting...
echo  ================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Python found. Starting server on http://localhost:8788
    echo  [OK] Opening browser...
    echo.
    echo  Press Ctrl+C to stop the server.
    echo.
    start "" "http://localhost:8788"
    python -m http.server 8788
) else (
    python3 --version >nul 2>&1
    if %errorlevel% == 0 (
        echo  [OK] Python3 found. Starting server on http://localhost:8788
        start "" "http://localhost:8788"
        python3 -m http.server 8788
    ) else (
        echo  [ERROR] Python not found!
        echo.
        echo  Please install Python from: https://www.python.org/downloads/
        echo  Make sure to check "Add Python to PATH" during install.
        echo.
        pause
    )
)
