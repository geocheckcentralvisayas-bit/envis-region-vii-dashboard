import { useMemo } from 'react';
import {
  BookOpen, Building2, CalendarRange, Database, ExternalLink, FileSpreadsheet, Gavel, GitBranch,
  Globe2, Info, Layers3, MapPin, ShieldAlert, TriangleAlert, Workflow,
} from 'lucide-react';
import { useDashboard } from '../store/useDashboard';
import { Chip, Panel, SectionHeading } from '../components/ui';
import { formatBytes, formatDateTime, formatNumber } from '../lib/format';

export function AboutPage() {
  const data = useDashboard((state) => state.data);

  const workbooks = useMemo(() => Object.entries(data?.meta.sources.workbooks ?? {}), [data]);
  const intakeTabs = useMemo(
    () => (data?.meta.sources.tabs ?? []).filter((tab) => tab.type === 'DP' || tab.type === 'PTO'),
    [data],
  );
  const supportTabs = useMemo(
    () => (data?.meta.sources.tabs ?? []).filter((tab) => tab.type !== 'DP' && tab.type !== 'PTO'),
    [data],
  );

  if (!data) return null;

  return (
    <div className="animate-fade-up space-y-4">
      <SectionHeading
        eyebrow="About this build"
        title="Methodology & sources"
        description="A public, read-only monitoring view of DENR-EMB Region VII discharge permits and permits to operate, with establishment intercrossing and spatial screening."
        action={
          <>
            <Chip tone="emerald"><GitBranch size={10} /> Build 1.0</Chip>
            <Chip tone="slate">Reference {data.meta.referenceDate}</Chip>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Purpose" subtitle="What the dashboard answers">
          <p className="text-[11.5px] leading-relaxed text-slate-400">
            ENVIS Region VII brings the discharge permit and permit-to-operate registers into one view so that
            establishments can be assessed as a whole: which facilities hold both permits, which are missing one,
            which are due for renewal, and which sit inside hazard or protected-area constraints.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ['Permit records', data.meta.totals.permits],
              ['Establishments', data.meta.totals.sites],
              ['Matched on both', data.meta.totals.bothSites],
              ['In scope', data.meta.totals.inScope],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                <div className="text-[9px] uppercase tracking-[0.1em] text-slate-600">{label}</div>
                <div className="font-mono text-[14px] text-slate-200">{formatNumber(Number(value))}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Scope" subtitle="Geography and registers">
          <ul className="space-y-2 text-[11.5px] leading-relaxed text-slate-400">
            <li className="flex gap-2"><Globe2 size={13} className="mt-0.5 shrink-0 text-emerald-400/80" /><span><b className="text-slate-300">In scope:</b> Cebu and Bohol, per the 2026 PSGC definition of Region VII. Negros Oriental and Siquijor records are retained but marked out of scope.</span></li>
            <li className="flex gap-2"><FileSpreadsheet size={13} className="mt-0.5 shrink-0 text-emerald-400/80" /><span><b className="text-slate-300">Registers:</b> DP 2019–2026 and PTO 2020–2026, compiled from the year tabs rather than the pre-cleaned sheets.</span></li>
            <li className="flex gap-2"><Database size={13} className="mt-0.5 shrink-0 text-emerald-400/80" /><span><b className="text-slate-300">Included:</b> hazardous-waste generator registrations and ECC / CNC clearance references are intercrossed with DP and PTO at establishment level.</span></li>
            <li className="flex gap-2"><FileSpreadsheet size={13} className="mt-0.5 shrink-0 text-emerald-400/80" /><span><b className="text-slate-300">EIA ultralist:</b> ECC OL, ECC Manual, CAT C and CNC OL records are consolidated for Cebu and Bohol only; Negros Oriental and Siquijor rows are excluded before matching.</span></li>
          </ul>
        </Panel>

        <Panel title="Method" subtitle="From spreadsheet to dashboard">
          <ol className="space-y-2 text-[11px] leading-relaxed text-slate-400">
            {[
              'Fetch each year tab as CSV and map headers to a shared permit schema.',
              'Normalise names, dates, provinces, LGUs, barangays and coordinates; log every change.',
              'De-duplicate permit numbers, keeping the most complete source row.',
              'Group permits into establishments by LGU and normalised name, with alias and guarded fuzzy matching.',
              'Screen geocoded permits against simplified spatial layers and derive a risk index.',
              'Compile the NOV / PAB / ERF / complaint docket and match respondents to establishments by exact or reviewed names only.',
              'Publish static JSON; the browser only filters and renders.',
            ].map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white/[0.05] font-mono text-[8.5px] text-slate-400">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Source registers" subtitle="Registers compiled into this build" action={<Database size={14} className="text-slate-500" />}>
          <div className="space-y-2">
            {workbooks.map(([key, workbook]) => (
              <div key={key} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-400/10 font-mono text-[11px] font-bold text-emerald-300">{key}</div>
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-slate-200">{workbook.label}</div>
                  <div className="truncate text-[9px] text-slate-600">Compiled register</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] leading-relaxed text-slate-600">
            Fetched {formatDateTime(data.meta.sources.fetchedAt)}. Support tabs are used for QA cross-checks but the dashboard is rebuilt from the raw year tabs.
          </div>
        </Panel>

        <Panel title="Intake tabs" subtitle="Rows read per permit tab" action={<FileSpreadsheet size={14} className="text-slate-500" />}>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {intakeTabs.map((tab) => (
              <div key={tab.key} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5">
                <div className="min-w-0">
                  <div className="truncate text-[11px] text-slate-300">{tab.sheet}</div>
                  <div className="text-[9px] text-slate-600">{tab.workbook} · {tab.gid ? `gid ${tab.gid}` : 'sheet'}</div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-emerald-300/80">{formatNumber(tab.rows)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-white/[0.05] pt-2">
            <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-slate-600">Support tabs</div>
            <div className="flex flex-wrap gap-1.5">
              {supportTabs.map((tab) => (
                <span key={tab.key} className="chip chip-slate normal-case tracking-normal">{tab.sheet} · {formatNumber(tab.rows)}</span>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Establishment intercross" subtitle="How DP and PTO records are paired">
        <div className="grid gap-4 text-[11px] leading-relaxed text-slate-400 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><Building2 size={12} className="text-emerald-400" /> Identity</div>
            Company names are normalised by removing legal suffixes, punctuation and diacritics. Records are first grouped by city/municipality and strict name key.
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><Workflow size={12} className="text-emerald-400" /> Aliases</div>
            Parenthetical aliases and branch suffixes are matched when they contain at least two distinctive tokens. Generic aliases such as “Poultry Farm” are rejected.
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><GitBranch size={12} className="text-emerald-400" /> Fuzzy guard</div>
            Token Dice similarity must reach 88% inside the same LGU. Matches are rejected when branch markers, parenthetical names or coordinates conflict.
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><MapPin size={12} className="text-emerald-400" /> Result</div>
            <span className="font-mono text-[10.5px] text-emerald-300/80">{formatNumber(data.meta.totals.crossMatchedSites)}</span> establishments link both registers. The rest remain DP-only or PTO-only and are visible as coverage gaps.
          </div>
        </div>
      </Panel>

      <Panel title="Legal docket intercross" subtitle="NOV, PAB, ERF and complaint records">
        <div className="grid gap-4 text-[11px] leading-relaxed text-slate-400 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><Gavel size={12} className="text-rose-400" /> Identity</div>
            Legal respondents are matched to DP, PTO and HW establishments by exact name key, register alias and normalised key. There is no automatic fuzzy link.
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><Building2 size={12} className="text-rose-400" /> Display name</div>
            The establishment always keeps its register name. Docket names are shown underneath as supporting aliases, so two spellings never split one facility.
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><Workflow size={12} className="text-rose-400" /> Review queue</div>
            <span className="font-mono text-[10.5px] text-rose-300/80">{formatNumber(data.legal.candidateCount)}</span> possible matches are written to <span className="font-mono text-[10px]">reports/legal-match-candidates.csv</span>. Verified pairs go into <span className="font-mono text-[10px]">scripts/legal-aliases.json</span>.
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><MapPin size={12} className="text-rose-400" /> Result</div>
            <span className="font-mono text-[10.5px] text-rose-300/80">{formatNumber(data.legal.totals.matchedEntities)}</span> establishments carry docket records. <span className="font-mono text-[10.5px]">{formatNumber(data.legal.totals.unmatchedEntities)}</span> respondents have no register match and stay off the map.
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Spatial bundle" subtitle="Layers bundled with the dashboard" action={<Layers3 size={14} className="text-slate-500" />}>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.layers.layers.map((layer) => (
              <div key={layer.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11.5px] font-medium text-slate-200">{layer.name}</span>
                  <span className="shrink-0 font-mono text-[9px] text-slate-600">{formatNumber(layer.count)}</span>
                </div>
                <div className="mt-0.5 text-[9.5px] text-slate-600">{layer.group} · {layer.geometry} · {formatBytes(layer.sizeBytes)}</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(layer.classes.length ? layer.classes : ['outline']).slice(0, 6).map((code) => {
                    const meta = layer.classMeta?.[code];
                    return (
                      <span key={code} className="inline-flex items-center gap-1 rounded border border-white/[0.06] px-1 py-0.5 text-[8.5px] text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-sm" style={{ background: meta?.color ?? layer.style.color ?? '#34d399' }} />
                        {meta?.label ?? code}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-slate-600">
            Total bundle {formatBytes(data.layers.totalBytes)} · generated {formatDateTime(data.layers.generatedAt)}. Geometry is dissolved by classification and simplified for web delivery.
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Risk index" subtitle="Transparent, additive scoring">
            <div className="space-y-1.5 text-[10.5px] text-slate-400">
              {[
                ['Flood susceptibility', '0–4'],
                ['Landslide susceptibility', '0–4'],
                ['Inside protected area', '+2'],
                ['Inside watershed', '+1'],
                ['Cap', '10'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-2 border-b border-white/[0.04] pb-1">
                  <span>{label}</span>
                  <span className="font-mono text-[10px] text-slate-300">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] leading-relaxed text-slate-600">
              Highest risk among a site's permits is used at establishment level. Land cover and land classification are contextual and do not add to the score.
            </div>
          </Panel>

          <Panel title="Limitations" subtitle="Interpretation notes" action={<TriangleAlert size={14} className="text-amber-400/80" />}>
            <ul className="space-y-2 text-[10.5px] leading-relaxed text-slate-500">
              <li>Register rows are not the same as unique facilities; use the establishment register for site counts.</li>
              <li>Some records lack barangay, industry or expiry; these are flagged rather than imputed.</li>
              <li>Coordinates from the source are screened for validity, but suspect points may remain.</li>
              <li>Fuzzy establishment matches should be reviewed for high-impact decisions.</li>
              <li>Legal status is only as complete as the source registers; cases with no closing or pending signal are shown as <i>no status</i>, not assumed resolved.</li>
              <li>PAB collections are yearly totals only; no payment amount is attributed to an individual establishment or case.</li>
              <li>Spatial screening uses simplified polygons and is indicative, not a permit decision.</li>
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Build metadata" subtitle="Reproducibility">
          <dl className="space-y-2 text-[11px]">
            {[
              ['Generated', formatDateTime(data.meta.generatedAt)],
              ['Reference date', data.meta.referenceDate],
              ['Source rows', formatNumber(data.meta.totals.sourceRows)],
              ['Unique permits', formatNumber(data.meta.totals.permits)],
              ['Duplicates merged', formatNumber(data.meta.totals.duplicates)],
              ['Rows skipped', formatNumber(data.meta.totals.skippedRows)],
              ['Screened permits', formatNumber(data.meta.totals.screened)],
              ['Plotted permits', formatNumber(data.meta.totals.plotted)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2 border-b border-white/[0.04] pb-1.5">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-mono text-[10.5px] text-slate-300">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Data pipeline" subtitle="Scripts in the project" className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { name: 'scripts/fetch-sheets.mjs', text: 'Fetches each year tab as CSV into data/raw with a manifest.' },
              { name: 'scripts/build-spatial.mjs', text: 'Reads shapefiles, dissolves classes, simplifies geometry and writes GeoJSON.' },
              { name: 'scripts/build-data.mjs', text: 'Normalises permits, de-duplicates, builds sites, screens coordinates and writes JSON.' },
              { name: 'scripts/build-legal.mjs', text: 'Compiles the NOV / PAB / ERF / complaint docket and matches respondents to establishments.' },
              { name: 'npm run data:all', text: 'Runs fetch → spatial → build → legal in the required order.' },
            ].map((entry) => (
              <div key={entry.name} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <div className="font-mono text-[10px] text-emerald-300/80">{entry.name}</div>
                <div className="mt-1 text-[10px] leading-relaxed text-slate-500">{entry.text}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
            <Chip tone="slate"><Info size={10} /> Static site, no login</Chip>
            <Chip tone="slate"><BookOpen size={10} /> Public read-only</Chip>
            <Chip tone="slate"><CalendarRange size={10} /> {data.meta.years.length} permit vintages</Chip>
            <Chip tone="slate"><ShieldAlert size={10} /> {formatNumber(data.meta.totals.riskSites)} high-risk sites</Chip>
          </div>
        </Panel>
      </div>

      <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.035] p-4 text-[10.5px] leading-relaxed text-emerald-100/70">
        <b className="text-emerald-200">Attribution.</b> Permit data belongs to DENR-EMB Region VII. Basemaps are provided by Esri, CARTO and OpenStreetMap contributors. This dashboard is a monitoring aid and does not replace official records, permits or clearances.
      </div>
        <Panel title="License & credits" subtitle="Open-source release" action={<Info size={14} className="text-slate-500" />}>
        <div className="space-y-2 text-[11.5px] leading-relaxed text-slate-400">
          <p>
            <b className="text-slate-300">ENVIS Region VII</b> is released under the <b className="text-slate-300">MIT License</b>.
            Copyright (c) 2026 K3nt Bytes. Permission is hereby granted, free of charge, to any person obtaining a copy
            of this software and associated documentation files to deal in the Software without restriction, including without
            limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies.
          </p>
          <p>
            The software is provided "as is", without warranty of any kind. Spatial layers are derived from DENR Region VII
            shapefiles; permit data is sourced from the DENR-EMB Region VII registers.
          </p>
          <p className="font-mono text-[10px] text-slate-500">
            Built with React, Vite, Leaflet, ECharts and TypeScript. Data pipeline: Node.js.
          </p>
        </div>
      </Panel>
  </div>
  );
}
