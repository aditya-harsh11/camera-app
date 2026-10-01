const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  saveRecording,
  validateFilename,
  validateSaveFolder,
} = require("../storage");

test("accepts any existing folder", async () => {
  assert.equal(await validateSaveFolder(os.tmpdir()), path.resolve(os.tmpdir()));
});

test("rejects missing or empty folders", async () => {
  await assert.rejects(validateSaveFolder(path.join(os.tmpdir(), "no-such-folder-xyz")), /not found/);
  await assert.rejects(validateSaveFolder("  "), /Choose a save folder/);
});

test("accepts only safe recording names", () => {
  assert.doesNotThrow(() => validateFilename("dyad-111_09282026-034200"));
  assert.throws(() => validateFilename("../recording"), /only contain/);
  assert.throws(() => validateFilename("recording.mp4"), /only contain/);
});

test("saves never overwrite an existing recording", async (t) => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "camera-recorder-"));
  t.after(() => fs.rm(folder, { recursive: true, force: true }));

  const first = await saveRecording(folder, "dyad-111", Buffer.from("first"));
  const second = await saveRecording(folder, "dyad-111", Buffer.from("second"));

  assert.equal(path.basename(first), "dyad-111.mp4");
  assert.equal(path.basename(second), "dyad-111_2.mp4");
  assert.equal(await fs.readFile(first, "utf8"), "first");
  assert.equal(await fs.readFile(second, "utf8"), "second");
});
