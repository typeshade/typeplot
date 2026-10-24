# Publishing

TypePlot releases can be installed from versioned Git tags with npm. The intended public
npm package is `typeplot`; the first registry release is pending. A registry lookup returning 404 does not reserve the package name.

## Git releases

Create a GitHub release and a version tag at the reviewed main commit after its build checks
pass. The version must match `package.json`. Include compiled JavaScript, declarations and
shader sources in the committed tree so dependency installation does not need a build step.
Install a release with `npm install https://github.com/typeshade/typeplot.git#v0.2.0`.

## Registry release procedure

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
   `typeplot@0.2.0` in a separate consumer project and check its public exports.

Published versions are immutable. Increment the version for later releases. Update site
consumers from their temporary Git commit dependency to the published package after the
registry installation is verified.

For later automated releases, configure npm trusted publishing for this repository before
adding a release workflow. Do not place long-lived npm tokens in source files.
