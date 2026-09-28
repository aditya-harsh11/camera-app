# Camera Recorder

Records video from the computer's camera and saves it to ResearchDrive
(`niedenthal/UW_Fall2026`), named like `dyad-111_09282026-034200.mp4` (dyad ID + date + time recording started).

Records in 16:9 full HD (1920×1080) if the camera supports it.

## Mac

**One-time setup**
1. Install Python if the Mac doesn't have it: open Terminal and type `python3`.
   If it offers to install tools, click Install.
2. Turn on the campus VPN.
3. In Finder, press ⌘K and enter `smb://research.drive.wisc.edu/niedenthal`.
   Sign in with your NetID and tick **"Remember this password in my keychain"**.

**Each time**
1. Turn on the campus VPN.
2. Double-click `start.command`. It connects ResearchDrive and opens the app in your browser.
3. Use Chrome or Safari.

## Windows

**One-time setup**
1. Install Python from python.org. Tick **"Add python.exe to PATH"** during setup.
2. Turn on the campus VPN.
3. Double-click `start.bat`. Sign in with your NetID and tick **"Remember my credentials"**.

**Each time**
1. Turn on the campus VPN.
2. Double-click `start.bat`. The app opens in your browser.
3. Use Chrome or Edge.

## Recording
1. Allow camera and mic when the browser asks.
2. Type the dyad ID (e.g. `111`).
3. Press **Start recording**, then **Stop recording**. The video saves to ResearchDrive.

Keep the black window (Terminal) open while using the app. Closing it stops the app.

## Good to know
- The VPN is needed unless the computer is plugged into a campus network cable.
- If a file with the same name already exists, `_2`, `_3`, … is added. Nothing is overwritten.
- If saving fails, a copy goes to the Downloads folder so nothing is lost.
- You can change the save folder in the app. It remembers your choice.
