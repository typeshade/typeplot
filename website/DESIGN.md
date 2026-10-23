# TypePlot website design

Carry over TypeNN's website design rules and stack. Preserve the TypeShade family visual
language: Ant Design blue (#1677ff), neutral grounds, flat panels, hairline borders, 6px
controls and 8px code frames. Self-host IBM Plex Sans, IBM Plex Sans KR and IBM Plex Mono.
Use Astro Shiki for static examples, Prism for live code, and Ant Design for interactive controls.

The header and footer cap at 1440px; the overview at 1320px; reading articles at 940px;
the playground at 1180px. Shell gutters are 32px, then 24px below 1050px, 18px below 820px,
and 14px below 560px. Sidebar navigation becomes a horizontal row on mobile.

Lead with real TypePlot code and a working chart. Continue into the data-to-figure workflow,
actual chart examples, guides, and source. Avoid stock images, decorative gradients, invented
measurements, and generic feature-card grids. Use real TypeShade graphics for data and function plots. Never substitute a Canvas 2D or SVG renderer.

Use a shared documentation shell with navigation, highlighted code, related-page links,
canonical and alternate-language metadata. Korean copy uses 합쇼체 and retains API identifiers.
Remember light/dark theme selection. Keep one h1, a visible skip link, landmarks, keyboard
focus, accessible control names, reduced-motion support, and readable contrast. Limit horizontal
scrolling to code, wide tables, and actual multi-column figures. Provide plot descriptions or
data tables. Never replace the library with a mock renderer.

Reference rules: typeshade/typenn website/PRODUCT.md and website/DESIGN.md at
61259c3733148a8665466163ae1c5c2b920b129c. Copied fonts and shared styles retain their licenses.
