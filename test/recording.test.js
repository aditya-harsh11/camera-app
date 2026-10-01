const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function page() {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', disabled: false, textContent: '', addEventListener() {}, classList: { add() {}, remove() {} } });
    return elements.get(id);
  };
  class Recorder {
    static isTypeSupported() { return true; }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; }
  }
  const saves = [];
  const bridge = { platform: 'win32', async saveRecording(...args) { saves.push(args); return 'saved.mp4'; }, async saveFallback() { throw Error('disk full'); } };
  const context = vm.createContext({ document: { getElementById: element }, window: { cameraApp: bridge }, navigator: { userAgent: 'Windows', mediaDevices: { async getUserMedia() { return {}; } } }, localStorage: { getItem() {} }, MediaRecorder: Recorder, Blob, Date, setInterval() {}, clearInterval() {} });
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
  element('pid').value = '111';
  element('minutes').value = '1';
  return { element, bridge, saves, run: source => vm.runInContext(source, context) };
}

test('recording preserves initial identity and destination, and locks Stop immediately', async () => {
  const p = page();
  await Promise.resolve();
  p.run('start()');
  p.element('pid').value = 'changed';
  p.run('folder = "changed"; stop()');
  assert.equal(p.element('btn').disabled, true);
  await p.run('upload()');
  assert.match(p.saves[0][1], /^dyad-111_/);
  assert.notEqual(p.saves[0][0], 'changed');
  assert.equal(p.element('choose').disabled, false);
});

test('invalid dyad and infinite duration are rejected before recording', () => {
  const p = page();
  p.element('pid').value = '../bad';
  p.run('start()');
  assert.match(p.element('status').textContent, /Dyad ID/);
  p.element('pid').value = '111';
  p.element('minutes').value = 'Infinity';
  p.run('start()');
  assert.match(p.element('status').textContent, /minutes/);
});

test('failed primary and backup saves retain data and offer retry', async () => {
  const p = page();
  p.run('start(); chunks.push(new Blob(["media"])); stop()');
  p.bridge.saveRecording = async () => { throw Error('offline'); };
  await p.run('upload()');
  assert.equal(p.element('btn').textContent, 'Retry saving');
  assert.equal(p.run('chunks.length'), 1);
  p.bridge.saveRecording = async () => 'saved.mp4';
  await p.element('btn').onclick();
  assert.equal(p.run('chunks.length'), 0);
  assert.equal(p.element('btn').textContent, 'Start recording');
});
