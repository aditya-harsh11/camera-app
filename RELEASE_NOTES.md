# SCS Camera-App v1.2.0

## Automatic Windows updates

Install the v1.2.0 **Setup** executable once on each Windows computer, over the existing installation. Earlier versions cannot update themselves.

Installed copies check for updates at startup and every four hours. Updates download in the background. When the app says **Update ready**, close it, allow installation to finish, then reopen to use the new version. The updater never initiates a quit during recording. Closing is blocked while a recording is active or unsaved, including when a save needs retrying.

Offline update checks do not prevent recording and retry automatically. Portable executables and Mac builds do not auto-update. An internet connection to GitHub is needed for updates.

Three additional updater tests cover offline retries, unsupported build exclusion, and overlapping download prevention. Windows CI validates the packaged update provider, installer checksum, version, and blockmap. The installer and update metadata are uploaded to a draft release before publication.

A real installed v1.2.0-to-future-version upgrade on the target PCs has not yet been exercised. Previous releases remain unchanged. Future updates will use new, increasing version numbers.

## Existing features

Includes Aditya's timed recording and native folder picker changes through commit 501adc8.

The app is now named SCS Camera-App and uses the supplied camera artwork for its application, installer, and shortcut icons. Download the SCS Camera-App executables for this updated build.

The app opens with a larger camera preview. Drag its bottom-right grip to resize it; a brief animated Resizable cue appears on opening. Controls reflow in narrow windows, and the preview preserves the full camera frame without stretching or cropping.

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
