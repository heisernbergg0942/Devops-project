const assert = require("node:assert/strict");
const http = require("node:http");
const { test } = require("node:test");
const { smokeTest } = require("../scripts/ci/smoke-test");
const { version } = require("../package.json");

const responses = {
  "/health": { status: 200, body: { status: "healthy" } },
  "/": { status: 200, body: { application: "DevOps Practicum", version, message: "Deployment successful" } },
  "/not-found": { status: 404, body: { error: "Not found" } }
};

for (const [name, path, replacement] of [
  ["unhealthy HTTP status", "/health", { status: 503, body: { status: "healthy" } }],
  ["incorrect health body", "/health", { status: 200, body: { status: "broken" } }],
  ["incorrect application version", "/", { status: 200, body: { ...responses["/"].body, version: "wrong" } }],
  ["incorrect 404 status", "/not-found", { status: 200, body: { error: "Not found" } }]
]) {
  test(`smoke check rejects ${name}`, async () => {
    const server = http.createServer((req, res) => {
      const response = req.url === path ? replacement : responses[req.url];
      res.writeHead(response.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response.body));
    });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    try {
      await assert.rejects(smokeTest(`http://127.0.0.1:${server.address().port}`, 1));
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  });
}
