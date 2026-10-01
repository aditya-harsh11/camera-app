const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { startUpdates } = require('../updater');

function setup(overrides = {}) {
  const updater = new EventEmitter();
  let calls = 0;
  let retry;
  const messages = [];
  updater.checkForUpdates = async () => { calls++; throw Error('offline'); };
  startUpdates({ updater, app: { isPackaged: true }, platform: 'win32', env: {},
    report: message => messages.push(message),
    schedule: callback => { retry = callback; return { unref() {} }; }, ...overrides });
  return { updater, messages, calls: () => calls, retry: () => retry() };
}

test('offline startup is nonfatal and a later check can succeed', async () => {
  const h = setup();
  await new Promise(resolve => setImmediate(resolve));
  assert.match(h.messages.at(-1), /retry/);
  h.updater.checkForUpdates = async () => { h.updater.emit('update-downloaded'); };
  await h.retry();
  assert.match(h.messages.at(-1), /Installs when you close/);
  assert.equal(h.updater.autoInstallOnAppQuit, true);
  assert.equal(h.updater.autoRunAppAfterInstall, false);
});

test('portable, development, and Mac builds never query the update feed', () => {
  for (const options of [{ env: { PORTABLE_EXECUTABLE_FILE: 'portable.exe' } }, { app: { isPackaged: false } }, { platform: 'darwin' }]) {
    assert.equal(setup(options).calls(), 0);
  }
});

test('periodic checks do not overlap an active download', async () => {
  let finish;
  let calls = 0;
  const updater = new EventEmitter();
  updater.checkForUpdates = async () => {
    calls++;
    return { downloadPromise: new Promise(resolve => { finish = resolve; }) };
  };
  const h = setup({ updater });
  await h.retry();
  assert.equal(calls, 1);
  finish();
  await new Promise(resolve => setImmediate(resolve));
  const retry = h.retry();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 2);
  finish();
  await retry;
});
