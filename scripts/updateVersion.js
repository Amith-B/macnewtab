const fs = require("fs");
const path = require("path");

const packageJsonPath = path.join(__dirname, "..", "package.json");
const manifestJsonPath = path.join(__dirname, "..", "public", "manifest.json");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, "utf8"));

manifestJson.version = packageJson.version;

fs.writeFileSync(
  manifestJsonPath,
  JSON.stringify(manifestJson, null, 2),
  "utf8"
);

console.log(`Updated manifest.json version to ${packageJson.version}`);
