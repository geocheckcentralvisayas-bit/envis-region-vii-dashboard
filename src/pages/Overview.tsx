import { useMemo } from 'react';
import {
  Activity, ArrowRight, Building2, CalendarClock, Droplets, FileCheck2, FileWarning, FlaskConical, Layers3,
  MapPin, ShieldAlert, Sparkles, TrendingUp,
} from 'lucide-react';
import { useDashboard, useFilteredPermits, useFilteredSites, useFilteredHw, useFilteredClearances } from '../store/useDashboard';
import { DataTable, Chip, MetricRow, Panel, ProgressBar, SectionHeading, StatCard } from '../components/ui';
import { Chart, axisStyle, chartBase } from '../components/Chart';
import { MapView } from '../components/MapView';
import { MapButton } from '../components/MapButton';
import {
  GAP_META, LIFECYCLE_STYLE, QA_LABELS, RISK_LABELS, formatDate, formatNumber,
  relativeExpiry, riskColor, spatialSummary,
} from '../lib/format';
import type { Permit } from '../types';

export function OverviewPage() {
  const data = useDashboard((state) => state.data);
  const setPage = useDashboard((state) => state.setPage);
  const setSiteGap = useDashboard((state) => state.setSiteGap);
  const permits = useFilteredPermits();
  const sites = useFilteredSites();
  const hw = useFilteredHw();
  const clearances = useFilteredClearances();

  const stats = useMemo(() => {
    const active = permits.filter((permit) => permit.lifecycle === 'Active').length;
    const expiring = permits.filter((permit) => permit.lifecycle === 'Expiring').length;
    const expired = permits.filter((permit) => permit.lifecycle === 'Expired').length;
    const both = sites.filter((site) => site.matchType === 'both').length;
    const gaps = permits.filter((permit) => permit.qa.some((flag) => flag !== 'duplicate_source')).length;
    return { active, expiring, expired, both, gaps };
  }, [permits, sites]);

  const yearSeries = useMemo(() => {
    const years = data?.meta.years ?? [];
    const dp = new Map<number, number>();
    const pto = new Map<number, number>();
    for (const permit of permits) {
      const bucket = permit.type === 'DP' ? dp : pto;
      bucket.set(permit.year, (bucket.get(permit.year) ?? 0) + 1);
    }
    return {
      years,
      dp: years.map((year) => dp.get(year) ?? 0),
      pto: years.map((year) => pto.get(year) ?? 0),
    };
  }, [permits, data]);

  const lifecycleOption = useMemo(() => {
    const order = ['Active', 'Expiring', 'Expired', 'Unknown'] as const;
    const series = order.map((status) => ({
      name: status,
      value: permits.filter((permit) => permit.lifecycle === status).length,
    }));
    return {
      ...chartBase({ tooltip: { trigger: 'item', backgroundColor: 'rgba(5,14,11,.96)', borderColor: 'rgba(52,211,153,.24)', textStyle: { color: '#e2e8f0', fontSize: 11 } } }),
      legend: {
        bottom: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#94a3b8', fontSize: 10 },
      },
      series: [
        {
          type: 'pie',
          radius: ['52%', '76%'],
          center: ['50%', '43%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#07110e', borderWidth: 3 },
          label: { show: false },
          emphasis: { scaleSize: 4, label: { show: false } },
          data: series.map((entry) => ({
            ...entry,
            itemStyle: { color: LIFECYCLE_STYLE[entry.name].chart },
          })),
        },
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '36%',
          style: {
            text: formatNumber(permits.length),
            fill: '#f8fafc',
            font: '700 22px Inter',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          left: 'center',
          top: '49%',
          style: {
            text: 'permits',
            fill: '#64748b',
            font: '500 9px Inter',
            textAlign: 'center',
          },
        },
      ],
    };
  }, [permits]);

  const lguOption = useMemo(() => {
    const counts = new Map<string, { name: string; count: number; province: string }>();
    for (const permit of permits) {
      if (!permit.municipality) continue;
      const key = `${permit.municipality}|${permit.province}`;
      const entry = counts.get(key) ?? { name: permit.municipality, count: 0, province: permit.province };
      entry.count += 1;
      counts.set(key, entry);
    }
    const top = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 10).reverse();
    return {
      ...chartBase({ tooltip: { ...chartBase().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } } }),
      grid: { left: 8, right: 26, top: 6, bottom: 4, containLabel: true },
      xAxis: { type: 'value', ...axisStyle(), axisLabel: { color: '#64748b', fontSize: 9.5 } },
      yAxis: {
        type: 'category',
        data: top.map((entry) => entry.name),
        ...axisStyle({ splitLine: { show: false } }),
        axisLabel: { color: '#94a3b8', fontSize: 9.5, width: 92, overflow: 'truncate' },
      },
      series: [
        {
          type: 'bar',
          data: top.map((entry) => entry.count),
          barMaxWidth: 12,
          itemStyle: { color: '#34d399', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: '#8ea9a1', fontSize: 9.5 },
        },
      ],
    };
  }, [permits]);

  const gapRows = useMemo(() => {
    const order = ['both-active', 'dp-active', 'pto-active', 'both-inactive', 'dp-only', 'pto-only', 'hw-only'] as const;
    const counts = new Map<string, number>();
    for (const site of sites) counts.set(site.gap, (counts.get(site.gap) ?? 0) + 1);
    const max = Math.max(1, ...counts.values());
    return order.map((gap) => ({ gap, meta: GAP_META[gap], count: counts.get(gap) ?? 0, max }));
  }, [sites]);

  const riskRows = useMemo(() => {
    const buckets = [
      { label: 'No flags', min: 0, max: 0, color: '#475569' },
      { label: 'Low · 1–3', min: 1, max: 3, color: '#eab308' },
      { label: 'Moderate · 4–6', min: 4, max: 6, color: '#f59e0b' },
      { label: 'High · 7–8', min: 7, max: 8, color: '#f97316' },
      { label: 'Extreme · 9–10', min: 9, max: 10, color: '#dc2626' },
    ];
    return buckets.map((bucket) => ({
      ...bucket,
      count: sites.filter((site) => site.risk >= bucket.min && site.risk <= bucket.max).length,
    }));
  }, [sites]);

  const expiring = useMemo(
    () =>
      permits
        .filter((permit) => permit.expiry)
        .sort((a, b) => (a.expiry ?? '').localeCompare(b.expiry ?? ''))
        .filter((permit) => permit.lifecycle === 'Expiring' || permit.lifecycle === 'Expired')
        .slice(0, 8),
    [permits],
  );

  const spatialCounts = useMemo(() => {
    const counts = { flood: 0, slide: 0, pa: 0, ws: 0, lc: 0 };
    for (const permit of permits) {
      if (permit.spatial?.flood) counts.flood += 1;
      if (permit.spatial?.slide) counts.slide += 1;
      if (permit.spatial?.pa) counts.pa += 1;
      if (permit.spatial?.ws) counts.ws += 1;
      if (permit.spatial?.lc) counts.lc += 1;
    }
    return counts;
  }, [permits]);

  const qaTop = useMemo(
    () =>
      (data?.meta.qa ?? [])
        .filter((entry) => !['duplicate_source', 'out_of_scope'].includes(entry.name))
        .slice(0, 6),
    [data],
  );

  const wasteTop = useMemo(() => {
    const counts = new Map<string, number>();
    for (const registration of hw) {
      for (const [code, count] of Object.entries(registration.wasteRecordCounts ?? {})) {
        counts.set(code, (counts.get(code) ?? 0) + count);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).reverse();
  }, [hw]);

  const clearanceLgus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const clearance of clearances) {
      if (!clearance.municipality) continue;
      counts.set(clearance.municipality, (counts.get(clearance.municipality) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).reverse();
  }, [clearances]);

  if (!data) return null;

  return (
    <div className="animate-fade-up space-y-5">
      <SectionHeading
        eyebrow="Regional monitoring"
        title="Environmental permits at a glance"
        description="Intercrossed discharge permits (DP) and permits to operate (PTO) for establishments in Cebu and Bohol, screened against DENR hazard and protected-area layers."
        action={
          <>
            <button type="button" className="btn" onClick={() => setPage('renewal')}>
              <CalendarClock size={13} /> Renewal watch
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setPage('map')}>
              <MapPin size={13} /> Open map
            </button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Permit records"
          value={formatNumber(permits.length)}
          hint={`${formatNumber(stats.active)} active · ${formatNumber(stats.expiring)} expiring`}
          icon={<Droplets size={17} />}
          accent="emerald"
          onClick={() => setPage('dp')}
          footer={<div className="flex items-center gap-1 text-[10px] text-slate-500"><Activity size={10} className="text-emerald-400" /> {formatNumber(data.meta.totals.dp)} DP · {formatNumber(data.meta.totals.pto)} PTO</div>}
        />
        <StatCard
          label="Establishments"
          value={formatNumber(sites.length)}
          hint={`${formatNumber(stats.both)} matched on both registers`}
          icon={<Building2 size={17} />}
          accent="sky"
          onClick={() => setPage('sites')}
          footer={
            <div className="flex items-center gap-1.5">
              <ProgressBar value={stats.both} max={Math.max(1, sites.length)} tone="bg-sky-400" />
              <span className="shrink-0 text-[9.5px] text-slate-500">{sites.length ? Math.round((stats.both / sites.length) * 100) : 0}%</span>
            </div>
          }
        />
        <StatCard
          label="Both active"
          value={formatNumber(sites.filter((site) => site.gap === 'both-active').length)}
          hint="Active DP and active PTO"
          icon={<Sparkles size={17} />}
          accent="violet"
          onClick={() => { setSiteGap('both-active'); setPage('sites'); }}
          footer={<div className="text-[10px] text-slate-500">{formatNumber(sites.filter((site) => site.gap === 'dp-active' || site.gap === 'pto-active').length)} partial-coverage sites</div>}
        />
        <StatCard
          label="Expiring ≤ 90 days"
          value={formatNumber(stats.expiring)}
          hint={`${formatNumber(stats.expired)} already lapsed`}
          icon={<CalendarClock size={17} />}
          accent="amber"
          onClick={() => setPage('renewal')}
          footer={<div className="text-[10px] text-slate-500">Based on expiry date vs. {data.meta.referenceDate}</div>}
        />
        <StatCard
          label="Spatial exposure"
          value={formatNumber(data.meta.totals.riskSites)}
          hint="Sites with risk index ≥ 4"
          icon={<ShieldAlert size={17} />}
          accent="rose"
          onClick={() => setPage('screening')}
          footer={<div className="text-[10px] text-slate-500">{formatNumber(spatialCounts.flood)} flood · {formatNumber(spatialCounts.slide)} landslide flags</div>}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="HW generators" value={formatNumber(data.meta.totals.hwRegistrations)} hint={`${formatNumber(data.meta.totals.hwOnlySites)} HW-only sites`} icon={<FlaskConical size={17} />} accent="amber" onClick={() => setPage('hw')} />
        <StatCard label="ECC clearances" value={formatNumber(data.meta.totals.eccClearances)} hint="Environmental Compliance Certificates" icon={<FileCheck2 size={17} />} accent="emerald" onClick={() => setPage('clearances')} />
        <StatCard label="CNC clearances" value={formatNumber(data.meta.totals.cncClearances)} hint="Certificates of Non-Coverage" icon={<FileCheck2 size={17} />} accent="sky" onClick={() => setPage('clearances')} />
        <StatCard label="Clearance sites" value={formatNumber(data.meta.totals.clearanceSites)} hint="Establishments with ECC / CNC references" icon={<FileCheck2 size={17} />} accent="violet" onClick={() => setPage('clearances')} />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Permit issuance by year"
          subtitle="Stacked DP and PTO records after de-duplication"
          action={<Chip tone="emerald"><TrendingUp size={10} /> {yearSeries.years.length} vintages</Chip>}
        >
          <Chart
            height={302}
            option={{
              ...chartBase(),
              legend: { top: 0, right: 6, icon: 'roundRect', itemWidth: 10, itemHeight: 6, textStyle: { color: '#94a3b8', fontSize: 10 } },
              grid: { left: 8, right: 12, top: 30, bottom: 4, containLabel: true },
              xAxis: { type: 'category', data: yearSeries.years, ...axisStyle({ splitLine: { show: false } }) },
              yAxis: { type: 'value', ...axisStyle() },
              series: [
                { name: 'DP', type: 'bar', stack: 'permits', data: yearSeries.dp, barMaxWidth: 34, itemStyle: { color: '#0ea5e9' } },
                { name: 'PTO', type: 'bar', stack: 'permits', data: yearSeries.pto, barMaxWidth: 34, itemStyle: { color: '#34d399', borderRadius: [4, 4, 0, 0] } },
              ],
            }}
          />
        </Panel>

        <Panel title="Permit lifecycle" subtitle="Current status against the reference date">
          <Chart height={302} option={lifecycleOption} />
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Establishment footprint"
          subtitle={`${formatNumber(sites.filter((site) => site.lat !== null).length)} geocoded sites · clustered`}
          action={<button type="button" className="btn btn-xs" onClick={() => setPage('map')}>Expand <ArrowRight size={11} /></button>}
          bodyClassName="p-0"
        >
          <div className="p-3">
            <MapView height={320} initialMode="companies" initialBasemap="streets" showLayerPanel={false} enableFocus={false} />
          </div>
        </Panel>

        <Panel
          title="DP / PTO coverage"
          subtitle="How establishment records pair across the two registers"
          action={<button type="button" className="btn btn-xs" onClick={() => setPage('sites')}>All sites <ArrowRight size={11} /></button>}
        >
          <div className="space-y-3">
            {gapRows.map((row) => (
              <button key={row.gap} type="button" className="w-full text-left" onClick={() => { setSiteGap(row.gap); setPage('sites'); }}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11.5px] text-slate-300">
                    <span className="h-2 w-2 rounded-full" style={{ background: row.meta.color }} />
                    {row.meta.label}
                  </span>
                  <span className="font-mono text-[10.5px] text-slate-500">{formatNumber(row.count)}</span>
                </div>
                <ProgressBar value={row.count} max={row.max} color={row.meta.color} />
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-[10.5px] leading-relaxed text-slate-500">
            <b className="text-slate-300">Intercross note.</b> Matching uses normalised establishment name within the same LGU, then alias and fuzzy checks (≥ 88% token similarity) with branch-marker and location guards.
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Hazardous waste footprint" subtitle="Most reported waste codes in the current filter">
          <Chart
            height={260}
            option={{
              ...chartBase({ tooltip: { ...chartBase().tooltip, trigger: 'axis' } }),
              grid: { left: 8, right: 16, top: 6, bottom: 4, containLabel: true },
              xAxis: { type: 'value', ...axisStyle() },
              yAxis: { type: 'category', data: wasteTop.map(([label]) => label), ...axisStyle({ splitLine: { show: false } }), axisLabel: { color: '#94a3b8', fontSize: 9 } },
              series: [{ type: 'bar', data: wasteTop.map(([, value]) => value), barMaxWidth: 12, itemStyle: { color: '#f59e0b', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#8ea9a1', fontSize: 9 } }],
            }}
          />
        </Panel>
        <Panel title="Clearance coverage" subtitle="Top LGUs by ECC / CNC references">
          <Chart
            height={260}
            option={{
              ...chartBase({ tooltip: { ...chartBase().tooltip, trigger: 'axis' } }),
              grid: { left: 8, right: 16, top: 6, bottom: 4, containLabel: true },
              xAxis: { type: 'value', ...axisStyle() },
              yAxis: { type: 'category', data: clearanceLgus.map(([label]) => label), ...axisStyle({ splitLine: { show: false } }), axisLabel: { color: '#94a3b8', fontSize: 9, width: 110, overflow: 'truncate' } },
              series: [{ type: 'bar', data: clearanceLgus.map(([, value]) => value), barMaxWidth: 12, itemStyle: { color: '#38bdf8', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#8ea9a1', fontSize: 9 } }],
            }}
          />
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Top cities & municipalities" subtitle="By number of permit records in the current filter">
          <Chart height={290} option={lguOption} />
        </Panel>

        <Panel title="Spatial risk profile" subtitle="Aggregated exposure index for matched establishments">
          <Chart
            height={290}
            option={{
              ...chartBase({ tooltip: { ...chartBase().tooltip, trigger: 'axis' } }),
              grid: { left: 8, right: 16, top: 12, bottom: 4, containLabel: true },
              xAxis: { type: 'category', data: riskRows.map((row) => row.label), ...axisStyle({ splitLine: { show: false } }), axisLabel: { color: '#7d948d', fontSize: 9, interval: 0, rotate: 16 } },
              yAxis: { type: 'value', ...axisStyle() },
              series: [
                {
                  type: 'bar',
                  data: riskRows.map((row) => ({ value: row.count, itemStyle: { color: row.color, borderRadius: [4, 4, 0, 0] } })),
                  barMaxWidth: 30,
                  label: { show: true, position: 'top', color: '#94a3b8', fontSize: 9.5 },
                },
              ],
            }}
          />
          <div className="mt-2 grid grid-cols-2 gap-2 text-[10.5px]">
            {[
              ['Flood zone', spatialCounts.flood],
              ['Landslide zone', spatialCounts.slide],
              ['Protected area', spatialCounts.pa],
              ['Watershed', spatialCounts.ws],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
                <div className="text-slate-500">{label}</div>
                <div className="font-mono text-[11px] text-slate-200">{formatNumber(Number(value))}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Quality watchlist"
          subtitle="Records needing follow-up in the source registers"
          action={<button type="button" className="btn btn-xs" onClick={() => setPage('quality')}>Details <ArrowRight size={11} /></button>}
        >
          <div className="space-y-2.5">
            {qaTop.map((entry) => (
              <MetricRow
                key={entry.name}
                label={QA_LABELS[entry.name] ?? entry.name}
                value={entry.count}
                max={Math.max(1, qaTop[0]?.count ?? 1)}
                tone={entry.count > 500 ? 'bg-rose-400' : entry.count > 100 ? 'bg-amber-400' : 'bg-sky-400'}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-2.5 text-[10.5px] text-amber-200/80">
            <FileWarning size={14} className="shrink-0" />
            {formatNumber(data.meta.totals.skippedRows)} source rows skipped · {formatNumber(data.meta.totals.duplicates)} duplicates merged
          </div>
        </Panel>
      </div>

      <Panel
        title="Watchlist · expiring and lapsed permits"
        subtitle="Nearest expiry dates first; use Renewal Watch for the full list"
        action={<button type="button" className="btn btn-xs" onClick={() => setPage('renewal')}>Open watchlist <ArrowRight size={11} /></button>}
        bodyClassName="p-3"
      >
        <DataTable<Permit>
          rows={expiring}
          rowKey={(row) => row.id}
          initialSort={{ key: 'expiry', direction: 'asc' }}
          maxHeight="max-h-[330px]"
          onRowClick={(row) => row.siteId && useDashboard.getState().selectSite(row.siteId)}
          columns={[
            {
              key: 'company',
              header: 'Establishment',
              sortValue: (row) => row.company,
              render: (row) => (
                <div className="min-w-[200px]">
                  <div className="font-medium text-slate-200">{row.company}</div>
                  <div className="text-[10.5px] text-slate-500">{row.municipality}, {row.province}</div>
                </div>
              ),
            },
            { key: 'type', header: 'Type', render: (row) => <Chip tone={row.type === 'DP' ? 'sky' : 'violet'}>{row.type}</Chip> },
            { key: 'permitNo', header: 'Permit no.', render: (row) => <span className="font-mono text-[10.5px] text-slate-400">{row.permitNo}</span> },
            { key: 'expiry', header: 'Expiry', sortValue: (row) => row.expiry ?? '', render: (row) => <span className="whitespace-nowrap">{formatDate(row.expiry)}</span> },
            {
              key: 'remaining',
              header: 'Remaining',
              render: (row) => (
                <span className={row.lifecycle === 'Expired' ? 'text-rose-300' : 'text-amber-300'}>{relativeExpiry(row.expiry)}</span>
              ),
            },
            {
              key: 'risk',
              header: 'Risk',
              render: (row) => (
                <span className="inline-flex items-center gap-1.5 text-[10.5px]" style={{ color: riskColor(row.risk ?? 0) }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" /> {RISK_LABELS[row.risk ?? 0]}
                </span>
              ),
            },
            {
              key: 'spatial',
              header: 'Spatial flags',
              render: (row) => <span className="text-[10.5px] text-slate-500">{spatialSummary(row.spatial)}</span>,
            },
            {
              key: 'map',
              header: '',
              render: (row) => <MapButton lat={row.lat} lon={row.lon} label={`${row.company} · ${row.permitNo}`} siteId={row.siteId ?? null} />,
            },
          ]}
          empty={<div className="py-8 text-center text-[12px] text-slate-500">No expiring or lapsed permits in the current filter.</div>}
        />
      </Panel>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Source registers" subtitle="Google Sheets tabs compiled into this build" className="xl:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {data.meta.sources.tabs.slice(0, 14).map((tab) => (
              <div key={tab.key} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-[11px]">
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-300">{tab.sheet}</div>
                  <div className="text-[9.5px] text-slate-600">{tab.sheet} · {tab.rows} rows</div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-emerald-300/80">{formatNumber(tab.rows)}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Layer library" subtitle="Spatial bundle available to the map" action={<Layers3 size={14} className="text-slate-500" />}>
          <div className="space-y-2">
            {data.layers.layers.map((layer) => (
              <div key={layer.id} className="flex items-center justify-between gap-2 text-[11px]">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: layer.classMeta?.[layer.classes[0]]?.color ?? layer.style.color ?? '#34d399' }} />
                  <span className="truncate text-slate-300">{layer.name}</span>
                </div>
                <span className="shrink-0 font-mono text-[9.5px] text-slate-600">{layer.count.toLocaleString()} feat.</span>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-primary mt-3 w-full" onClick={() => setPage('spatial')}>
            <Layers3 size={13} /> Explore overlays
          </button>
        </Panel>
      </div>
    </div>
  );
}
