const { app, BrowserWindow } = require('electron');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');

// Synthetic camera and microphone only; no personal footage or network writes.
app.commandLine.appendSwitch('use-fake-device-for-media-stream');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
require('../main');

const timeout = setTimeout(() => { console.error('Smoke test timed out'); app.exit(1); }, 45000);
app.whenReady().then(async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'camera-smoke-'));
  app.setPath('downloads', folder);
  let exitCode = 0;
  try {
    const window = BrowserWindow.getAllWindows()[0];
    while (window.webContents.isLoading()) await new Promise(r => setTimeout(r, 100));
    const result = await window.webContents.executeJavaScript(`(async () => {
      for (let i = 0; btn.disabled && i < 100; i++) await new Promise(r => setTimeout(r, 100));
      if (btn.disabled) throw new Error(status.textContent || 'Camera did not initialize');
      folder = ${JSON.stringify(folder)};
      $('pid').value = 'smoke';
      $('minutes').value = '0.02';
      start();
      if (!$('choose').disabled || !$('pid').disabled) throw new Error('Recording metadata is editable');
      for (let i = 0; !status.textContent.startsWith('Saved:') && i < 200; i++) await new Promise(r => setTimeout(r, 100));
      if (!status.textContent.startsWith('Saved:')) throw new Error(status.textContent);
      folder += '/missing';
      $('pid').value = 'fallback';
      start();
      for (let i = 0; !status.textContent.includes('Local copy saved:') && i < 200; i++) await new Promise(r => setTimeout(r, 100));
      if (!status.textContent.includes('Local copy saved:')) throw new Error(status.textContent);
      return { message: status.textContent, unlocked: !btn.disabled && !$('choose').disabled };
    })()`);
    assert.equal(result.unlocked, true);
    const files = await fs.readdir(folder);
    assert.equal(files.length, 2);
    const bytes = await fs.readFile(path.join(folder, files[0]));
    assert.ok(bytes.length > 1000, 'Recording must contain media');
    assert.equal(bytes.toString('ascii', 4, 8), 'ftyp', 'Recording must be MP4');
    console.log('PASS: desktop bridge, synthetic camera/audio, timed stop, MP4 save, local fallback, controls unlocked');
  } catch (error) {
    console.error(error);
    exitCode = 1;
  } finally {
    await fs.rm(folder, { recursive: true, force: true });
    clearTimeout(timeout);
    app.exit(exitCode);
  }
});
