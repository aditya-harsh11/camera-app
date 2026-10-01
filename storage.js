const fs = require("node:fs/promises");
const path = require("node:path");

const RESEARCH_DRIVE_PREFIX = "\\\\research.drive.wisc.edu\\";

function validateFilename(filename) {
  if (!/^[A-Za-z0-9_-]+$/.test(filename)) {
    throw new Error("File name can only contain letters, numbers, - and _");
  }
}

function validateResearchDriveFolder(folder) {
  if (typeof folder !== "string" || !folder.trim()) {
    throw new Error("Enter a save folder first.");
  }

  const segments = folder.trim().split(/[\\/]+/);
  if (segments.includes("..")) throw new Error("Save folder can't contain '..'");

  const normalized = path.win32.normalize(folder.trim());
  if (!normalized.toLowerCase().startsWith(RESEARCH_DRIVE_PREFIX.toLowerCase())) {
    throw new Error("Save folder must start with \\\\research.drive.wisc.edu\\<lab>");
  }
  return normalized;
}

async function nextAvailablePath(folder, filename) {
  let candidate = path.join(folder, `${filename}.mp4`);
  let suffix = 2;
  while (true) {
    try {
      await fs.access(candidate);
      candidate = path.join(folder, `${filename}_${suffix}.mp4`);
      suffix += 1;
    } catch (error) {
      if (error.code === "ENOENT") return candidate;
      throw error;
    }
  }
}

async function saveRecording(folder, filename, bytes, options = {}) {
  validateFilename(filename);
  const destination = options.requireResearchDrive === false
    ? path.resolve(folder)
    : validateResearchDriveFolder(folder);

  await fs.mkdir(destination, { recursive: true });
  const outputPath = await nextAvailablePath(destination, filename);
  await fs.writeFile(outputPath, bytes, { flag: "wx" });
  return outputPath;
}

module.exports = {
  nextAvailablePath,
  saveRecording,
  validateFilename,
  validateResearchDriveFolder,
};
