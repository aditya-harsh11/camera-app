const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cameraApp", {
  platform: process.platform,
  saveRecording: (folder, filename, bytes) =>
    ipcRenderer.invoke("recording:save", { folder, filename, bytes }),
  saveFallback: (filename, bytes) =>
    ipcRenderer.invoke("recording:save-fallback", { filename, bytes }),
});
