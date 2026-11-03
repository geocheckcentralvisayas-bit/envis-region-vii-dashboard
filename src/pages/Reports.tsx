import { useMemo } from 'react';
import {
  AlertTriangle, Building2, CalendarClock, Download, FileJson, FileSpreadsheet,
  Layers3, Printer, ShieldAlert, Sparkles,
} from 'lucide-react';
import { requestExport } from '../lib/exportGate';
import { useDashboard, useFilteredPermits, useFilteredSites } from '../store/useDashboard';
import { Chip, Panel, SectionHeading } from '../components/ui';
import {
  GAP_META, QA_LABELS, RISK_LABELS, downloadCsv, downloadJson, formatDate,
  formatDateTime, formatNumber, spatialSummary,
} from '../lib/format';
import type { SiteGap } from '../types';

export function ReportsPage() {
  const data = useDashboard((state) => state.data);
  const filters = useDashboard((state) => state.filters);
  const permits = useFilteredPermits();
  const sites = useFilteredSites();

  const summary = useMemo(() => {
    const expiry = (status: string) => permits.filter((permit) => permit.lifecycle === status).length;
    const both = sites.filter((site) => site.matchType === 'both').length;
    const highRisk = sites.filter((site) => site.risk >= 4).length;
    const geocoded = sites.filter((site) => site.lat !== null).length;
    const coverage = (['both-active', 'dp-active', 'pto-active', 'both-inactive', 'dp-only', 'pto-only', 'hw-only'] as SiteGap[]).map((gap) => ({
      gap,
      label: GAP_META[gap].label,
      count: sites.filter((site) => site.gap === gap).length,
    }));
    return { active: expiry('Active'), expiring: expiry('Expiring'), expired: expiry('Expired'), unknown: expiry('Unknown'), both, highRisk, geocoded, coverage };
  }, [permits, sites]);

  const topLgus = useMemo(() => {
    const map = new Map<string, { lgu: string; province: string; permits: number; sites: number }>();
    for (const permit of permits) {
      if (!permit.municipality) continue;
      const key = `${permit.municipality}|${permit.province}`;
      const entry = map.get(key) ?? { lgu: permit.municipality, province: permit.province, permits: 0, sites: 0 };
      entry.permits += 1;
      map.set(key, entry);
    }
    for (const site of sites) {
      if (!site.municipality) continue;
      const key = `${site.municipality}|${site.province}`;
      const entry = map.get(key);
      if (entry) entry.sites += 1;
    }
    return [...map.values()].sort((a, b) => b.permits - a.permits).slice(0, 12);
  }, [permits, sites]);

  const filterLabel = [
    filters.year === 'all' ? 'All years' : `Year ${filters.year}`,
    filters.province === 'all' ? 'All provinces' : filters.province,
    filters.lifecycle === 'all' ? 'All statuses' : filters.lifecycle,
    filters.type === 'all' ? 'DP + PTO' : `${filters.type} only`,
    filters.scope === 'in' ? 'In scope' : filters.scope === 'out' ? 'Out of scope' : 'All regions',
    filters.search ? `Search “${filters.search}”` : null,
  ].filter(Boolean).join(' · ');

  const exportPermits = () =>
    downloadCsv(
      `envis-permits-${new Date().toISOString().slice(0, 10)}.csv`,
      permits.map((permit) => ({
        permit_no: permit.permitNo, application_no: permit.appNo, type: permit.type, year: permit.year,
        company: permit.company, barangay: permit.barangay, municipality: permit.municipality, province: permit.province,
        address: permit.address, issued: permit.issued ?? '', expiry: permit.expiry ?? '', lifecycle: permit.lifecycle,
        filing: permit.sourceStatus, industry: permit.industry, psic: permit.psic, ecc_cnc: permit.eccNo,
        waterbody: permit.waterbody, wastewater_type: permit.wastewater, allowed_volume: permit.volume,
        pco: permit.pco, latitude: permit.lat ?? '', longitude: permit.lon ?? '', coord_status: permit.coordStatus,
        spatial_flags: spatialSummary(permit.spatial), risk: permit.risk ?? 0, qa_flags: permit.qa.join('|'),
        source_sheet: permit.sourceSheet, source_row: permit.sourceRow,
      })),
    );

  const exportSites = () =>
    downloadCsv(
      `envis-sites-${new Date().toISOString().slice(0, 10)}.csv`,
      sites.map((site) => ({
        site_id: site.id, establishment: site.company, barangay: site.barangay, municipality: site.municipality,
        province: site.province, address: site.address, dp_count: site.dpCount, pto_count: site.ptoCount,
        coverage: site.gap, match_type: site.matchType, match_method: site.matchMethod,
        latest_issued: site.latestIssued ?? '', dp_expiry: site.dpExpiry ?? '', pto_expiry: site.ptoExpiry ?? '',
        active_dp: site.activeDP, active_pto: site.activePTO, industry: site.industry,
        spatial_flags: spatialSummary(site.spatial), risk: site.risk,
        latitude: site.lat ?? '', longitude: site.lon ?? '', scope: site.scope,
      })),
    );

  const exportScreening = () =>
    downloadCsv(
      `envis-spatial-screening-${new Date().toISOString().slice(0, 10)}.csv`,
      permits
        .filter((permit) => permit.lat !== null)
        .map((permit) => ({
          permit_no: permit.permitNo, type: permit.type, company: permit.company,
          municipality: permit.municipality, province: permit.province,
          latitude: permit.lat ?? '', longitude: permit.lon ?? '',
          flood: permit.spatial?.flood ?? '', landslide: permit.spatial?.slide ?? '',
          protected_area: permit.spatial?.pa ? 'yes' : '', watershed: permit.spatial?.ws ?? '',
          land_cover: permit.spatial?.lc ?? '', land_classification: permit.spatial?.land ?? '',
          risk_index: permit.risk ?? 0, risk_label: RISK_LABELS[permit.risk ?? 0] ?? '',
        })),
    );

  const exportQuality = () =>
    data && downloadJson(`envis-data-quality-${new Date().toISOString().slice(0, 10)}.json`, data.quality);

  const exportSummary = () =>
    data &&
    downloadJson(`envis-summary-${new Date().toISOString().slice(0, 10)}.json`, {
      generatedAt: new Date().toISOString(),
      referenceDate: data.meta.referenceDate,
      filters,
      totals: data.meta.totals,
      filtered: {
        permits: permits.length,
        sites: sites.length,
        ...summary,
      },
      topLgus,
      qa: data.meta.qa,
      notes: data.meta.notes,
    });

  const exportLayers = () => data && downloadJson('envis-spatial-layer-manifest.json', data.layers);

  if (!data) return null;

  return (
    <div className="animate-fade-up space-y-4">
      <SectionHeading
        eyebrow="Reporting"
        title="Reports & export"
        description="Generate an on-screen briefing, print it, or export the filtered registers and quality artefacts for downstream analysis."
        action={
          <>
            <button type="button" className="btn" onClick={() => window.print()}>
              <Printer size={13} /> Print / PDF
            </button>
            <button type="button" className="btn btn-primary" onClick={() => requestExport(exportPermits)}>
              <Download size={13} /> Export permits
            </button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Permit register', hint: `${formatNumber(permits.length)} filtered records`, icon: FileSpreadsheet, action: exportPermits, tone: 'sky' as const },
          { title: 'Establishment register', hint: `${formatNumber(sites.length)} filtered sites`, icon: Building2, action: exportSites, tone: 'emerald' as const },
          { title: 'Spatial screening', hint: 'Hazard and risk fields', icon: ShieldAlert, action: exportScreening, tone: 'rose' as const },
          { title: 'Quality artefacts', hint: 'Audit, review, duplicates', icon: FileJson, action: exportQuality, tone: 'amber' as const },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              type="button"
              onClick={card.action}
              className="card card-hover flex items-center gap-3 p-4 text-left"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-slate-200">{card.title}</div>
                <div className="text-[10px] text-slate-500">{card.hint}</div>
              </div>
              <Download size={13} className="shrink-0 text-slate-600" />
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Briefing preview"
          subtitle="What will print with the current filters"
          action={<Chip tone="emerald"><Sparkles size={10} /> Live</Chip>}
        >
          <div className="space-y-4">
            <div className="border-b border-white/[0.06] pb-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400/70">DENR-EMB Region VII · ENVIS</div>
              <h2 className="mt-1 text-[19px] font-bold tracking-tight text-slate-50">Environmental permits monitoring brief</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                <span>Reference date {formatDate(data.meta.referenceDate)}</span>
                <span className="text-slate-700">·</span>
                <span>Generated {formatDateTime(new Date().toISOString())}</span>
              </div>
              <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[10px] text-slate-400">
                <b className="text-slate-300">Filters:</b> {filterLabel}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Permits', value: permits.length },
                { label: 'Establishments', value: sites.length },
                { label: 'Matched on both', value: summary.both },
                { label: 'Both active', value: summary.coverage.find((row) => row.gap === 'both-active')?.count ?? 0 },
                { label: 'Expiring ≤ 90 d', value: summary.expiring },
                { label: 'Expired', value: summary.expired },
                { label: 'High-risk sites', value: summary.highRisk },
                { label: 'Geocoded sites', value: summary.geocoded },
              ].map((entry) => (
                <div key={entry.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <div className="text-[8.5px] uppercase tracking-[0.1em] text-slate-600">{entry.label}</div>
                  <div className="mt-0.5 font-mono text-[16px] font-semibold text-slate-100">{formatNumber(entry.value)}</div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="panel-title mb-1.5">Top cities & municipalities in view</h3>
              <div className="overflow-hidden rounded-lg border border-white/[0.06]">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>City / municipality</th>
                      <th>Province</th>
                      <th className="text-right">Permits</th>
                      <th className="text-right">Sites</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLgus.map((row) => (
                      <tr key={`${row.lgu}-${row.province}`}>
                        <td className="text-slate-300">{row.lgu}</td>
                        <td className="text-slate-500">{row.province}</td>
                        <td className="text-right font-mono text-[10.5px] text-slate-300">{formatNumber(row.permits)}</td>
                        <td className="text-right font-mono text-[10.5px] text-slate-500">{formatNumber(row.sites)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 text-[10.5px] leading-relaxed text-slate-500 sm:grid-cols-2">
              <div>
                <h3 className="panel-title mb-1.5">Coverage</h3>
                <div className="space-y-1">
                  {summary.coverage.map((row) => (
                    <div key={row.gap} className="flex items-center justify-between gap-2 border-b border-white/[0.04] pb-1">
                      <span className="inline-flex items-center gap-1.5 text-slate-400"><span className="h-1.5 w-1.5 rounded-full" style={{ background: GAP_META[row.gap].color }} />{row.label}</span>
                      <span className="font-mono text-slate-300">{formatNumber(row.count)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="panel-title mb-1.5">Quality signals</h3>
                <div className="space-y-1">
                  {data.meta.qa.slice(0, 7).map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between gap-2 border-b border-white/[0.04] pb-1">
                      <span className="truncate text-slate-400">{QA_LABELS[entry.name] ?? entry.name}</span>
                      <span className="font-mono text-slate-300">{formatNumber(entry.count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="border-t border-white/[0.06] pt-3 text-[9.5px] leading-relaxed text-slate-600">
              Source: DENR-EMB Region VII discharge permit and permit-to-operate Google Sheets registers.
              Lifecycle is derived from the expiry date against the reference date. Spatial screening uses the supplied
              DENR Region VII hazard, protected-area, watershed and land-cover layers. Figures are point-in-time and
              subject to source corrections.
            </p>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Full dataset exports" subtitle="Not limited to the current filters">
            <div className="space-y-2">
              <button type="button" className="btn w-full justify-start" onClick={() => requestExport(exportQuality)}>
                <FileJson size={13} /> Quality & audit JSON
              </button>
              <button type="button" className="btn w-full justify-start" onClick={() => requestExport(exportLayers)}>
                <Layers3 size={13} /> Spatial layer manifest
              </button>
              <button type="button" className="btn w-full justify-start" onClick={exportSummary}>
                <FileJson size={13} /> Summary JSON
              </button>
            </div>
            <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-[10px] leading-relaxed text-slate-500">
              Exports preserve source fields, computed lifecycle, spatial flags and QA notes. CSV files are UTF-8 with a byte-order mark for Excel compatibility.
            </div>
          </Panel>

          <Panel title="Report pack" subtitle="Suggested sequence for a briefing">
            <ol className="space-y-2 text-[11px] text-slate-400">
              {[
                'Set the year, province and scope in the top filter bar.',
                'Open Renewal Watch and export the 90-day queue.',
                'Review Spatial Screening for high-risk establishments.',
                'Check the Data Quality review queue before publishing figures.',
                'Print this briefing or export the registers as CSV.',
              ].map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-400/10 font-mono text-[9px] text-emerald-300">{index + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Caveats" subtitle="Read before circulating">
            <div className="space-y-2 text-[10.5px] leading-relaxed text-slate-500">
              <div className="flex gap-2"><AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400/80" /><span>Permit counts reflect register rows, not unique facilities. Use establishment figures for site-level reporting.</span></div>
              <div className="flex gap-2"><CalendarClock size={13} className="mt-0.5 shrink-0 text-amber-400/80" /><span>Lifecycle depends on the reference date and may lag actual renewals filed after the workbook snapshot.</span></div>
              <div className="flex gap-2"><ShieldAlert size={13} className="mt-0.5 shrink-0 text-amber-400/80" /><span>Spatial screening is indicative; it uses simplified polygons and should not replace a site-specific technical review.</span></div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
