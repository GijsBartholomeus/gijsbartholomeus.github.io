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

- Six folders: About me, Research, Teaching, CV, Contact, and TDA demos.
- Start menu, taskbar, taskbar clock, draggable profile window on desktop,
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
- Interest descriptions and `references` (`authors`, `title`, `url`) appear in
  hover, keyboard, and tap popovers on the Research introduction. References are
  introductory reading; publications remain in their own list.
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

## Tree and barcode demos

`site/neurons.js` implements an iterative elder-rule TMD calculation for rooted
trees with a monotone distance value. The synthetic fixtures use radius; the
biological examples use length along the original 3D branches. The TMD view links
branch colours and numbers, barcode intervals, and a shared distance cut.
The separate TNS view uses actual recorded NeuroTS runs, described below.

Method references:

- Kanari, Dłotko, Scolamiero et al. (2018), *A Topological Representation of
  Branching Neuronal Morphologies*. https://doi.org/10.1007/s12021-017-9341-1
- Kanari, Garin & Hess (2020), *From Trees to Barcodes and Back Again:
  Theoretical and Statistical Perspectives*. https://doi.org/10.3390/a13120335
- Kanari, Dictus, Chalimourda et al. (2022), *Computational synthesis of cortical
  dendritic morphologies*. https://doi.org/10.1016/j.celrep.2022.110586

Run `node tests/neurons.test.cjs` to check the elder rule, filtration limits,
invalid inputs, and independent barcode round trips across random seeds.

### Recorded NeuroTS synthesis

The TNS view shows a genuine source → barcode → synthesis pipeline, computed
offline with NeuroTS 3.7.0 and TMD 2.4.3. A synthetic apical dendrite (seed 42) is
generated from the authors’ example distributions. Its path-distance TMD barcode
and branch-angle properties are extracted with TMD, then used as the input to
three new NeuroTS runs (seeds 137, 271, 459). The browser replays the actual growth
iteration associated with each segment. This is a 2D projection of 3D geometry.
Playback progress is algorithmic, not biological time. Different stochastic runs
need not reproduce the source barcode or branching structure exactly.

- Playback asset: `site/assets/neurots-growth.js` (generated data only).
- Downloadable 3D morphologies: `site/assets/neurots-apical-*.swc`.
- Reproduction script and preserved inputs: `demo-source/neurots/`.
- Upstream input revision: `openbraininstitute/NeuroTS`, commit
  `5ee2931192c12337b34be27ac0aa61353e136284`, `examples/data/bio_*.json`.
- The source inputs’ Apache 2.0 license is included as
  `demo-source/neurots/LICENSE-NeuroTS.txt`. Inputs were retained unchanged; the
  generator restricts growth to the apical dendrite in memory and subsequently
  substitutes the extracted barcode and angles. No upstream implementation code
  is shipped as browser code.

To regenerate, install `demo-source/neurots/requirements.txt` in a Python 3.12
virtual environment, then run `python demo-source/neurots/generate.py`. Scientific Python
dependencies are needed only for this offline step. The website remains static.

### Comparing morphologies and synthesis runs

The TMD view uses the authors’ biological example reconstructions C220197A-P2
and Fluo55_left, retaining the original geometry. The colour-coded apical arbors
have 30 and 8 terminals; basal dendrites are shown in grey for context. No
biological cell-type labels have been inferred. Morphological cell-type
classification is cited to Kanari et al. (2019),
https://doi.org/10.1093/cercor/bhy339.

`demo-source/cells/prepare.py` processes the unchanged H5 inputs from the NeuroTS
repository, revision `5ee2931192c12337b34be27ac0aa61353e136284`,
`examples/data/neurons/`. It compares the extracted path-distance barcodes to TMD
2.4.3. Browser data are in `site/assets/tmd-cells.js`; the independent JavaScript
calculation is checked against those official descriptors. One repeated,
zero-length point is collapsed. This leaves the metric tree unchanged. The
upstream Apache 2.0 license is retained in
`demo-source/neurots/LICENSE-NeuroTS.txt`. To regenerate, run
`python demo-source/cells/prepare.py` in the same scientific Python environment.
The slider uses the same fraction of each arbor’s maximum path length; barcode
axes and cell drawings use common physical scales.

The third box of the NeuroTS pipeline displays all three recorded trees side by
side. The shared slider and playback set the same relative completion percentage
for each run, whose total algorithm-step counts differ. All three downloads are
available together. The right-hand desktop gadgets have been removed.

The Medscio bio text is supplied by Gijs. The hospital-records quotation is from
Scott Alexander, *Meditations on Moloch* (30 July 2014),
https://slatestarcodex.com/2014/07/30/meditations-on-moloch/. The attribution was
verified against that original post.
