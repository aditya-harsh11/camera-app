# Camera Recorder v1.1.0

Includes Aditya's timed recording and native folder picker changes through commit 501adc8.

Updated release: click a saved recording path to reveal the file in Finder or Windows File Explorer. Desktop fallback copies in Downloads are clickable too.

- Set a recording duration (10 minutes by default); recording stops and saves automatically.
- Choose an existing save folder using the desktop folder picker, including local folders, mapped drives, and accessible network shares.
- Recording identity, duration, and destination stay locked during recording and saving.
- Invalid dyad IDs are rejected before recording. Stop immediately disables the recording button while saving begins.
- Failed destination saves fall back to Downloads. If both saves fail, Retry saving retains the clip in memory; keep the app open until it saves.
- Background timer throttling is disabled in the desktop app for timed recording.

## Downloads

Use the Setup executable for installation or the portable executable to run without installation. Both target Windows x64 and include their runtime; Python and Node.js are not required.

The executables are unsigned and Windows may display a SmartScreen warning. ResearchDrive still requires network/VPN access and the appropriate Windows credentials.

## Validation

Eight automated regression tests cover folder/name validation, no-overwrite saves, recording metadata, stop/save controls, retry behavior, and clickable saved paths. The Windows release workflow also runs a desktop test with synthetic camera/audio input, timed stop, MP4 output, local fallback, and dispatch of both saved paths to the native reveal API before building and publishing.

Physical Windows cameras, installation on a separate Windows PC, and private ResearchDrive access still require a test on the target computer. The v1.0.0 release remains available.
