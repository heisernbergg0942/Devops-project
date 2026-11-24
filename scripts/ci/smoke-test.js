const assert = require("node:assert/strict");
const { setTimeout: delay } = require("node:timers/promises");
const { version } = require("../../package.json");

async function verifyResponse(baseUrl, path, status, expected) {
  const response = await fetch(new URL(path, baseUrl), {
    signal: AbortSignal.timeout(3000)
  });
  assert.equal(response.status, status, `${path}: unexpected HTTP status`);
  assert.equal(response.headers.get("content-type"), "application/json", `${path}: unexpected content type`);
  assert.deepEqual(await response.json(), expected, `${path}: unexpected JSON body`);
}

async function smokeTest(baseUrl, attempts = 15) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await verifyResponse(baseUrl, "/health", 200, { status: "healthy" });
      break;
    } catch (error) {
      if (attempt === attempts) throw error;
      console.log(`Health not ready (${attempt}/${attempts}); retrying`);
      await delay(1000);
    }
  }

  await verifyResponse(baseUrl, "/", 200, {
    application: "DevOps Practicum",
    version,
    message: "Deployment successful"
  });
  await verifyResponse(baseUrl, "/not-found", 404, { error: "Not found" });
}

if (require.main === module) {
  assert.ok(process.env.APP_URL, "Set APP_URL to the running container URL");
  smokeTest(process.env.APP_URL).then(() => {
    console.log("Container health, application response, and 404 checks passed");
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { smokeTest };
