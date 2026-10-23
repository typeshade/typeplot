# TypePlot maintenance

Answer the owner in Korean. Keep code, comments and repository documentation in English.
Use named TypeShade callbacks and real shader imports. Browser exports must not import the
compiler or TypeScript. Build output and declarations are committed so Git installs work
without compiling the dependency. Keep the shader sources and Apache notices in the package.

Use a branch and a draft pull request for every task. Push each commit. Do not push main
directly or force push. Merge only with the owner's instruction and green checks on the
current head. Keep at most three sub-agents active; stop their processes before reporting.

Run npm run build to regenerate dist and declarations. Run npm run examples to regenerate
the two example manifests. Do not add or run tests unless the owner requests verification.
The browser and compile-time entry points must remain separate. CI checks their build output.
