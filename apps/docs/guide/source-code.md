# Source code

Project is using `git` versioning system is hosted on [github](https://github.com/intake24/intake24).

Clone the repository

```sh
git clone https://github.com/intake24/intake24
```

## Repository structure

Repository is set as `mono-repository` with [workspaces](https://pnpm.io/workspaces) using [pnpm](https://pnpm.io).

Deployable applications are in `apps` folder. Shared components are in `packages` folder.

```
.
├─ .github -> Github actions / workflows
├─ apps -> Applications
│  ├─ api -> API Server
│  ├─ admin -> Admin tool
│  ├─ docs -> Documentation
│  ├─ cli -> Command line interface
│  └─ survey -> Survey application
├─ deployment - Ansible playbooks / scripts for deployment
├─ docker - Docker files for development
└─ packages
   ├─ api-client-v3 -> API Client (Intake24 V3)
   ├─ api-client-v4 -> API Client (Intake24 V4 - current)
   ├─ common -> repository-wide shared code
   ├─ common-backend -> backend shared code, e.g. services
   ├─ db -> database layer (models, migrations, etc.)
   ├─ i18n -> translation files for all applications
   └─ ui -> frontend shared code (admin / survey)
```

## Dependencies

Project is using [pnpm](https://pnpm.io) as a package manager.

Install `pnpm` using corepack or see [pnpm docs](https://pnpm.io) for further installation options.

```sh
corepack enable

corepack install
```

Install project dependencies from repository root.

```sh
pnpm install
```

## Commit convention

Commit messages are restricted to follow `conventional-changelog` convention, adapted from [Angular's commit convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular).

- [`.github/commit-convention.md`](https://github.com/intake24/intake24/blob/master/.github/commit-convention.md) for more details.

- [`scripts/verify-commit.ts`](https://github.com/intake24/intake24/blob/master/scripts/verify-commit.ts) for implementation.

## Versioning system

Intake24 uses a hybrid versioning system based on [Calendar Versioning (CalVer)](https://calver.org)
and [Semantic Versioning (semver)](https://semver.org).

Version numbers generally follow the Semantic Versioning principles with the following exceptions:

- Major version is the year of the release in YYYY format
- Minor version starts at 1 instead of 0

### Format

Version numbers follow the format

<span style="font-size: larger;">**YYYY.MINOR.PATCH**</span>

where

**YYYY** is the year of the release using the four-digit format,

**MINOR** is the sequential number of a feature release in the corresponding year. "Feature release" means a major release adding
new features or functionality or significant changes to existing features.

**PATCH** is the sequential number of a bug fix release. "Bug fix release" means a release focused on fixing
issues with existing features without adding new functionality.

#### Year increments

Bug fix releases are always associated with a specific feature release (i.e., **YYYY.MINOR**) and the year
should never be incremented when releasing bug fix versions, even if a bug fix release occurs in a
later year.

### Examples

**2022.1.0** — first feature release of 2022,

**2022.2.3** — third bug fix for the second feature release of 2022,

**2022.4.1** — a bug fix release for the final, fourth feature release of 2022 that could be released in 2023.

### Pre-release versions

Pre-release versions follow the [Semantic Versioning system](https://semver.org/#spec-item-9):

A pre-release version MAY be denoted by appending a hyphen and a series of dot separated identifiers immediately following the patch version.

### Examples

**2022.1.0-beta** — initial beta release of the first feature release in 2022,

**2022.1.0-beta.4** — fourth update of the **2022.1.0** beta.

## Code style

Project is set up with [eslint](https://eslint.org/) configured with [antfu](https://github.com/antfu/eslint-config) preset to help to keep clean and maintainable code.

ESLint integrates very well with most of the IDEs. Install respective plugins / extensions and configure it to run on `save` to have immediate effect.

You can also run lint process manually from repository root.

```sh
pnpm lint
```

Lint step also runs for each staged file, when changes are being committed (using git hooks).

## Renovate

Repository is set up with [renovate bot](https://github.com/renovatebot/renovate), which checks repository for up-to-date dependencies and prepares PRs to be merged. Renovate job runs on weekly basis and can be configured through [`.github/renovate.json5`](https://github.com/intake24/intake24/blob/master/.github/renovate.json5) config file.

## Continuous integration

### Build

[Main CI](https://github.com/intake24/intake24/blob/master/.github/workflows/ci.yml) action is triggered on any source code change and it runs lint / build / tests / steps for each of the components.

### Documentation

[Docs CI](https://github.com/intake24/intake24/blob/master/.github/workflows/docs.yml) action is triggered on `docs` folder source code change and documentation site is automatically rebuilt and deployed to GitHub pages.
