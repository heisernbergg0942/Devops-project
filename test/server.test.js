const assert = require("node:assert/strict");
const { before, after, test } = require("node:test");
const server = require("../src/server");
const { version } = require("../package.json");
const { smokeTest } = require("../scripts/ci/smoke-test");

let baseUrl;

before(async () => {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("GET / returns the application information", async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.deepEqual(await response.json(), {
    application: "DevOps Practicum",
    version,
    message: "Deployment successful"
  });
});

test("GET /health returns a healthy status", async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.deepEqual(await response.json(), { status: "healthy" });
});

test("unknown routes return a JSON 404", async () => {
  const response = await fetch(`${baseUrl}/not-found`);

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.deepEqual(await response.json(), { error: "Not found" });
});

test("the reusable container smoke check validates all routes", async () => {
  await smokeTest(baseUrl, 1);
});
