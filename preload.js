const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cameraApp", {
  platform: process.platform,
  onUpdateStatus: (callback) => {
    ipcRenderer.on('updates:status', (_event, message) => callback(message));
    ipcRenderer.invoke('updates:status').then(callback).catch(() => {});
  },
  saveRecording: (folder, filename, bytes) =>
    ipcRenderer.invoke("recording:save", { folder, filename, bytes }),
  saveFallback: (filename, bytes) =>
    ipcRenderer.invoke("recording:save-fallback", { filename, bytes }),
  chooseFolder: (start) => ipcRenderer.invoke("folder:choose", start),
  revealRecording: (filePath) => ipcRenderer.invoke("recording:reveal", filePath),
});
