# Releases

Releases follow two standards:

- [Calver](/guide/releases#versioning-system) versioning for version control
- [Angular commit convention](/guide/source-code#commit-convention) for changelog generation

## Prepare and release

Run following command with clean git working directory to prepare and push release. See [`scripts/release.ts`](https://github.com/intake24/intake24/blob/master/scripts/release.ts) for implementation details.

```sh
pnpm release
```

Release command run following actions:

- asks for target release type confirmation
- updates all `package.json` files with target version
- generates changelog from git commits to CLI
- asks for confirmation (Y/n) to commit/push changes to github
- commits changes to `package.json` files
- creates a `tag` with target version
- pushes both `main` and `tag` to github

## Github release

Once release has been pushed to github, [github release](https://github.com/intake24/intake24/releases) needs to be created. Copy & paste generated changelog to github release description.
