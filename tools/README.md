# Tools

| Folder | Purpose |
|---|---|
| `pdf/` | Rebuilds `docs/MYDR24-Master-Specification-v3.0.pdf` from the Markdown sources |
| `typecheck/` | Offline type-check of the Doctor app with minimal stubs. Use it only when `npm install` isn't possible. Normally, run `npm run typecheck` inside `apps/doctor-app`. |

## Rebuild the PDF
```bash
python3 tools/pdf/md2html.py build.html "MYDR24 Unified Healthcare Ecosystem — Master Specification" \
  "Acute Care · Chronic Care · Virtual Hospitalization (Virtual IPD) · RPM & Elderly Care" \
  "docs/MYDR24-Master-Specification-v3.md:Master Specification v3.0" \
  "docs/annex-a-virtual-hospitalization-research.md:Annex A — Evidence & Market Research" \
  "docs/annex-b-platform-ecosystem-spec.md:Annex B — Platform & Mobile Ecosystem Specification" \
  "docs/annex-c-doctor-app-screen-spec.md:Annex C — Doctor App: Virtual IPD Screens" \
  "docs/annex-d-chronic-care-spec.md:Annex D — Chronic Care Management & Longitudinal RPM"
node tools/pdf/render-pdf.js "$(pwd)/build.html" "$(pwd)/docs/MYDR24-Master-Specification-v3.0.pdf" "MYDR24 Master Specification v3.0"
```
`render-pdf.js` needs Playwright and a Chromium binary. The paths in the script point to the Kiro sandbox, so edit `executablePath` and the `require` path for your machine (or `npm i playwright-core`).

## Offline type-check
```bash
cd tools/typecheck && npx tsc -p tsconfig.json
```
