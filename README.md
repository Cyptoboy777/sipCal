# Smart Finance Calculator

Free EMI, SIP, compound interest and FD calculators for India. A static site with no runtime dependencies.

## How it works

- `src/calculators.json` defines each calculator's inputs, outputs and labels.
- `js/calc.js` is the pure calculation engine (also runs in Node).
- `js/render.js` turns inputs into HTML. It runs at build time and in the browser, so every page ships
  fully rendered (text, tables, default results) and crawlers see real content without JavaScript.
- `js/app.js` makes the calculator live (sliders, chart tooltip, share link, CSV, print).
- `src/content/*.js` hold the page copy. Worked examples are computed from the engine at build time.
- `tools/build.js` writes the finished site to `public/` plus `sitemap.xml`, `robots.txt` and `ads.txt`.

## Commands

    node tools/build.js          # build into ./public
    python3 tools/verify_calc.py # check the engine against independent closed-form maths

## Before you go live

1. Set your real contact address in `src/site.json` (`email`). The build warns while it is a placeholder.
2. Update `updated` and `updatedISO` in `src/site.json` whenever you review content.
3. Deploy on Vercel. `vercel.json` already sets the build command and output directory.

## Design notes

Fonts (Bricolage Grotesque, Source Serif 4) are self-hosted under SIL OFL. Chart colours were validated for
colour-blind separation and contrast in light and dark mode.
