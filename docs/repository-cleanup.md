# Repository audit and safe synchronization

## Current snapshot — 2026-11-24

The working directory is `/home/tong/bash_lesson`, on `develop`. Earlier cleanup
changes were already present and uncommitted when pipeline hardening began; they
were retained and extended, not reset or discarded. `git fetch origin` updated
remote-tracking refs only. No local branch tips or shared history were changed.

Remote fetch/push URL:

```text
git@github.com:heisernbergg0942/Devops-project.git
```

Remote HEAD points to `main`.

| Branch | Tip at inspection | Finding |
| --- | --- | --- |
| Local `main` | `b2334c6` | Nine commits behind `origin/main` |
| `origin/main` | `bbd4077` | Working GHCR pipeline plus PR #4 source-label fix |
| `develop`, `origin/develop` | `81b2b31` | Five commits behind remote main; zero unique commits ahead |
| `feature/devops-pipeline` | `b6bd7b2` | Merged into both remote main and develop |
| `feature/container-registry` | `23a38c4` | Merged into remote main, not develop |
| `origin/copilot/fix-publish-job-failure` | `fb460d4` | Merged into remote main, not develop |
| `bash-function-dev` | `a0814de` | Unique unmerged calculator work; preserve it |

`git rev-list --left-right --count origin/develop...origin/main` returned `0 5`.
The branches are not synchronized. The successful package-linking fix adds
`org.opencontainers.image.source`; this label is explicitly retained in the
updated Dockerfile. GHCR is working according to the project owner's report;
this local hardening does not perform a registry login or push to verify it.

## Cleanup and naming decisions

- Retained the organized `src/`, `test/`, and `docs/` layout and added only reusable
  CI helpers under `scripts/ci/`.
- Kept the existing registry/repository name and `devops-demo:ci` local image tag
  for compatibility. The npm package is `devops-practicum`; the directory can
  remain `bash_lesson` without affecting the app.
- Fixed the old nonexistent `index.js` package entry during initial cleanup;
  startup and Docker now use `src/server.js`.
- Retained native Node.js tests and extended them with release-policy and smoke
  regression tests. ESLint is development-only; no runtime framework was added.
- Kept `.dockerignore` as a runtime-only allowlist. Tests, helpers, lint config,
  reports, Git metadata, and credential files do not enter the image.
- The initial Trivy gate found six HIGH vulnerabilities in npm's bundled
  `brace-expansion` and `undici` packages. npm and its cache are removed after
  installation because the service starts directly with Node.js; the gate is
  not weakened or bypassed to address install-only tooling findings.
- Extended `.gitignore` for generated reports, cache directories, scanner checkout,
  and image checksum files. No tracked files were found that needed deleting.
- Left `function.sh` on its learning branch. No unrelated learning content was
  copied into the service.
- Preserved the existing ISC package metadata. Confirm intended licensing before
  distribution; no invented license/ownership statement was added.
- Preserved the initial commits and PR merge history; old intermediate commits
  need not be rewritten just because CI was introduced before the application.

## Safe synchronization procedure — recommendations only

1. Review the entire current diff, including untracked cleanup files. Preserve
   this work on a branch such as `feature/ci-hardening`, then commit only the
   reviewed files. Do not switch to another tree or pull while this work is
   uncommitted. No branch or commit was created automatically here.
2. After the working tree is clean, fetch remote refs again and recheck ancestry.
   Local main can be updated with a fast-forward-only operation; do not reset it,
   rebase shared history, or force-push.
3. Open a reviewed `main` → `develop` synchronization PR and use a history-
   preserving merge. At this snapshot main strictly contains develop, so a
   fast-forward is ancestry-safe if permitted by repository policy. Coordinate
   the synchronization with the hardening PR instead of blindly copying files.
4. Integrate the hardening branch into develop through a PR. Where workflow or
   Dockerfile conflicts occur, retain the working GHCR behavior and OCI source
   label while applying the hardened validation, scanning, release guards, and
   exact-image artifact transfer. Run CI on the integrated result.
5. Release the reviewed changes through the normal GitFlow release PR into main,
   and integrate the released history back into develop. Do not merge directly
   into main or create/push release tags as part of this local task.

Example inspection commands (read-only):

```bash
git status --short --branch
git branch -avv
git log --all --graph --decorate --oneline
git rev-list --left-right --count origin/develop...origin/main
git merge-base --is-ancestor origin/develop origin/main
git branch -r --merged origin/develop
git branch -r --merged origin/main
git log origin/develop..origin/bash-function-dev --oneline
```

## Branch retirement — explicit approval required

- `feature/devops-pipeline` is eligible after approval; it is already merged.
- Keep `feature/container-registry` and `copilot/fix-publish-job-failure` until
  their history is also incorporated into develop, then request approval.
- Keep `bash-function-dev` because it contains unique work. Ask whether to retain
  it as a learning branch or rename/archive it through an approved procedure.
- Recheck ancestry immediately before any retirement. No branch deletion commands
  were executed or included as an automatic cleanup step.

## Repository settings to review separately

- Require PR review and CI checks on main/develop; protect release tags.
- Keep this repository's Write access under the existing GHCR package's Manage
  Actions access. Package visibility need not be public.
- Decide whether an automated updater should maintain reviewed action/tool pins.
- Keep AWS, Terraform, Swarm, and deployment credentials outside this change.

No push, merge, commit, branch deletion, history rewrite, or infrastructure
configuration was performed. Validation results and any local scan limitations
are reported separately; GitHub-hosted execution still needs a reviewed PR run.

## Local validation results

- Reproducible `npm ci`, ESLint with zero allowed warnings, and all 15 native
  tests passed, including smoke-check rejection and release/latest policy cases.
- `actionlint` (including ShellCheck), `hadolint`, Docker build checks, and
  `git diff --check` passed.
- The built container became healthy, returned the expected JSON/status codes,
  ran as UID/GID `1000:1000`, preserved the OCI source label, and contained neither
  npm nor development/CI files.
- An actual Docker save/checksum/load round trip preserved the tested image ID.
- The first real Trivy run returned exit 1 for six HIGH findings in install-only
  npm dependencies, confirming that the gate blocks rather than hiding findings.
  The final scan passed with zero HIGH/CRITICAL findings after npm removal.
- Direct helper-execution checks verified current-main promotion, stale-main
  rejection, API-denied/malformed-response failure, tag non-promotion, valid
  release eligibility, and invalid/mismatching release rejection.

Local diagnostic files are ignored under `reports/` (final scan:
`reports/trivy-final.txt`). Scanner cache is ignored under `.cache/`. Temporary
validation containers and tar archives were removed; the local
`devops-demo:ci-hardening-validation` image remains available for inspection.
No GitHub-hosted workflow, GHCR push, or deployment was executed; these local
checks cannot verify repository settings or hosted artifact/registry permissions.
