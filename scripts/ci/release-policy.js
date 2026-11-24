const assert = require("node:assert/strict");
const { appendFileSync } = require("node:fs");
const { execFileSync } = require("node:child_process");
const { version } = require("../../package.json");

function releasePolicy({ eventName, ref, packageVersion, onMain = false }) {
  if (eventName !== "push") return { publish: false, version: "" };
  if (ref === "refs/heads/main") return { publish: true, version: "" };
  if (!ref.startsWith("refs/tags/")) return { publish: false, version: "" };

  const tag = ref.slice("refs/tags/".length);
  assert.match(tag, /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "Release tags must be stable SemVer, for example v1.0.0");
  assert.equal(tag, `v${packageVersion}`, "Release tag must match package.json version");
  assert.ok(onMain, "Release commit must be reachable from origin/main");
  return { publish: true, version: tag };
}

function main() {
  const { GITHUB_EVENT_NAME: eventName, GITHUB_REF: ref, GITHUB_SHA: sha } = process.env;
  assert.ok(eventName && ref && sha, "GitHub event context is required");
  assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), sha, "Checkout must match the triggering commit");

  let onMain = false;
  if (eventName === "push" && ref.startsWith("refs/tags/")) {
    try {
      execFileSync("git", ["merge-base", "--is-ancestor", sha, "origin/main"], { stdio: "pipe" });
      onMain = true;
    } catch (error) {
      if (error.status !== 1) throw error;
    }
  }

  const result = releasePolicy({ eventName, ref, packageVersion: version, onMain });
  appendFileSync(process.env.GITHUB_OUTPUT, `publish=${result.publish}\nversion=${result.version}\n`);
  console.log(result.publish ? `Publication eligible: ${ref}` : "Validation only; no publication");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { releasePolicy };
