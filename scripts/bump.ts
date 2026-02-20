import chalk from "chalk";
import { spawnSync, type SpawnSyncOptions } from "node:child_process";
import { argv, exit } from "node:process";

/**
 * Displays a message to STDERR and exits with a non-zero exit code.
 * @param message The message to display.
 */
function error(message: string) {
  console.error(chalk.red(message));
  exit(1);
}

/**
 * Spawns a new process using the given `command`, with command-line arguments
 * in `args`.
 * @param command The command to run.
 * @param args List of string arguments.
 * @param options Spawn options.
 * @returns The exit code of the subprocess, or `null` if the subprocess
 * terminated due to a signal.
 */
function run(command: string, args: string[], options: SpawnSyncOptions = {}) {
  const { status } = spawnSync(command, args, {
    ...options,
    shell: true,
    stdio: "inherit",
  });
  return status;
}

// Require a newversion argument, which must be either a valid semver string, a
// valid second argument to semver.inc (i.e. one of `patch`, `minor`, `major`,
// `prepatch`, `preminor`, `premajor`, `prerelease`), or `from-git`.
const newversion = argv[2];
if (newversion == null) {
  error("A newversion argument must be provided");
}

// Stage any changes to CHANGELOG.md.
const gitAddExitCode = run("git", ["add", "--", "./CHANGELOG.md"]);
if (gitAddExitCode !== 0) {
  error("Failed to stage CHANGELOG.md");
}

// Determine whether CHANGELOG.md has been changed and staged.
const gitDiffExitCode = run("git", [
  "diff",
  "--quiet",
  "--staged",
  "--",
  "./CHANGELOG.md",
]);

// If CHANGELOG.md has not been changed, exit with an error.
if (gitDiffExitCode === 0) {
  error("CHANGELOG.md must be updated before bumping the version");
}

// Stash the change to CHANGELOG.md to prevent npm version from failing. Since
// we are only stashing CHANGELOG.md, npm version will still fail if other
// uncommitted changes exist.
const gitStashExitCode = run("git", ["stash", "--", "./CHANGELOG.md"]);
if (gitStashExitCode !== 0) {
  error("Failed to stash CHANGELOG.md");
}

const npmVersionExitCode = run("npm", ["version", newversion]);
if (npmVersionExitCode !== 0) {
  const gitStashApplyExitCode = run("git", ["stash", "apply"]);
  if (gitStashApplyExitCode !== 0) {
    exit(gitStashApplyExitCode);
  }
}

exit(npmVersionExitCode);
