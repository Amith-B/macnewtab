const { execSync } = require("child_process");
const fs = require("fs");

const MAX_COMMIT_HISTORY = 20;
const IGNORED_KEYWORDS = [
  "package version",
  "readme",
  "merge pull request",
  "merge branch",
  "chore:",
  "version bump",
  "doc:",
];

function getCommitsTouchingPackageJson() {
  try {
    const commits = execSync("git log --format=%H -- package.json", {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .reverse(); // Oldest to newest
    return commits;
  } catch (err) {
    console.error("Error getting package.json commit history:", err.message);
    return [];
  }
}

function getPackageJsonVersionAtCommit(commitHash) {
  try {
    const pkgContent = execSync(`git show ${commitHash}:package.json`, {
      encoding: "utf8",
    });
    const pkg = JSON.parse(pkgContent);
    return pkg.version;
  } catch (err) {
    console.error(`Error getting package.json at ${commitHash}:`, err.message);
    return null;
  }
}

function getCommitsBetween(fromCommit, toCommit) {
  try {
    const range = fromCommit ? `${fromCommit}..${toCommit}` : toCommit;
    const logs = execSync(`git log ${range} --pretty=format:%s`, {
      encoding: "utf8",
    })
      .trim()
      .split("\n");

    const filtered = logs.filter((msg) => {
      const lower = msg.toLowerCase();
      return !IGNORED_KEYWORDS.some((keyword) => lower.includes(keyword));
    });

    return filtered.map((msg) => `- ${msg}`).join("\n");
  } catch (err) {
    console.error(`Error getting commits between ${fromCommit} and ${toCommit}:`, err.message);
    return "";
  }
}

function getCommitDate(commit) {
  try {
    return execSync(`git show -s --format=%cd --date=short ${commit}`, {
      encoding: "utf8",
    }).trim();
  } catch (err) {
    console.error(`Error getting date for commit ${commit}:`, err.message);
    return "unknown date";
  }
}

function generateChangelog() {
  // First ensure we have the full git history
  try {
    execSync("git fetch --unshallow || true", { stdio: "ignore" });
  } catch (err) {
    // Ignore errors - we might already have full history
  }

  const versionCommits = [];
  const commits = getCommitsTouchingPackageJson();

  let lastVersion = null;

  // Process commits to find version changes
  for (const commit of commits) {
    const version = getPackageJsonVersionAtCommit(commit);
    if (version && version !== lastVersion) {
      versionCommits.push({ version, commit });
      lastVersion = version;
    }
  }

  // If we're running in a CI environment with limited history,
  // try to get at least the current version info
  if (versionCommits.length === 0) {
    try {
      const currentVersion = require("./package.json").version;
      const currentCommit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
      versionCommits.push({ version: currentVersion, commit: currentCommit });
    } catch (err) {
      console.error("Couldn't determine current version:", err.message);
    }
  }

  const changelogEntries = [];

  // Generate entries for version changes
  for (let i = 1; i < versionCommits.length; i++) {
    const { version, commit } = versionCommits[i];
    const prevCommit = versionCommits[i - 1].commit;

    const date = getCommitDate(commit);
    const messages = getCommitsBetween(prevCommit, commit);

    if (messages) {
      changelogEntries.push(`## ${version} - ${date}\n${messages}`);
    }
  }

  // Include first version if available
  if (versionCommits.length > 0) {
    const { version, commit } = versionCommits[0];
    const date = getCommitDate(commit);
    const messages = getCommitsBetween("", commit);

    if (messages) {
      changelogEntries.unshift(`## ${version} - ${date}\n${messages}`);
    }
  }

  // Limit history and write to file
  const finalContent = changelogEntries
    .reverse()
    .slice(0, MAX_COMMIT_HISTORY)
    .join("\n\n") + "\n";

  fs.writeFileSync("public/CHANGELOG.md", finalContent);
  console.log(`✅ CHANGELOG.md generated for last ${MAX_COMMIT_HISTORY} versions`);
}

generateChangelog();