# ENVIS Region VII

Interactive monitoring dashboard for DENR-EMB Region VII (Central Visayas) environmental permits.
It intercrosses the **Discharge Permit (DP)** and **Permit to Operate (PTO)** registers into one
establishment view, plots clustered Leaflet markers, and screens facilities against DENR hazard,
protected-area and watershed layers.

Built as a static, public, read-only site: the browser loads pre-compiled JSON from `public/data`
and only filters and renders — no server, database or login.

## Stack

| Concern | Choice |
| --- | --- |
| App | Vite 6, React 19, TypeScript |
| Styling | Tailwind CSS 3, custom DENR dark theme |
| Charts | ECharts 5 via `echarts-for-react` |
| Map | Leaflet 1.9 + `leaflet.markercluster`, key-less Esri/OSM basemaps |
| State | Zustand |
| Data pipeline | Node ESM scripts + mapshaper |

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production bundle in dist/
npm run preview      # serve the production bundle
```

There is no environment file and no secret to configure. The compiled dataset already lives in
`public/data/`, so `npm run dev` works on a fresh clone.

### Always-on local site

The dashboard can stay live on `http://127.0.0.1:5173` without starting it by hand:

```bash
npm run live:autostart   # register the "ENVIS Dashboard Live" logon task and start it now
npm run live:status      # is the site answering? is the task installed?
npm run live:restart     # stop the server and start it again
npm run live:remove      # stop everything and delete the logon task
```

`scripts/live.ps1` registers a Windows Task Scheduler job that launches
`scripts/serve-live.mjs` at every logon, hidden, with no console window. That supervisor runs Vite,
restarts it within seconds if it crashes, and ignores duplicate launches when the port is already
serving. Output is appended to `logs/live.log` (rotated at 5 MB). `npm run live` runs the same
supervisor in the foreground for debugging. Set `ENVIS_HOST` / `ENVIS_PORT` to bind elsewhere; the
scheduled task inherits the machine defaults at 127.0.0.1:5173.

> The repo's `.npmrc` points at `registry.npmmirror.com` because `registry.npmjs.org` is blocked in
> this environment. Delete or edit it if your network can reach the default registry.

## Data pipeline

```bash
npm run data:fetch     # Google Sheets -> data/raw/*.csv
npm run data:spatial   # spatial-src/ -> public/data/geojson/*
npm run data:build     # data/raw/*.csv -> public/data/{permits,sites,meta,quality}.json
npm run data:legal     # data/legal/snapshot.json -> public/data/legal.json
npm run data:all       # fetch -> spatial -> build -> legal (correct order)
```

`npm run data:legal:check` rebuilds the legal dataset and fails loudly if a
record count no longer reconciles with the vendored normaliser.

### Sources

| Key | Role | Google Sheet |
| --- | --- | --- |
| A | PTO register, tabs `PO 2020`–`PO 2026` + `SUMMARY` | `<workbook A id>` |
| B | DP / unified register, tabs `2019-2020`–`2026` + QA tabs | `<workbook B id>` |
| C | Hazardous waste register, `ALL DATA` + `SUMMARY` | `<workbook C id>` |

Tabs are read through Google's CSV export endpoint
the Google Sheets CSV export endpoint, so each sheet must be
shared as **Anyone with the link → Viewer**. The dashboard is built from the raw year tabs, not the
pre-cleaned `CLEAN` sheets; duplicates, dates, coordinates and QA flags are derived locally.

Sheet C is read from `ALL DATA` (not the per-year tabs) because it is the only tab that carries the
waste-stream rows, case handler and PCO contact fields. The hazardous-waste cross-tab happens at
build time: registrations are matched to DP/PTO establishments and to the ECC/CNC numbers found in
both registers.

#### Stand-in spatial bundle

The live spatial folder `1ZLmbgDrYU1VlGo4J2Mlnztf-yh4lRC_5` redirects to Google sign-in. The
dashboard ships eight consolidated Region VII layers in `spatial-src/` (provincial boundary,
legislative districts, protected areas, watersheds, flood and landslide susceptibility, land cover
and land classification). Replace the files in `spatial-src/` and rerun `npm run data:spatial` to
refresh them.

Basemaps are limited to key-less providers (Esri World Imagery / Streets / Topo / Ocean and
OpenStreetMap). The CARTO dark and light canvases need an API key and are intentionally not used.
Any unknown basemap key falls back to Esri Streets, so the map can never mount without a tile
provider.

Overlays load on demand the first time they are enabled and are cached in memory for the rest of the
session. They render in a dedicated Leaflet pane above the basemap but below the clustered markers.
Each active layer adds a legend card with a *zoom to layer* shortcut; if a layer sits outside the
current view the map fits to its bounding box automatically. Heavy layers (>2 MB) show a loading
chip, and a failed download surfaces a `failed` marker plus a retry action instead of silently
drawing nothing.

### Normalisation and matching

1. Headers are mapped to a shared permit schema per year tab.
2. Company names, dates (PH `MM/DD` order, Excel serials, ISO), provinces, LGUs, barangays and
   coordinates are normalised. Every change is logged to `quality.audit`.
3. Permits are de-duplicated by type + permit number, keeping the most complete copy.
4. Permits are grouped into establishments by strict name key within the same city/municipality,
   then expanded with parenthetical aliases and a guarded fuzzy pass (Dice ≥ 0.88). Branch markers,
   parenthetical names and coordinates can veto a match.
5. Geocoded permits are screened point-in-polygon against flood, landslide, protected-area,
   watershed, land-cover and land-classification layers. Hits are stored on the permit/site so the
   browser never recalculates them.

### Legal docket (NOV / PAB / ERF / complaints)

The legal layer is compiled from a pinned copy of the Legal Dashboards snapshot
(`data/legal/snapshot.json`) through the vendored normaliser in
`scripts/vendor/legal/buildData.mjs`. The ENVIS build does not read the Legal repository at runtime.

1. Every master NOV case, unlinked PAB NOV, order, PAB order, ERF payment, PAB penalty, RA 6969
   record and complaint becomes one docket row.
2. Generated placeholder rows with no respondent, reference, address or date are dropped before
   matching.
3. Docket respondents are matched to DP / PTO / HW establishments by exact name key, register alias
   and normalised key only. There is no automatic fuzzy match: possible matches (Dice ≥ 0.75) are
   written to `reports/legal-match-candidates.csv` for review. Verified pairs go into
   `scripts/legal-aliases.json` (`{"aliases": {"LEGAL NAME": "F01234"}}`).
4. An establishment's display name always comes from the DP / PTO / HW register. Legal respondent
   names are kept as supporting aliases. Docket respondents with no register match stay in a
   separate, collapsible list and are never plotted.
5. Case status is derived from the master compliance status, order and PAB order outcomes, ERF and
   penalty payment status and complaint status. LBC courier delivery status is deliberately ignored
   because "released" means the mail was delivered, not that the case was resolved. A case with no
   closing or pending signal is reported as *no status* rather than guessed.
6. Payment amounts never appear in the establishment or docket views. They are shown only in PAB
   coverage, aggregated by source year: 2021–2022 have no PAB tab, 2023 uses the OR lines embedded
   in the PAB NOV tab, and 2024–2026 use the PAB penalty register.

### Output

| File | Contents |
| --- | --- |
| `public/data/permits.json` | Normalised permit rows with lifecycle, QA flags, coordinates, spatial hits, risk |
| `public/data/sites.json` | Intercrossed establishments with DP/PTO counts, coverage gap, match method |
| `public/data/meta.json` | Totals, filter facets, QA summary, review queue, sources, notes |
| `public/data/quality.json` | Audit trail, review queue, duplicate sources, skipped rows |
| `public/data/hw.json` | Hazardous-waste registrations with waste streams, case handler, PCO contacts, records |
| `public/data/clearances.json` | ECC / CNC clearance index built from the DP, PTO and HW registers |
| `public/data/legal.json` | Legal docket, matched establishments, unmatched respondents, PAB coverage and yearly totals |
| `public/data/geojson/` | Simplified GeoJSON layers + `layers.json` manifest and styles |

## Screens

| Route | Page |
| --- | --- |
| `#/overview` | Executive KPIs, vintage/lifecycle charts, coverage gap, map preview |
| `#/dp`, `#/pto` | Discharge permit and permit-to-operate registers |
| `#/renewal` | Expiry calendar and renewal watchlist (30/60/90/180/365 days) |
| `#/sites` | DP · PTO intercross with coverage tabs and a site drawer |
| `#/map` | Clustered map, basemap switcher, overlays, site/permit modes |
| `#/spatial` | Layer library with presets and per-layer GeoJSON download |
| `#/screening` | Flood/landslide/PA/watershed exposure and a risk index |
| `#/quality` | QA flags, audit trail, review queue, duplicates, skipped rows |
| `#/tables` | Full permit, establishment and audit tables with CSV export |
| `#/reports` | Printable briefing, filtered CSV/JSON exports |
| `#/hw` | Hazardous-waste register, waste-stream charts, case handlers and PCO directory |
| `#/clearances` | ECC / CNC clearance index intercrossed with DP, PTO and HW records |
| `#/legal` | NOV / legal cases: matched establishments, municipality docket tracker, PAB coverage and collections |
| `#/about` | Methodology, sources, intercross rules, limitations |

Global filters (year, province, lifecycle, DP/PTO, scope, search) live in the top bar and apply
across pages. Scope is **Cebu and Bohol only**; Negros Oriental, Siquijor and other regions are
excluded from the compiled dataset rather than merely flagged.

Hazardous-waste charts count **waste-stream rows**, not unique applications, to match the official
release baseline: 2,638 applications, 16,305 waste-stream records and 2,395 distinct HW GR numbers
for the current register, with annual record totals of 2,749 / 2,806 / 3,101 / 2,947 / 2,610 /
1,932 / 160.
Case handlers and the PCO directory come from the register's `Case Handler`, `PCO Name`,
`PCO Contact` and `PCO Email` fields.

## Project layout

```
scripts/            data pipeline (fetch, spatial build, data build, shared libs)
scripts/vendor/     vendored upstream normalisers (legal/buildData.mjs) with provenance notes
data/raw/           downloaded CSV per tab + manifest
data/legal/         pinned Legal Dashboards snapshot used by the legal build
spatial-src/        source GeoJSON used by build-spatial
public/data/        compiled dataset consumed by the app
reports/            match-review queues (legal-match-candidates.csv)
src/components/     Layout, MapView, SiteDrawer, Chart, ui primitives
src/pages/          one file per route
src/store/          Zustand store, filters and selectors
src/lib/format.ts   formatting, palette, QA copy, CSV/JSON export helpers
```

## Quality model

Lifecycle is derived, not copied: a permit is **Active** while its expiry is in the future,
**Expiring** within 90 days, **Expired** after expiry, and **Unknown** without an expiry date.
Missing values are never imputed — they are surfaced in the quality view instead.

The risk index is additive and capped at 10: flood rank (0–4) + landslide rank (0–4) +
2 inside a protected area + 1 inside a watershed. Land cover and land classification are
contextual only.

## Deployment

`npm run build` emits a fully static `dist/`. Because `vite.config.ts` sets `base: './'`, the bundle
can be hosted at a domain root or in a subfolder (GitHub Pages, S3, IIS, nginx). Serve
`dist/index.html` for `#/` hash routes; no rewrite rules are needed.

## Limitations

- Register rows are not unique facilities; use establishment counts for site-level reporting.
- Some rows lack barangay, industry or expiry, and some coordinates are suspect. These are flagged,
  not corrected silently.
- Fuzzy establishment matches and simplified screening polygons are decision support, not an
  official determination.
- PTO 2025 contains application-only rows that are excluded from the dataset but listed under
  skipped rows in Data Quality.

## Access & authentication

The dashboard is gated behind a login screen. Credentials are stored in `CREDENTIALS.md`
(gitignored, never committed). Five roles are provisioned: Data [redacted], Regional Director,
Environmental Monitoring & Enforcement Division, Clearance and Permitting Division, and
Management and Information System. Only the [redacted] (and MIS) account can export data.

## License

Released under the MIT License. See `LICENSE`.
