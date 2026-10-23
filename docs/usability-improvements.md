# TypePlot usability improvements

## Implemented

- Runnable Vite application: `npm run dev` imports real scalar and spatial callbacks through
  `?plot`, with parameters, 2D/3D mode, reset and backend selection.
- Responsive layout, fixed-width slider values, visible keyboard focus, canvas fallback
  text, keyboard instructions, toggle state and renderer failure messages.
- Partial startup failure and Vite hot replacement dispose already-created plot instances.
  Back/forward cache navigation keeps mounted instances available on return.
- Optional `PlotOptions.label`, generic fallback canvas names and a default image role.
  Author-supplied labels and roles are preserved unless the label option is explicit.
  Destroying a plot restores original accessibility attributes.
- Explicit `?plot=2d` and `?plot=scalar` override a configured parametric kind, matching
  the existing precedence of explicit spatial imports.

## Build checks

`npm run build`, `npm run build:example`, `npm run examples` and `git diff --check` pass.
The example build includes strict host TypeScript checking and a normal Vite configuration
load. CI now builds this application alongside the library. Generated sample programs are
unchanged. The browser entry retains its emitted-dependency compiler exclusion guard.
Low-level interaction and shared shader exports are unchanged, preserving site integration.

This change adds no test suite. The new example and accessibility behavior have not received
an additional browser interaction review. The existing v0.1.0 release remains unchanged;
these improvements are under review for a later release.
