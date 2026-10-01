const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, dialog, ipcMain, session, shell } = require("electron");
const fs = require("node:fs/promises");
const { saveRecording } = require("./storage");

const APP_ORIGIN = pathToFileURL(__dirname + path.sep).href;
const savedRecordings = new Set();

function isTrustedPage(url) {
  return url.startsWith(APP_ORIGIN);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 920,
    height: 780,
    minWidth: 640,
    minHeight: 600,
    backgroundColor: "#f4f4f5",
    title: "Camera Recorder",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  window.removeMenu();
  window.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
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
  app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on("window-all-closed", () => app.quit());
