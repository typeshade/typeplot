# Publishing

TypePlot is distributed as the public npm package `typeplot`. The first registry release
is pending. A registry lookup returning 404 does not reserve the package name.

## Release procedure

1. Merge the reviewed library pull request after its current build checks pass.
2. Check out the approved main commit and run `npm ci`.
3. Run `npm run check`, `npm run build` and `npm run examples`. Generated artifacts must
   match the committed files: `git diff --exit-code -- dist examples/generated`.
4. Inspect the package with `npm pack --dry-run`. The archive must include browser and
   compiler exports, declarations, shaders, README, LICENSE and NOTICE.
5. Authenticate the publishing account with `npm login`. Confirm the account with
   `npm whoami`; never commit credentials or print authentication tokens.
6. Publish the approved version with `npm publish --access public`. Complete npm's
   authentication prompt if required. Publication requires the repository owner's approval.
7. Confirm the published version with `npm view typeplot version`, then install
   `typeplot@0.1.0` in a separate consumer project and check its public exports.

Published versions are immutable. Increment the version for later releases. Update site
consumers from their temporary Git commit dependency to the published package after the
registry installation is verified.

For later automated releases, configure npm trusted publishing for this repository before
adding a release workflow. Do not place long-lived npm tokens in source files.
