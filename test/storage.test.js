const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  saveRecording,
  validateFilename,
  validateResearchDriveFolder,
} = require("../storage");

test("accepts a ResearchDrive UNC folder", () => {
  assert.equal(
    validateResearchDriveFolder("\\\\research.drive.wisc.edu\\niedenthal\\UW_Fall2026"),
    "\\\\research.drive.wisc.edu\\niedenthal\\UW_Fall2026",
  );
});

test("rejects traversal and non-ResearchDrive folders", () => {
  assert.throws(
    () => validateResearchDriveFolder("\\\\research.drive.wisc.edu\\niedenthal\\..\\other"),
    /can't contain/,
  );
  assert.throws(() => validateResearchDriveFolder("C:\\recordings"), /must start/);
  assert.throws(() => validateResearchDriveFolder("\\\\other-server\\share"), /must start/);
});

test("accepts only safe recording names", () => {
  assert.doesNotThrow(() => validateFilename("dyad-111_09282026-034200"));
  assert.throws(() => validateFilename("../recording"), /only contain/);
  assert.throws(() => validateFilename("recording.mp4"), /only contain/);
});

test("fallback saves never overwrite an existing recording", async (t) => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "camera-recorder-"));
  t.after(() => fs.rm(folder, { recursive: true, force: true }));

  const first = await saveRecording(folder, "dyad-111", Buffer.from("first"), {
    requireResearchDrive: false,
  });
  const second = await saveRecording(folder, "dyad-111", Buffer.from("second"), {
    requireResearchDrive: false,
  });

  assert.equal(path.basename(first), "dyad-111.mp4");
  assert.equal(path.basename(second), "dyad-111_2.mp4");
  assert.equal(await fs.readFile(first, "utf8"), "first");
  assert.equal(await fs.readFile(second, "utf8"), "second");
});
