import { useMemo } from 'react';
import { Droplets, MapPin, ShieldAlert, Trees, Waves } from 'lucide-react';
import { useDashboard, useFilteredPermits, useFilteredSites } from '../store/useDashboard';
import { Chip, DataTable, MetricRow, Panel, SectionHeading, StatCard, type Column } from '../components/ui';
import { MapButton } from '../components/MapButton';
import { Chart, axisStyle, chartBase } from '../components/Chart';
import { RISK_LABELS, formatNumber, riskColor } from '../lib/format';
import type { Site } from '../types';

const FLOOD_ORDER = ['VHF', 'HF', 'MF', 'LF'];
const SLIDE_ORDER = ['VHL', 'HL', 'ML', 'LL', 'DF'];
const FALLBACK_COLORS: Record<string, string> = {
  VHF: '#991b1b', HF: '#ef4444', MF: '#f59e0b', LF: '#fbbf24',
  VHL: '#7f1d1d', HL: '#dc2626', ML: '#f97316', LL: '#fbbf24', DF: '#facc15',
};

export function ScreeningPage() {
  const data = useDashboard((state) => state.data);
  const permits = useFilteredPermits();
  const sites = useFilteredSites();
  const selectSite = useDashboard((state) => state.selectSite);

  const classes = useMemo(() => {
    const floodLayer = data?.layers.layers.find((layer) => layer.id === 'flooding');
    const slideLayer = data?.layers.layers.find((layer) => layer.id === 'landslide');
    return { floodLayer, slideLayer };
  }, [data]);

  const floodRows = useMemo(() => {
    const meta = classes.floodLayer?.classMeta ?? null;
    return FLOOD_ORDER.map((code) => ({
      code,
      label: meta?.[code]?.label ?? code,
      color: meta?.[code]?.color ?? FALLBACK_COLORS[code],
      count: permits.filter((permit) => permit.spatial?.flood === code).length,
    }));
  }, [permits, classes]);

  const slideRows = useMemo(() => {
    const meta = classes.slideLayer?.classMeta ?? null;
    return SLIDE_ORDER.map((code) => ({
      code,
      label: meta?.[code]?.label ?? code,
      color: meta?.[code]?.color ?? FALLBACK_COLORS[code],
      count: permits.filter((permit) => permit.spatial?.slide === code).length,
    }));
  }, [permits, classes]);

  const stats = useMemo(() => {
    const flood = permits.filter((permit) => permit.spatial?.flood).length;
    const slide = permits.filter((permit) => permit.spatial?.slide).length;
    const pa = permits.filter((permit) => permit.spatial?.pa).length;
    const ws = permits.filter((permit) => permit.spatial?.ws).length;
    const both = permits.filter((permit) => permit.spatial?.flood && permit.spatial?.slide).length;
    return { flood, slide, pa, ws, both };
  }, [permits]);

  const riskRows = useMemo(() => {
    const buckets = [
      { label: '0 · None', min: 0, max: 0, color: '#475569' },
      { label: '1–3 · Low', min: 1, max: 3, color: '#eab308' },
      { label: '4–6 · Moderate', min: 4, max: 6, color: '#f59e0b' },
      { label: '7–8 · High', min: 7, max: 8, color: '#f97316' },
      { label: '9–10 · Extreme', min: 9, max: 10, color: '#dc2626' },
    ];
    return buckets.map((bucket) => ({
      ...bucket,
      count: sites.filter((site) => site.risk >= bucket.min && site.risk <= bucket.max).length,
    }));
  }, [sites]);

  const lguRows = useMemo(() => {
    const map = new Map<string, { lgu: string; province: string; exposed: number; high: number; total: number }>();
    for (const permit of permits) {
      if (!permit.municipality) continue;
      const key = `${permit.municipality}|${permit.province}`;
      const entry = map.get(key) ?? { lgu: permit.municipality, province: permit.province, exposed: 0, high: 0, total: 0 };
      entry.total += 1;
      if (permit.risk && permit.risk > 0) entry.exposed += 1;
      if ((permit.risk ?? 0) >= 4) entry.high += 1;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.high - a.high || b.exposed - a.exposed).slice(0, 10);
  }, [permits]);

  const highRiskSites = useMemo(
    () => sites.filter((site) => site.risk >= 4).sort((a, b) => b.risk - a.risk || a.company.localeCompare(b.company)),
    [sites],
  );

  const columns: Column<Site>[] = [
    {
      key: 'company',
      header: 'Establishment',
      sortValue: (row) => row.company,
      render: (row) => (
        <div className="min-w-[210px] max-w-[330px]">
          <div className="truncate font-medium text-slate-200">{row.company}</div>
          <div className="truncate text-[10px] text-slate-500">{[row.barangay, row.municipality, row.province].filter(Boolean).join(', ')}</div>
        </div>
      ),
    },
    {
      key: 'risk',
      header: 'Risk index',
      sortValue: (row) => row.risk,
      render: (row) => (
        <div className="flex min-w-[110px] items-center gap-2">
          <span className="font-mono text-[11px] font-semibold" style={{ color: riskColor(row.risk) }}>{row.risk}/10</span>
          <span className="text-[10px] text-slate-500">{RISK_LABELS[row.risk]}</span>
        </div>
      ),
    },
    {
      key: 'flood',
      header: 'Flood',
      sortValue: (row) => row.spatial?.flood ?? '',
      render: (row) => <FlagValue value={row.spatial?.flood} rows={floodRows} />,
    },
    {
      key: 'slide',
      header: 'Landslide',
      sortValue: (row) => row.spatial?.slide ?? '',
      render: (row) => <FlagValue value={row.spatial?.slide} rows={slideRows} />,
    },
    {
      key: 'pa',
      header: 'Protected area',
      render: (row) => (row.spatial?.pa ? <Chip tone="emerald">Inside</Chip> : <span className="text-[10.5px] text-slate-600">—</span>),
    },
    {
      key: 'ws',
      header: 'Watershed',
      render: (row) => (row.spatial?.ws ? <span className="max-w-[150px] truncate text-[10.5px] text-cyan-300">{row.spatial.ws}</span> : <span className="text-[10.5px] text-slate-600">—</span>),
    },
    {
      key: 'coverage',
      header: 'DP / PTO',
      sortValue: (row) => row.dpCount + row.ptoCount,
      render: (row) => (
        <span className="whitespace-nowrap font-mono text-[10.5px] text-slate-400">{row.dpCount} / {row.ptoCount}</span>
      ),
    },
    {
      key: 'map',
      header: '',
      render: (row) => <MapButton lat={row.lat} lon={row.lon} label={row.company} siteId={row.id} />,
    },
  ];

  if (!data) return null;

  return (
    <div className="animate-fade-up space-y-4">
      <SectionHeading
        eyebrow="Environmental exposure"
        title="Spatial screening"
        description="Point-in-polygon screening of every geocoded permit against DENR flood, landslide, protected-area, watershed, land-cover and land-classification layers. The risk index combines hazard severity with protected-area and watershed constraints."
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip tone="rose"><ShieldAlert size={10} /> {formatNumber(sites.filter((site) => site.risk >= 4).length)} high-risk sites</Chip>
            <Chip tone="slate">{formatNumber(data.meta.totals.screened)} permits screened</Chip>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Flood exposure" value={formatNumber(stats.flood)} hint={`${formatNumber(stats.both)} also in a landslide zone`} icon={<Waves size={17} />} accent="sky" footer={<div className="text-[10px] text-slate-500">Any flood susceptibility class</div>} />
        <StatCard label="Landslide exposure" value={formatNumber(stats.slide)} hint="Any landslide susceptibility class" icon={<ShieldAlert size={17} />} accent="rose" />
        <StatCard label="Protected areas" value={formatNumber(stats.pa)} hint="Permits inside NIPAS / protected areas" icon={<Trees size={17} />} accent="emerald" footer={<div className="text-[10px] text-slate-500">Adds +2 to the risk index</div>} />
        <StatCard label="Watersheds" value={formatNumber(stats.ws)} hint="Permits inside declared watersheds" icon={<Droplets size={17} />} accent="violet" footer={<div className="text-[10px] text-slate-500">Adds +1 to the risk index</div>} />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Flood susceptibility" subtitle="Highest class per permit">
          <div className="space-y-3">
            {floodRows.map((row) => (
              <MetricRow key={row.code} label={<span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: row.color }} />{row.label} <span className="font-mono text-[9.5px] text-slate-600">{row.code}</span></span>} value={row.count} max={Math.max(1, stats.flood)} color={row.color} />
            ))}
          </div>
        </Panel>

        <Panel title="Landslide susceptibility" subtitle="Highest class per permit">
          <div className="space-y-3">
            {slideRows.map((row) => (
              <MetricRow key={row.code} label={<span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: row.color }} />{row.label} <span className="font-mono text-[9.5px] text-slate-600">{row.code}</span></span>} value={row.count} max={Math.max(1, stats.slide)} color={row.color} />
            ))}
          </div>
        </Panel>

        <Panel title="Risk index distribution" subtitle="Sites grouped by combined exposure">
          <Chart
            height={260}
            option={{
              ...chartBase(),
              grid: { left: 8, right: 14, top: 20, bottom: 4, containLabel: true },
              xAxis: { type: 'category', data: riskRows.map((row) => row.label), ...axisStyle({ splitLine: { show: false } }), axisLabel: { color: '#7d948d', fontSize: 8.5, interval: 0, rotate: 18 } },
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
          <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-[10px] leading-relaxed text-slate-500">
            Risk = flood rank + landslide rank + 2 (protected area) + 1 (watershed), capped at 10.
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Most exposed LGUs" subtitle="Ranked by permits with risk index ≥ 4">
          <div className="space-y-2.5">
            {lguRows.map((row) => (
              <div key={`${row.lgu}-${row.province}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11.5px] text-slate-300">
                    <MapPin size={10} className="text-slate-600" /> <span className="truncate">{row.lgu}</span>
                    <span className="text-[9.5px] text-slate-600">{row.province}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 w-32 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-rose-400" style={{ width: `${row.total ? Math.min(100, (row.high / row.total) * 100) : 0}%` }} />
                    </div>
                    <span className="text-[9.5px] text-slate-600">{formatNumber(row.exposed)} exposed of {formatNumber(row.total)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[13px] font-semibold text-rose-300">{formatNumber(row.high)}</div>
                  <div className="text-[8.5px] uppercase tracking-wider text-slate-600">high risk</div>
                </div>
              </div>
            ))}
            {!lguRows.length && <div className="py-6 text-center text-[11px] text-slate-600">No exposed LGUs in the current filter.</div>}
          </div>
        </Panel>

        <Panel title="Screening coverage" subtitle="Geocoded permits and their layer hits">
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Coordinates available', permits.filter((permit) => permit.lat !== null).length],
              ['Screened against layers', permits.filter((permit) => permit.spatial).length],
              ['No spatial hit', permits.filter((permit) => permit.lat !== null && !permit.spatial).length],
              ['No coordinates', permits.filter((permit) => permit.lat === null).length],
              ['Flood + landslide', stats.both],
              ['Protected area + watershed', permits.filter((permit) => permit.spatial?.pa && permit.spatial?.ws).length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <div className="text-[9.5px] uppercase tracking-[0.1em] text-slate-600">{label}</div>
                <div className="mt-0.5 font-mono text-[15px] text-slate-200">{formatNumber(Number(value))}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-sky-400/15 bg-sky-400/[0.045] p-3 text-[10.5px] leading-relaxed text-sky-100/70">
            Coordinates flagged as suspect, invalid or swapped are excluded from screening. Land-cover and land-classification layers are retained for context but do not add to the risk score.
          </div>
        </Panel>
      </div>

      <Panel bodyClassName="p-3" title="High-risk establishments" subtitle={`${formatNumber(highRiskSites.length)} sites with a risk index of 4 or higher`}>
        <DataTable<Site>
          rows={highRiskSites}
          columns={columns}
          rowKey={(row) => row.id}
          onRowClick={(row) => selectSite(row.id)}
          pageSize={25}
          maxHeight="max-h-[560px]"
          initialSort={{ key: 'risk', direction: 'desc' }}
          empty={<div className="py-12 text-center text-[12px] text-slate-500">No establishments exceed the risk threshold in this filter.</div>}
        />
      </Panel>
    </div>
  );
}

function FlagValue({ value, rows }: { value?: string; rows: { code: string; label: string; color: string }[] }) {
  if (!value) return <span className="text-[10.5px] text-slate-600">—</span>;
  const row = rows.find((entry) => entry.code === value);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10.5px]" style={{ color: row?.color ?? '#94a3b8' }}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {row?.label ?? value}
    </span>
  );
}
