const assert = require("node:assert/strict");
const { test } = require("node:test");
const { releasePolicy } = require("../scripts/ci/release-policy");
const { shouldPromoteLatest } = require("../scripts/ci/check-latest");

const release = {
  eventName: "push", ref: "refs/tags/v1.0.0", packageVersion: "1.0.0", onMain: true
};

test("main pushes may publish without a version tag", () => {
  assert.deepEqual(releasePolicy({ ...release, ref: "refs/heads/main" }), { publish: true, version: "" });
});

test("pull requests and non-main branches cannot publish", () => {
  for (const eventName of ["pull_request", "workflow_dispatch"]) {
    assert.equal(releasePolicy({ ...release, eventName, ref: "refs/heads/main" }).publish, false);
  }
  for (const ref of ["refs/heads/develop", "refs/heads/feature/test", "refs/heads/release/1.0.0", "refs/heads/hotfix/test"]) {
    assert.equal(releasePolicy({ ...release, ref }).publish, false);
  }
});

test("a matching stable version tag on main history may publish", () => {
  assert.deepEqual(releasePolicy(release), { publish: true, version: "v1.0.0" });
});

test("release commits outside main history are rejected", () => {
  assert.throws(() => releasePolicy({ ...release, onMain: false }), /reachable/);
});

test("a release tag must match the package version", () => {
  assert.throws(() => releasePolicy({ ...release, packageVersion: "1.0.1" }), /match/);
});

test("malformed, leading-zero, and prerelease tags are rejected", () => {
  for (const tag of ["v01.0.0", "v1.0", "v1.0.0-rc.1", "v1.0.0+build", "v1.0.0;echo unsafe"]) {
    assert.throws(() => releasePolicy({ ...release, ref: `refs/tags/${tag}` }), /stable SemVer/);
  }
});

test("only the current main commit may promote latest", () => {
  const current = { eventName: "push", ref: "refs/heads/main", sha: "a".repeat(40), mainSha: "a".repeat(40) };
  assert.equal(shouldPromoteLatest(current), true);
  assert.equal(shouldPromoteLatest({ ...current, sha: "b".repeat(40) }), false);
  assert.equal(shouldPromoteLatest({ ...current, ref: "refs/tags/v1.0.0" }), false);
  assert.equal(shouldPromoteLatest({ ...current, eventName: "pull_request" }), false);
  assert.equal(shouldPromoteLatest({ ...current, sha: undefined, mainSha: undefined }), false);
  assert.equal(shouldPromoteLatest({ ...current, sha: "", mainSha: "" }), false);
});
