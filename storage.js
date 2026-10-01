const fs = require("node:fs/promises");
const path = require("node:path");

function validateFilename(filename) {
  if (!/^[A-Za-z0-9_-]+$/.test(filename)) {
    throw new Error("File name can only contain letters, numbers, - and _");
  }
}

async function validateSaveFolder(folder) {
  if (typeof folder !== "string" || !folder.trim()) {
    throw new Error("Choose a save folder first.");
  }

  const resolved = path.resolve(folder.trim());
  const stats = await fs.stat(resolved).catch(() => null);
  if (!stats?.isDirectory()) {
    throw new Error(`Folder not found: ${resolved}. If it's on ResearchDrive, check it's connected and the VPN is on.`);
  }
  return resolved;
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

async function saveRecording(folder, filename, bytes) {
  validateFilename(filename);
  const destination = await validateSaveFolder(folder);
  const outputPath = await nextAvailablePath(destination, filename);
  await fs.writeFile(outputPath, bytes, { flag: "wx" });
  return outputPath;
}

module.exports = {
  nextAvailablePath,
  saveRecording,
  validateFilename,
  validateSaveFolder,
};
