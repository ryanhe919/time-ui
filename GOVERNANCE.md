# TimeUI Governance

TimeUI is an open-source project stewarded by a small core team. This document describes who decides what, how decisions are made, and how the project evolves.

## Roles

### Contributors

Anyone who opens an issue, PR, or RFC. Bound only by the [Code of Conduct](./CODE_OF_CONDUCT.md).

### Maintainers

Have write access to a specific area. Review PRs, triage issues, mentor contributors. Listed in `.github/CODEOWNERS` under the appropriate team.

Current teams:

| Team                    | Scope                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| `@timeui/architects`    | Monorepo shape, build, release pipeline, cross-cutting decisions |
| `@timeui/dx`            | Tooling, scaffolders, editor configs, CI, governance templates   |
| `@timeui/design-system` | Tokens, themes, icons                                            |
| `@timeui/components`    | React components, core providers, utils                          |
| `@timeui/docs`          | Storybook site, MDX documentation, examples                      |
| `@timeui/qa`            | Test infra, Playwright, a11y audits, visual regression           |

### Core team

Quorum of 3+ members drawn from the teams above. Holds final decision authority on releases, RFC acceptance, and governance changes. Membership is proposed by an existing core member and accepted by simple majority.

## Decision process

Most changes follow lazy consensus:

1. Open a PR.
2. At least one code owner approves.
3. CI is green, changeset is attached (if user-visible).
4. Merge.

Disagreements escalate to an RFC.

## RFC lifecycle

Use the RFC issue template for:

- New public APIs that span multiple components
- Breaking changes
- New packages
- Governance or process changes

### Stages

| Stage          | Entry condition                                                | Exit condition                                      |
| -------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| **Draft**      | RFC issue opened with the template                             | Author marks ready for review                       |
| **Review**     | At least 2 core-team members commenting                        | 10 calendar days minimum; major objections resolved |
| **Final call** | Core team announces "final call" comment                       | 7 calendar days of no blocking objections           |
| **Accepted**   | Core team vote (majority of respondents, min. 3 participating) | Implementation PR merged                            |
| **Rejected**   | Core team vote                                                 | Issue closed with a rationale comment               |
| **Superseded** | Later RFC replaces it                                          | Issue closed and linked                             |

Accepted RFCs are archived by linking them from the implementation PR's changeset entry. The RFC issue is locked, not deleted.

## Deprecation policy

TimeUI follows semver per package.

1. **Announce.** Mark the API with JSDoc `@deprecated` in a minor release, log a single dev-only `console.warn` on first use, and document the replacement.
2. **Runway.** Keep the deprecated API working for at least **two minor versions** or **90 days**, whichever is longer.
3. **Remove.** Ship the removal in the next major. Document the migration in the release notes and, when feasible, provide a codemod under `tools/codemods/`.

Security-driven removals may move faster; see `SECURITY.md`.

## Release cadence

- **Patch:** as needed, often weekly.
- **Minor:** roughly monthly, bundling new features from Changesets.
- **Major:** at most twice a year, preceded by a beta on the `next` dist-tag.

Canary / snapshot releases can ship at any time via `pnpm changeset:snapshot`.

## Changing this document

Governance changes require an RFC and explicit core-team majority approval.
