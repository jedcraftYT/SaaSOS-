@echo off
echo ========================================
echo   TrackFlow GPS Tracking Dashboard
echo ========================================
echo.
echo Starting local server...
echo.
echo Dashboard will be available at:
echo http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

python -m http.server 8000

pause
