const { execSync } = require("child_process");
const fs = require("fs");

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
  const commits = execSync("git log --format=%H -- package.json", {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .reverse(); // Oldest to newest
  return commits;
}

function getPackageJsonVersionAtCommit(commitHash) {
  try {
    const pkgContent = execSync(`git show ${commitHash}:package.json`, {
      encoding: "utf8",
    });
    const pkg = JSON.parse(pkgContent);
    return pkg.version;
  } catch (err) {
    return null;
  }
}

function getCommitsBetween(fromCommit, toCommit) {
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
}

function getCommitDate(commit) {
  return execSync(`git show -s --format=%ci ${commit}`, {
    encoding: "utf8",
  }).trim();
}

function generateChangelog() {
  const versionCommits = [];
  const commits = getCommitsTouchingPackageJson();

  let lastVersion = null;

  for (const commit of commits) {
    const version = getPackageJsonVersionAtCommit(commit);
    if (version !== lastVersion) {
      versionCommits.push({ version, commit });
      lastVersion = version;
    }
  }

  const changelogEntries = [];

  for (let i = 1; i < versionCommits.length; i++) {
    const { version, commit } = versionCommits[i];
    const prevCommit = versionCommits[i - 1].commit;

    const date = getCommitDate(commit);
    const messages = getCommitsBetween(prevCommit, commit);

    if (messages) {
      changelogEntries.push(`## ${version} - ${date}\n${messages}`);
    }
  }

  // Optional: include first version
  if (versionCommits.length > 0) {
    const { version, commit } = versionCommits[0];
    const date = getCommitDate(commit);
    const messages = getCommitsBetween("", commit);

    if (messages) {
      changelogEntries.unshift(`## ${version} - ${date}\n${messages}`);
    }
  }

  fs.writeFileSync(
    "public/CHANGELOG.md",
    changelogEntries.reverse().join("\n\n") + "\n"
  );
  console.log("✅ CHANGELOG.md generated.");
}

generateChangelog();
