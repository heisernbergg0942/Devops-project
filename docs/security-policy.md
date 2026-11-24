# CI vulnerability and dependency policy

## Required Trivy gate

`trivy.yaml` is the source of truth for the image vulnerability gate. CI scans
the exact locally built/tested Docker image through Docker, not an older GHCR tag.
Both operating-system packages and supported application packages are analyzed.

| Condition | Result |
| --- | --- |
| Any HIGH or CRITICAL vulnerability, fixed or unfixed | Fail CI; do not export or publish |
| LOW, MEDIUM, or UNKNOWN severity | Does not block this gate |
| Scanner installation, DB download, scan, or timeout failure | Fail closed; do not publish |
| No blocking findings and all other checks pass | Eligible for publication only on main or a validated release tag |

Trivy `v0.76.2` is installed by SHA-pinned `aquasecurity/setup-trivy`. It uses a
fresh vulnerability database. `--image-src docker` prevents silently substituting
a similarly named remote image. Bash `pipefail` preserves Trivy's failing status
when output is piped through `tee`. The report and stderr are retained as
`reports/trivy.txt` in the diagnostic artifact, including on failed scans.

This intentionally strict policy can block an otherwise correct application when
its base image has an unfixed HIGH/CRITICAL issue. Do not silently weaken the gate
to make a release pass. A clean result is a database-time snapshot, not a security
guarantee; rescan and update base images regularly. This gate is vulnerability
scanning, not secret detection, SAST, or an infrastructure audit.

## Remediation and exceptions

1. Read the report, identify the affected package/CVE, and check the fixed version.
2. Update the Node.js 24 base image and/or the affected locked npm dependency in
   a reviewed change, without changing the project's runtime stack.
3. Re-run the full pipeline; never replace the image after scanning it.
4. If no fix exists, hold publication or request an explicitly approved policy
   change. An exception must record the CVE, affected versions, rationale, owner,
   mitigations, expiry, and review approval. It must be narrowly implemented and
   retested; no exceptions are enabled by default.

Do not add a blanket `.trivyignore`, disable scanner errors, mark the scan
`continue-on-error`, or change `ignore-unfixed` without review. Ignore files are
not currently wired into an exception process; future exceptions need an explicit
implementation rather than assuming a document alone changes the gate.

## Action and tool pin maintenance

All `uses:` references in `.github/workflows/ci.yml` are full 40-character commit
SHAs. On 2026-11-24 these were resolved directly from the upstream GitHub tag refs:

| Action | Verified upstream ref |
| --- | --- |
| `actions/checkout` | `v4` |
| `actions/setup-node` | `v4` |
| `actions/upload-artifact` | `v4` |
| `actions/download-artifact` | `v4` |
| `docker/login-action` | `v3` |
| `aquasecurity/setup-trivy` | `v0.3.1` |

The pinned Trivy installer also uses SHA-pinned nested actions and checks release
checksums. Pinning limits unexpected tag movement but is not an independent audit
of upstream code. Review release notes, upstream ownership, and resolved commit
changes when updating pins; do not substitute a guessed SHA. Trivy's version tag
was verified against its upstream release API. npm development tools are exact
versions with lockfile integrity hashes; install with `npm ci`.

The Node.js `24-alpine` base remains intentionally tag-based and is refreshed by
`docker build --pull`. This gets patch fixes but means builds across runs are not
bit-for-bit reproducible. Publishing transfers and verifies the exact validated
image within a run. Use GHCR image digests for immutable deployment references.
