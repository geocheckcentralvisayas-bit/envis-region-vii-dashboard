import { useMemo, useState } from 'react';
import {
  BookOpen, Building2, CalendarRange, Copyright, Database, ExternalLink, FileSpreadsheet, Gavel, GitBranch, Github,
  Globe2, Info, Layers3, Mail, MapPin, Phone, Rocket, ScrollText, ShieldAlert, ShieldCheck, Tag, TriangleAlert, User,
  Workflow,
} from 'lucide-react';
import { useDashboard } from '../store/useDashboard';
import { Chip, Panel, SectionHeading } from '../components/ui';
import { formatBytes, formatDateTime, formatNumber } from '../lib/format';
import { EMB_R7_CONTACTS, EMB_R7_OFFICE } from '../lib/contacts';
import {
  ACTIONS_URL, APP_VERSION, BUILD_NUMBER, BUILT_AT, COMMIT_SHA, EMB_R7_URL, LICENSE_URL, RELEASES_URL, REPO_URL,
  VERSION_LABEL,
} from '../lib/version';

type AboutTab = 'method' | 'license' | 'contacts' | 'version';

const ABOUT_TABS: { id: AboutTab; label: string; icon: typeof Workflow }[] = [
  { id: 'method', label: 'Methodology', icon: Workflow },
  { id: 'license', label: 'License & credits', icon: Copyright },
  { id: 'contacts', label: 'Contact directory', icon: Phone },
  { id: 'version', label: 'Version & releases', icon: Tag },
];

const DEVELOPER = {
  name: 'Kent Agbayani',
  alias: 'K3nt-Bytes',
  email: 'Liquidkentagbayani@proton.me',
  role: 'Developer & maintainer',
};

export function AboutPage() {
  const data = useDashboard((state) => state.data);
  const [tab, setTab] = useState<AboutTab>('method');

  const workbooks = useMemo(() => Object.entries(data?.meta.sources.workbooks ?? {}), [data]);
  const intakeTabs = useMemo(
    () => (data?.meta.sources.tabs ?? []).filter((entry) => entry.type === 'DP' || entry.type === 'PTO'),
    [data],
  );
  const supportTabs = useMemo(
    () => (data?.meta.sources.tabs ?? []).filter((entry) => entry.type !== 'DP' && entry.type !== 'PTO'),
    [data],
  );

  if (!data) return null;

  return (
    <div className="animate-fade-up space-y-4">
      <SectionHeading
        eyebrow="About this build"
        title="About, license & contacts"
        description="Methodology and provenance of the dashboard, the license and credits, the DENR-EMB Region VII directory, and the build version history."
        action={
          <>
            <Chip tone="emerald"><GitBranch size={10} /> Build {APP_VERSION}</Chip>
            <Chip tone="slate">Reference {data.meta.referenceDate}</Chip>
          </>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {ABOUT_TABS.map((entry) => {
          const Icon = entry.icon;
          const active = tab === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={
                active
                  ? 'inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-1.5 text-[11px] font-medium text-emerald-200'
                  : 'inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:border-white/20 hover:text-slate-200'
              }
            >
              <Icon size={12} /> {entry.label}
            </button>
          );
        })}
      </div>

      {tab === 'method' && (
        <>
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

            <Panel title="Access & administration" subtitle="Roles and the MIS admin panel">
              <ul className="space-y-2 text-[11.5px] leading-relaxed text-slate-400">
                <li className="flex gap-2"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-400/80" /><span><b className="text-slate-300">Roles:</b> data extraction and MIS can export CSV/JSON; GIS can download GeoJSON; the Regional Director has full visibility but no export controls.</span></li>
                <li className="flex gap-2"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-400/80" /><span><b className="text-slate-300">MIS admin panel:</b> the MIS account can add, edit, deactivate and delete accounts, reset passwords, and review sign-in, export and account-change activity from the Accounts & Activity page.</span></li>
                <li className="flex gap-2"><ShieldAlert size={13} className="mt-0.5 shrink-0 text-amber-400/80" /><span><b className="text-slate-300">Browser-local data:</b> managed accounts and the activity log are stored in the browser's local storage, so they are specific to that device. A shared backend is required to sync users and activity across devices.</span></li>
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
                {intakeTabs.map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5">
                    <div className="min-w-0">
                      <div className="truncate text-[11px] text-slate-300">{entry.sheet}</div>
                      <div className="text-[9px] text-slate-600">{entry.workbook} · {entry.gid ? `gid ${entry.gid}` : 'sheet'}</div>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-emerald-300/80">{formatNumber(entry.rows)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-white/[0.05] pt-2">
                <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-slate-600">Support tabs</div>
                <div className="flex flex-wrap gap-1.5">
                  {supportTabs.map((entry) => (
                    <span key={entry.key} className="chip chip-slate normal-case tracking-normal">{entry.sheet} · {formatNumber(entry.rows)}</span>
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
                  ['Version', VERSION_LABEL],
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
        </>
      )}

      {tab === 'license' && (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <Panel title="Developer & maintainer" subtitle="Author of this build" className="lg:col-span-1" action={<User size={14} className="text-slate-500" />}>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-[16px] font-bold text-emerald-300">KA</div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-100">{DEVELOPER.name}</div>
                  <div className="text-[10.5px] text-emerald-300/80">{DEVELOPER.alias}</div>
                  <div className="text-[9.5px] text-slate-500">{DEVELOPER.role}</div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-[11px]">
                <a href={`mailto:${DEVELOPER.email}`} className="flex items-center gap-2 text-slate-300 hover:text-emerald-200">
                  <Mail size={12} className="shrink-0 text-emerald-400/80" />
                  <span className="truncate">{DEVELOPER.email}</span>
                </a>
                <a href={REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-300 hover:text-emerald-200">
                  <Github size={12} className="shrink-0 text-emerald-400/80" />
                  <span className="truncate">geocheckcentralvisayas-bit/envis-dashboard-region-vii</span>
                </a>
                <a href={EMB_R7_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-300 hover:text-emerald-200">
                  <ExternalLink size={12} className="shrink-0 text-emerald-400/80" />
                  <span className="truncate">r7.emb.gov.ph</span>
                </a>
              </div>
              <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-[10px] leading-relaxed text-slate-500">
                <b className="text-slate-300">Copyright © 2026 {DEVELOPER.name} ({DEVELOPER.alias}).</b><br />
                All rights reserved under the MIS Credit License.
              </div>
            </Panel>

            <Panel title="MIS Credit License" subtitle="Terms for this repository" className="lg:col-span-2" action={<Copyright size={14} className="text-slate-500" />}>
              <div className="space-y-2 text-[11.5px] leading-relaxed text-slate-400">
                <p>
                  <b className="text-slate-300">ENVIS Region VII</b> is released under the <b className="text-slate-300">MIS Credit License</b>.
                  Copyright (c) 2026 <b className="text-slate-300">{DEVELOPER.name} ({DEVELOPER.alias})</b>.
                </p>
                <p>
                  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
                  associated documentation files to deal in the Software without restriction, including without limitation
                  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies, subject to
                  retaining the copyright notice and this permission notice in all copies or substantial portions.
                </p>
                <p>
                  The software is provided “as is”, without warranty of any kind, express or implied. Spatial layers are
                  derived from DENR Region VII shapefiles; permit data is sourced from the DENR-EMB Region VII registers.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a href={LICENSE_URL} target="_blank" rel="noreferrer" className="btn btn-xs">
                    <ScrollText size={11} /> Full license text
                  </a>
                  <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn btn-xs">
                    <Github size={11} /> Repository
                  </a>
                  <a href={EMB_R7_URL} target="_blank" rel="noreferrer" className="btn btn-xs">
                    <ExternalLink size={11} /> r7.emb.gov.ph
                  </a>
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Data attribution" subtitle="Who owns the records">
              <ul className="space-y-2 text-[11px] leading-relaxed text-slate-400">
                <li><b className="text-slate-300">DENR-EMB Region VII</b> owns the permit, hazardous-waste, clearance and legal records shown in this dashboard.</li>
                <li><b className="text-slate-300">Basemaps:</b> Esri, CARTO and OpenStreetMap contributors.</li>
                <li><b className="text-slate-300">Boundaries:</b> PSA / PSGC 2026 for administrative units; DENR Region VII for hazard and protected-area layers.</li>
                <li>This dashboard is a monitoring aid and does not replace official records, permits or clearances.</li>
              </ul>
            </Panel>
            <Panel title="Built with" subtitle="Stack and libraries">
              <p className="text-[11px] leading-relaxed text-slate-400">
                React, Vite, Leaflet, ECharts and TypeScript. Data pipeline: Node.js.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['React 19', 'Vite 6', 'TypeScript 5', 'Leaflet', 'ECharts', 'Zustand', 'Tailwind CSS', 'Node.js'].map((item) => (
                  <span key={item} className="chip chip-slate normal-case tracking-normal">{item}</span>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}

      {tab === 'contacts' && (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <Panel title="Regional office" subtitle="DENR-EMB Region VII" className="lg:col-span-1" action={<Building2 size={14} className="text-slate-500" />}>
              <div className="space-y-3 text-[11.5px] leading-relaxed text-slate-400">
                <div className="flex gap-2">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-emerald-400/80" />
                  <span>{EMB_R7_OFFICE.address}</span>
                </div>
                <div className="flex gap-2">
                  <Phone size={13} className="mt-0.5 shrink-0 text-emerald-400/80" />
                  <a href={`tel:${EMB_R7_OFFICE.trunkline.replace(/[^+\d]/g, '')}`} className="hover:text-emerald-200">{EMB_R7_OFFICE.trunkline}</a>
                </div>
                <div className="flex gap-2">
                  <Mail size={13} className="mt-0.5 shrink-0 text-emerald-400/80" />
                  <a href={`mailto:${EMB_R7_OFFICE.email}`} className="hover:text-emerald-200">{EMB_R7_OFFICE.email}</a>
                </div>
                <div className="flex gap-2">
                  <Globe2 size={13} className="mt-0.5 shrink-0 text-emerald-400/80" />
                  <a href={EMB_R7_OFFICE.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-emerald-200">
                    r7.emb.gov.ph <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </Panel>

            <Panel title="Using this directory" subtitle="How to reach the right section" className="lg:col-span-2">
              <div className="grid gap-3 text-[11px] leading-relaxed text-slate-400 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><Phone size={12} className="text-emerald-400" /> Local extension</div>
                  Dial the trunkline and ask for the local extension listed beside each section.
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><Mail size={12} className="text-emerald-400" /> Email</div>
                  Addresses are clickable and open the default mail client. Include the permit or case reference in the subject.
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><MapPin size={12} className="text-emerald-400" /> Records</div>
                  Receiving and releasing of documents is handled by the Records Unit (local 109).
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><ExternalLink size={12} className="text-emerald-400" /> Official site</div>
                  Verify advisories and official forms at <a href={EMB_R7_URL} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200">r7.emb.gov.ph</a>.
                </div>
              </div>
            </Panel>
          </div>

          {EMB_R7_CONTACTS.map((group) => (
            <Panel
              key={group.short}
              bodyClassName="p-0"
              title={group.division}
              subtitle={`${group.short} · ${group.rows.length} section${group.rows.length === 1 ? '' : 's'}`}
              action={<span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">{group.short}</span>}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/[0.07] text-[8.5px] uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-3 py-2 font-semibold">Section</th>
                      <th className="px-3 py-2 font-semibold">Email</th>
                      <th className="px-3 py-2 font-semibold">Local ext.</th>
                      <th className="px-3 py-2 font-semibold">Mobile no.</th>
                      <th className="px-3 py-2 font-semibold">Related concerns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={`${group.short}-${row.section}`} className="border-b border-white/[0.04] last:border-0">
                        <td className="px-3 py-2 text-[10.5px] font-medium text-slate-200">{row.section}</td>
                        <td className="px-3 py-2 text-[10px]">
                          <a href={`mailto:${row.email}`} className="whitespace-nowrap text-emerald-300 hover:text-emerald-200">{row.email}</a>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-slate-400">{row.local || '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-slate-400">{row.mobile || '—'}</td>
                        <td className="px-3 py-2 text-[10px] text-slate-500">{row.concerns || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ))}

          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.035] p-4 text-[10.5px] leading-relaxed text-emerald-100/70">
            <b className="text-emerald-200">Directory note.</b> Contact details are provided for DENR-EMB Region VII clients and partners. Verify against the official roster at <a href={EMB_R7_URL} target="_blank" rel="noreferrer" className="text-emerald-200 hover:text-emerald-100">r7.emb.gov.ph</a> before relying on them for official transactions.
          </div>
        </>
      )}

      {tab === 'version' && (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <Panel title="Current build" subtitle="Identity of this deployment" className="lg:col-span-1" action={<Tag size={14} className="text-slate-500" />}>
              <div className="text-2xl font-bold tracking-tight text-slate-50">v{APP_VERSION}</div>
              <div className="mt-0.5 text-[10.5px] text-slate-500">{BUILD_NUMBER ? `Build ${BUILD_NUMBER}` : 'Local development build'}</div>
              <dl className="mt-4 space-y-2 text-[11px]">
                {[
                  ['Version', `v${APP_VERSION}`],
                  ['Build', BUILD_NUMBER || 'dev'],
                  ['Commit', COMMIT_SHA || 'local'],
                  ['Built at', BUILT_AT ? formatDateTime(BUILT_AT) : '—'],
                  ['Reference date', data.meta.referenceDate],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-2 border-b border-white/[0.04] pb-1.5">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-mono text-[10.5px] text-slate-300">{value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel title="Automatic versioning" subtitle="One version per change" className="lg:col-span-2" action={<Rocket size={14} className="text-slate-500" />}>
              <ol className="space-y-2 text-[11px] leading-relaxed text-slate-400">
                {[
                  'Every push to main triggers the Deploy workflow in GitHub Actions.',
                  'The build embeds the package version, the Actions build number and the short commit SHA.',
                  'After a successful deployment the workflow creates a GitHub release tagged v<version>-b<build>.',
                  'The sidebar, footer and this page always show the version currently deployed.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white/[0.05] font-mono text-[8.5px] text-slate-400">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={RELEASES_URL} target="_blank" rel="noreferrer" className="btn btn-xs">
                  <Tag size={11} /> Releases
                </a>
                <a href={ACTIONS_URL} target="_blank" rel="noreferrer" className="btn btn-xs">
                  <Rocket size={11} /> Actions runs
                </a>
                <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn btn-xs">
                  <Github size={11} /> Repository
                </a>
                <a href={EMB_R7_URL} target="_blank" rel="noreferrer" className="btn btn-xs">
                  <ExternalLink size={11} /> r7.emb.gov.ph
                </a>
              </div>
              <div className="mt-4 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-2.5 text-[10.5px] leading-relaxed text-emerald-100/70">
                <b className="text-emerald-200">Deployed build:</b> {VERSION_LABEL}
                {COMMIT_SHA ? <> · commit <span className="font-mono">{COMMIT_SHA}</span></> : null}
                {BUILT_AT ? <> · {formatDateTime(BUILT_AT)}</> : null}
              </div>
            </Panel>
          </div>

          <Panel title="Release history" subtitle="Where to find every build">
            <div className="grid gap-3 text-[11px] leading-relaxed text-slate-400 sm:grid-cols-2">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><Tag size={12} className="text-emerald-400" /> GitHub Releases</div>
                Every deployment creates a release with auto-generated notes. Open <a href={RELEASES_URL} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200">{RELEASES_URL.replace('https://', '')}</a>.
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><Rocket size={12} className="text-emerald-400" /> Actions</div>
                Each run shows the build number, commit and deployment result. Open <a href={ACTIONS_URL} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200">{ACTIONS_URL.replace('https://', '')}</a>.
              </div>
            </div>
          </Panel>
        </>
      )}

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-[10.5px] leading-relaxed text-slate-500">
        <b className="text-slate-300">ENVIS Region VII</b> · {VERSION_LABEL} · Copyright © 2026 Kent Agbayani (K3nt-Bytes) ·
        {' '}<a href={`mailto:${DEVELOPER.email}`} className="text-emerald-300 hover:text-emerald-200">{DEVELOPER.email}</a> ·
        {' '}<a href={EMB_R7_URL} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200">r7.emb.gov.ph</a>
      </div>
    </div>
  );
}
