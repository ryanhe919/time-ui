# Releasing TimeUI

TimeUI uses [Changesets](https://github.com/changesets/changesets) for versioning and npm publishing, automated via `.github/workflows/release.yml`.

## TL;DR

1. Make changes on a branch.
2. Run `pnpm changeset` and describe the change (patch/minor/major per package).
3. Commit the generated `.changeset/*.md` alongside your PR.
4. When your PR lands on `main`, the Changesets bot opens a "Version Packages" PR.
5. Merging that PR bumps versions, updates `CHANGELOG.md` files, and publishes to npm.

No manual `npm publish`. If you find yourself running it, stop.

## Writing a good changeset

```
pnpm changeset
```

Select only the packages you actually touched. Use `patch` for bug fixes, `minor` for additive features, `major` for breaking changes. Write the summary as a user-facing changelog entry:

> `Button`: add `loading` prop that swaps children for a spinner while preserving width.

Chore, docs, test, and internal refactor PRs typically do **not** need a changeset.

## Release flow (normal)

```
PR lands on main
   ↓
changesets/action opens "Version Packages" PR
   ↓
Maintainer reviews version bumps + CHANGELOG diff
   ↓
Merge → release job builds packages → `changeset publish` to npm
   ↓
GitHub release notes generated per package
```

## Canary / snapshot releases

Use snapshots to ship a tagged preview from any branch (useful for consumers who want to try a change before it merges):

```
pnpm changeset version --snapshot canary
pnpm -r --filter "./packages/*" build
pnpm changeset publish --tag canary
```

Convenience script:

```
pnpm changeset:snapshot
```

Installers can then pull it with `npm i @timeui/react@canary`.

Tags never collide with `latest`. Clean up stale tags with `npm dist-tag rm @timeui/react canary` if needed.

## Hotfix flow

For an urgent fix to an already-published version:

1. Branch from the release tag: `git checkout -b hotfix/0.4.x v0.4.2`.
2. Apply the fix. Add a `patch` changeset.
3. Open a PR targeting a long-lived `release/0.4` branch (create one if missing).
4. Merge → Changesets will bump and publish a patch on that line.
5. Forward-port the fix to `main` via cherry-pick or a follow-up PR.

If the mainline has diverged substantially, publish manually:

```
pnpm changeset version
pnpm -r --filter "./packages/*" build
pnpm changeset publish
```

## Yanking / deprecating a release

We do **not** unpublish (npm disallows it after 72h, and it breaks lockfiles).

Deprecate instead:

```
npm deprecate @timeui/react@0.4.3 "Critical regression — use 0.4.4"
```

For security issues, follow `SECURITY.md` (coordinated disclosure → patch release → GHSA advisory → `npm deprecate` the affected range).

## Troubleshooting

- **"No changesets found"** — nothing to release. Expected if the last PRs were docs/chore.
- **Publish step fails with 403** — confirm `NPM_TOKEN` secret has publish rights for `@timeui` scope.
- **Version PR wasn't opened** — check the release workflow logs; usually a missing `GITHUB_TOKEN` permission or a merge conflict in `CHANGELOG.md`.
- **Need to redo a version bump** — revert the Version Packages PR, add/adjust changesets, re-run.
