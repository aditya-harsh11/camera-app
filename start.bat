@echo off
cd /d "%~dp0"

rem Connect ResearchDrive if it isn't reachable yet (opens the Windows sign-in box).
if not exist "\\research.drive.wisc.edu\niedenthal\" (
  echo Connecting to ResearchDrive... Sign in with your NetID and tick "Remember my credentials".
  start "" explorer "\\research.drive.wisc.edu\niedenthal"
  pause
)

where py >nul 2>nul
if %errorlevel%==0 (py server.py) else (python server.py)
pause
