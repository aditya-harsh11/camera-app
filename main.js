const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, dialog, ipcMain, session, shell } = require("electron");
const fs = require("node:fs/promises");
const { saveRecording } = require("./storage");
const { startUpdates } = require("./updater");
app.setName("SCS Camera-App");

const APP_ORIGIN = pathToFileURL(__dirname + path.sep).href;
const savedRecordings = new Set();
let updateStatus = '';

function isTrustedPage(url) {
  return url.startsWith(APP_ORIGIN);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 960,
    minWidth: 480,
    minHeight: 480,
    resizable: true,
    backgroundColor: "#f4f4f5",
    title: "SCS Camera-App",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  window.removeMenu();
  window.webContents.on('will-prevent-unload', () => {
    void dialog.showMessageBox(window, {
      type: 'info', title: 'Recording not saved',
      message: 'Stop recording and wait for it to save before closing the app.',
      buttons: ['OK'],
    });
  });
  window.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  if (process.platform === "darwin") app.dock.setIcon(path.join(__dirname, "assets", "icon.png"));
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    return permission === "media" && isTrustedPage(webContents.getURL());
  });
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === "media" && isTrustedPage(webContents.getURL()));
  });

  ipcMain.handle("recording:save", async (event, request) => {
    if (!isTrustedPage(event.senderFrame.url)) throw new Error("Untrusted save request.");
    const bytes = Buffer.from(request.bytes);
    const savedPath = await saveRecording(request.folder, request.filename, bytes);
    savedRecordings.add(savedPath);
    return savedPath;
  });

  ipcMain.handle("recording:save-fallback", async (event, request) => {
    if (!isTrustedPage(event.senderFrame.url)) throw new Error("Untrusted save request.");
    const bytes = Buffer.from(request.bytes);
    const savedPath = await saveRecording(app.getPath("downloads"), request.filename, bytes);
    savedRecordings.add(savedPath);
    return savedPath;
  });

  ipcMain.handle("recording:reveal", async (event, filePath) => {
    if (!isTrustedPage(event.senderFrame.url) || !savedRecordings.has(filePath)) {
      throw new Error("Only recordings saved by this app can be revealed.");
    }
    await fs.access(filePath);
    shell.showItemInFolder(filePath);
  });

  // Opens the normal Windows folder picker. Returns "" if cancelled.
  ipcMain.handle("folder:choose", async (event, start) => {
    if (!isTrustedPage(event.senderFrame.url)) throw new Error("Untrusted folder request.");
    const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
      title: "Pick where to save recordings",
      defaultPath: start,
      properties: ["openDirectory", "createDirectory"],
    });
    return canceled ? "" : filePaths[0];
  });

  createWindow();
  ipcMain.handle('updates:status', () => updateStatus);
  if (app.isPackaged && process.platform === 'win32' && !process.env.PORTABLE_EXECUTABLE_FILE) {
    startUpdates({ updater: require('electron-updater').autoUpdater, app,
      report: message => {
        updateStatus = message;
        for (const window of BrowserWindow.getAllWindows()) window.webContents.send('updates:status', message);
      },
    });
  }
  app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on("window-all-closed", () => app.quit());
