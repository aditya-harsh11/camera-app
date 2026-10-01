function startUpdates({ updater, app, platform = process.platform, env = process.env, report, schedule = setInterval }) {
  if (!app.isPackaged || platform !== 'win32' || env.PORTABLE_EXECUTABLE_FILE) return;
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.autoRunAppAfterInstall = false;
  updater.allowPrerelease = false;
  updater.allowDowngrade = false;
  updater.on('update-available', () => report('Downloading update...'));
  updater.on('update-not-available', () => report('Up to date'));
  updater.on('update-downloaded', () => report('Update ready. Installs when you close the app.'));
  updater.on('error', () => report('Update check failed. Will retry automatically.'));
  let checking = false;
  const check = async () => {
    if (checking) return;
    checking = true;
    try {
      const result = await updater.checkForUpdates();
      if (result?.downloadPromise) await result.downloadPromise;
    } catch {
      report('Update check failed. Will retry automatically.');
    } finally {
      checking = false;
    }
  };
  void check();
  const timer = schedule(check, 4 * 60 * 60 * 1000);
  timer.unref?.();
}

module.exports = { startUpdates };
