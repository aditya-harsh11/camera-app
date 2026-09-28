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

### Desktop app (recommended)

**One-time setup**
1. Download `Camera Recorder Setup` from the latest GitHub release and run it. Windows may show a SmartScreen warning because the app is not code-signed; choose **More info → Run anyway**.
2. Turn on the campus VPN.
3. Open `\\research.drive.wisc.edu\niedenthal` in File Explorer. Sign in with your NetID and tick **"Remember my credentials"**.

**Each time**
1. Turn on the campus VPN.
2. Open **Camera Recorder** from the Start menu or desktop.

The portable `.exe` in each release runs without installation. Both builds include the browser engine they need.

### Browser version

Developers can still run `start.bat` with Python installed to use the browser version.

## Recording
1. Allow camera and mic when the browser asks.
2. Type the dyad ID (e.g. `111`).
3. Press **Start recording**, then **Stop recording**. The video saves to ResearchDrive.

When using the browser version, keep the black terminal window open. The Windows desktop app does not open a terminal.

## Good to know
- The VPN is needed unless the computer is plugged into a campus network cable.
- If a file with the same name already exists, `_2`, `_3`, … is added. Nothing is overwritten.
- If saving fails, a copy goes to the Downloads folder so nothing is lost.
- You can change the save folder in the app. It remembers your choice.
