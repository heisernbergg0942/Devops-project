const assert = require("node:assert/strict");
const { appendFileSync } = require("node:fs");

function shouldPromoteLatest({ eventName, ref, sha, mainSha }) {
  return eventName === "push" && ref === "refs/heads/main" &&
    typeof sha === "string" && /^[a-f0-9]{40}$/.test(sha) && sha === mainSha;
}

async function main() {
  const { GITHUB_EVENT_NAME: eventName, GITHUB_REF: ref, GITHUB_SHA: sha } = process.env;
  let latest = false;

  if (eventName === "push" && ref === "refs/heads/main") {
    assert.ok(process.env.GH_TOKEN, "A read-capable GitHub token is required");
    const response = await fetch(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/git/ref/heads/main`, {
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      signal: AbortSignal.timeout(10000)
    });
    assert.ok(response.ok, `Cannot verify current main: HTTP ${response.status}`);
    const mainSha = (await response.json()).object?.sha;
    assert.match(mainSha, /^[a-f0-9]{40}$/, "GitHub returned an invalid main commit");
    latest = shouldPromoteLatest({ eventName, ref, sha, mainSha });
  }

  appendFileSync(process.env.GITHUB_OUTPUT, `latest=${latest}\n`);
  console.log(latest ? "Current main: latest promotion allowed" : "Release tag or stale main run: latest will not move");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { shouldPromoteLatest };
