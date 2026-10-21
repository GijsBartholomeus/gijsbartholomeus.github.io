# Gijs Bartholomeus — Frutiger Aero academic website

A complete, dependency-free academic website designed as a Vista-inspired desktop.
Target address: https://gijsbartholomeus.github.io.

## Preview

From this folder:

```sh
python3 build.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory site
```

Open http://127.0.0.1:8000. Stop with Ctrl+C. You can also open
`site/index.html` directly in a normal browser.

## Included

- Six folders: About me, Research, Teaching, CV, Contact, and Topology lab.
- Start menu, taskbar, live Oxford clock, draggable profile window on desktop,
  minimize/close/restore, maximize, back navigation, and linkable section URLs.
- Daylight and evening themes.
- Responsive mobile layout with standard page scrolling.
- Semantic, pre-rendered content, usable without JavaScript; keyboard controls,
  reduced-motion support, and print styles. The lab requires JavaScript.
- Updated downloadable two-page CV, portrait, two publications and a thesis entry.
- Original Frutiger Aero wallpaper, metadata, sitemap, robots.txt, and favicon.
- No backend, analytics, tracking scripts, remote fonts, or external runtime libraries.

## Edit content

`content.json` contains biography, contact links, research interests, publications,
projects, notes, teaching, outreach, and CV update date. Edit it and run:

```sh
python3 build.py
```

Generated `site/index.html` is committed for immediate local preview. The GitHub
workflow regenerates it from the source on each manual deployment.

- Publications/preprints: `year`, `title`, `authors`, `venue`, `url`.
- Projects/notes/outreach: `year`, `title`, `description`, `meta`, `url`.
- Empty categories are hidden. No fictional research or outreach is included.
- Replace `site/assets/portrait.png` to change the photograph.
- Structure: `template.html`; styling: `site/style.css`; controls: `site/app.js`.
- Set `url` if you later use a custom domain, rebuild, and configure GitHub Pages.

## CV

The PDF at `site/assets/gijs-bartholomeus-cv.pdf` is dated 21 October 2026.
Heather Harrington has been added alongside Helen Byrne, Alain Goriely, and
Lida Kanari. Other substantive CV content is retained from the September version.
The original WERK files were not overwritten. Editable source is
`cv-source/gijs-bartholomeus-cv.tex`.

To rebuild the PDF with a local TeX installation:

```sh
mkdir -p /tmp/gijs-cv-build
pdflatex -interaction=nonstopmode -halt-on-error -output-directory=/tmp/gijs-cv-build cv-source/gijs-bartholomeus-cv.tex
pdflatex -interaction=nonstopmode -halt-on-error -output-directory=/tmp/gijs-cv-build cv-source/gijs-bartholomeus-cv.tex
cp /tmp/gijs-cv-build/gijs-bartholomeus-cv.pdf site/assets/gijs-bartholomeus-cv.pdf
```

## Topology lab

`site/topology.js` computes a Vietoris–Rips 2-skeleton for synthetic point clouds.
Edges join points at distance <= epsilon; triangles appear when all three edges
exist. Beta_0 uses connected components; beta_1 = E - V + beta_0 - rank(boundary_2),
with exact binary elimination over F_2 using BigInt. Higher simplices do not
change these two Betti numbers. The lab does not compute a persistence barcode.
Animation starts only when Play is clicked, and stops when hidden or offscreen.

```sh
node tests/topology.test.cjs
python3 tests/check_site.py
node --check site/app.js
```

## Publish on GitHub Pages

Use the personal **gijsbartholomeus** GitHub account.

1. Create a public repository named **gijsbartholomeus.github.io**. If it already
   exists, inspect and preserve its existing files before updating it.
2. Upload the **contents of this folder** to the repository root. In particular,
   `build.py`, `content.json`, `template.html`, `site/`, and `.github/` must be at
   the root. Do not put an enclosing `website/` folder in the repository.
3. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Run **Actions → Publish academic website → Run workflow**. Uploads alone do not publish changes.
5. After the deployment succeeds, visit https://gijsbartholomeus.github.io.

The included workflow builds the HTML and publishes only `site/`. TeX is not
needed on GitHub; the compiled CV PDF is included.

For CLI publishing, first sign in with `gh auth login --hostname github.com --web`
and verify that `gh api user --jq .login` prints `gijsbartholomeus`. Do not use the
separate Medscio account. Never share a password or access token in chat.

GitHub documentation: https://docs.github.com/en/pages/quickstart

To take the site offline, open **Settings → Pages**, open the menu beside the live
site message, and select **Unpublish site**. Run the publishing workflow again to
bring it back online. The workflow only runs manually, so uploads cannot
automatically republish an offline site.

## Sources and assets

Biography and academic records draw on the supplied brief and the academic CV
in WERK/career/applications. Supervisors and public contact email were confirmed
in the conversation. Publication citations and DOI links were transcribed from
the CV; DOI destinations were not independently verified.

`site/assets/aero-wallpaper.png` was generated with the built-in image tool for
this website. The prompt is preserved in `assets-notes.md`. All interface icons
are local SVG, and the site makes no requests for third-party image assets.
