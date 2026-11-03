import { useMemo, useState } from 'react';
import { CalendarClock, CalendarX2, Download, FileWarning, MapPin, Search, TimerReset } from 'lucide-react';
import clsx from 'clsx';
import { requestExport } from '../lib/exportGate';
import { useDashboard, useFilteredPermits } from '../store/useDashboard';
import { Chip, DataTable, Panel, SectionHeading, StatCard, type Column } from '../components/ui';
import { MapButton } from '../components/MapButton';
import { Chart, axisStyle, chartBase } from '../components/Chart';
import {
  LIFECYCLE_STYLE, QA_LABELS, RISK_LABELS, daysUntil, downloadCsv, formatDate,
  formatNumber, riskColor, spatialSummary,
} from '../lib/format';
import type { Permit } from '../types';

const HORIZONS = [30, 60, 90, 180, 365] as const;

function dayLabel(days: number | null): string {
  if (days === null) return 'No expiry';
  if (days === 0) return 'Due today';
  if (days < 0) return `${Math.abs(days).toLocaleString()} days lapsed`;
  return `in ${days.toLocaleString()} days`;
}

export function RenewalPage() {
  const data = useDashboard((state) => state.data);
  const permits = useFilteredPermits();
  const selectSite = useDashboard((state) => state.selectSite);
  const setPage = useDashboard((state) => state.setPage);
  const [horizon, setHorizon] = useState(90);
  const [includeLapsed, setIncludeLapsed] = useState(true);
  const [search, setSearch] = useState('');

  const reference = useMemo(
    () => new Date(`${data?.meta.referenceDate ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`),
    [data],
  );

  const withDays = useMemo(
    () =>
      permits
        .filter((permit) => permit.expiry)
        .map((permit) => ({ permit, days: daysUntil(permit.expiry, reference) }))
        .filter((entry): entry is { permit: Permit; days: number } => entry.days !== null),
    [permits, reference],
  );

  const watchlist = useMemo(
    () =>
      withDays
        .filter((entry) => (includeLapsed ? entry.days <= horizon : entry.days >= 0 && entry.days <= horizon))
        .sort((a, b) => a.days - b.days),
    [withDays, horizon, includeLapsed],
  );

  const filteredWatchlist = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return watchlist;
    return watchlist.filter((entry) => {
      const permit = entry.permit;
      const site = data?.sites.find((item) => item.id === permit.siteId);
      return (
        permit.company.toLowerCase().includes(query) ||
        permit.permitNo.toLowerCase().includes(query) ||
        permit.municipality.toLowerCase().includes(query) ||
        (permit.eccNo ?? '').toLowerCase().includes(query) ||
        (site?.company ?? '').toLowerCase().includes(query)
      );
    });
  }, [watchlist, search, data]);

  const stats = useMemo(() => {
    const upcoming = (limit: number) => withDays.filter((entry) => entry.days >= 0 && entry.days <= limit).length;
    const lapsed = withDays.filter((entry) => entry.days < 0).length;
    const noExpiry = permits.filter((permit) => !permit.expiry).length;
    return { d30: upcoming(30), d90: upcoming(90), d365: upcoming(365), lapsed, noExpiry };
  }, [withDays, permits]);

  const buckets = useMemo(() => {
    const rows = [
      { label: 'Lapsed', test: (days: number) => days < 0, color: '#fb7185' },
      { label: '0–30 d', test: (days: number) => days >= 0 && days <= 30, color: '#f97316' },
      { label: '31–60 d', test: (days: number) => days > 30 && days <= 60, color: '#f59e0b' },
      { label: '61–90 d', test: (days: number) => days > 60 && days <= 90, color: '#fbbf24' },
      { label: '91–180 d', test: (days: number) => days > 90 && days <= 180, color: '#a3e635' },
      { label: '181–365 d', test: (days: number) => days > 180 && days <= 365, color: '#34d399' },
      { label: '> 1 year', test: (days: number) => days > 365, color: '#22d3ee' },
    ];
    return rows.map((row) => ({ ...row, count: withDays.filter((entry) => row.test(entry.days)).length }));
  }, [withDays]);

  const typeSplit = useMemo(
    () => ({
      dp: watchlist.filter((entry) => entry.permit.type === 'DP').length,
      pto: watchlist.filter((entry) => entry.permit.type === 'PTO').length,
      flagged: watchlist.filter((entry) => (entry.permit.risk ?? 0) >= 4).length,
      noCoord: watchlist.filter((entry) => entry.permit.lat === null).length,
    }),
    [watchlist],
  );

  const monthly = useMemo(() => {
    const labels: string[] = [];
    const dp: number[] = [];
    const pto: number[] = [];
    const base = new Date(reference);
    for (let index = 0; index < 12; index += 1) {
      const cursor = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + index, 1));
      const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
      labels.push(cursor.toLocaleDateString('en-PH', { month: 'short', year: '2-digit', timeZone: 'UTC' }));
      dp.push(withDays.filter((entry) => entry.permit.type === 'DP' && entry.permit.expiry?.startsWith(key)).length);
      pto.push(withDays.filter((entry) => entry.permit.type === 'PTO' && entry.permit.expiry?.startsWith(key)).length);
    }
    return { labels, dp, pto };
  }, [withDays, reference]);

  const columns: Column<Permit>[] = [
    {
      key: 'company',
      header: 'Establishment',
      sortValue: (row) => row.company,
      render: (row) => (
        <div className="min-w-[210px] max-w-[330px]">
          <div className="truncate font-medium text-slate-200">{row.company}</div>
          <div className="truncate text-[10px] text-slate-500">
            {[row.barangay, row.municipality, row.province].filter(Boolean).join(', ') || 'No address'}
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', sortValue: (row) => row.type, render: (row) => <Chip tone={row.type === 'DP' ? 'sky' : 'violet'}>{row.type}</Chip> },
    { key: 'permitNo', header: 'Permit no.', sortValue: (row) => row.permitNo, render: (row) => <span className="whitespace-nowrap font-mono text-[10.5px] text-slate-400">{row.permitNo}</span> },
    { key: 'expiry', header: 'Expiry', sortValue: (row) => row.expiry ?? '', render: (row) => <span className="whitespace-nowrap text-[11px] text-slate-300">{formatDate(row.expiry)}</span> },
    {
      key: 'remaining',
      header: 'Window',
      sortValue: (row) => daysUntil(row.expiry, reference) ?? 99999,
      render: (row) => {
        const days = daysUntil(row.expiry, reference);
        const tone = days === null ? 'text-slate-500' : days < 0 ? 'text-rose-300' : days <= 30 ? 'text-orange-300' : days <= 90 ? 'text-amber-300' : 'text-emerald-300';
        return <span className={clsx('whitespace-nowrap text-[11px] font-medium', tone)}>{dayLabel(days)}</span>;
      },
    },
    {
      key: 'lifecycle',
      header: 'Status',
      sortValue: (row) => row.lifecycle,
      render: (row) => <Chip tone={LIFECYCLE_STYLE[row.lifecycle].chip.replace('chip-', '')}>{row.lifecycle}</Chip>,
    },
    {
      key: 'risk',
      header: 'Risk',
      sortValue: (row) => row.risk ?? 0,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10.5px]" style={{ color: (row.risk ?? 0) ? riskColor(row.risk!) : '#64748b' }}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" /> {RISK_LABELS[row.risk ?? 0] ?? 'None'}
        </span>
      ),
    },
    { key: 'spatial', header: 'Spatial flags', render: (row) => <span className="block max-w-[150px] text-[10px] leading-snug text-slate-500">{spatialSummary(row.spatial)}</span> },
    {
      key: 'qa',
      header: 'Data flags',
      render: (row) => {
        const flags = row.qa.filter((flag) => flag !== 'duplicate_source');
        if (!flags.length) return <span className="text-[10px] text-emerald-400/70">Clean</span>;
        return (
          <div className="flex max-w-[150px] flex-wrap gap-1">
            {flags.slice(0, 2).map((flag) => (
              <span key={flag} className="chip chip-amber px-1 py-0 text-[8.5px] normal-case tracking-normal">{QA_LABELS[flag] ?? flag}</span>
            ))}
            {flags.length > 2 && <span className="text-[9px] text-slate-600">+{flags.length - 2}</span>}
          </div>
        );
      },
    },
    {
      key: 'map',
      header: '',
      render: (row) => <MapButton lat={row.lat} lon={row.lon} label={`${row.company} · ${row.permitNo}`} siteId={row.siteId ?? null} />,
    },
  ];

  const exportRows = () =>
    downloadCsv(
      `envis-renewal-watch-${horizon}d-${data?.meta.referenceDate ?? 'build'}.csv`,
      watchlist.map((entry) => ({
        permit_no: entry.permit.permitNo,
        type: entry.permit.type,
        establishment: entry.permit.company,
        municipality: entry.permit.municipality,
        province: entry.permit.province,
        expiry: entry.permit.expiry ?? '',
        days_remaining: entry.days,
        lifecycle: entry.permit.lifecycle,
        risk: entry.permit.risk ?? 0,
        spatial_flags: spatialSummary(entry.permit.spatial),
        permit_ref: entry.permit.siteId ?? '',
      })),
    );

  if (!data) return null;

  return (
    <div className="animate-fade-up space-y-4">
      <SectionHeading
        eyebrow="Compliance calendar"
        title="Renewal watch"
        description="Permits that are nearing expiry or have already lapsed, computed against the dashboard reference date. Adjust the window to plan renewal follow-ups and field validation."
        action={
          <>
            <button type="button" className="btn" onClick={() => setPage('map')}>
              <MapPin size={13} /> Map affected sites
            </button>
            <button type="button" className="btn btn-primary" onClick={() => requestExport(exportRows)}>
              <Download size={13} /> Export {formatNumber(watchlist.length)}
            </button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Due in 30 days" value={formatNumber(stats.d30)} hint="Nearest renewal window" icon={<TimerReset size={17} />} accent="rose" footer={<div className="text-[10px] text-slate-500">Reference date {formatDate(data.meta.referenceDate)}</div>} />
        <StatCard label="Due in 90 days" value={formatNumber(stats.d90)} hint="Operational follow-up queue" icon={<CalendarClock size={17} />} accent="amber" />
        <StatCard label="Due this year" value={formatNumber(stats.d365)} hint="Within 12 months" icon={<CalendarClock size={17} />} accent="sky" />
        <StatCard label="Already lapsed" value={formatNumber(stats.lapsed)} hint={`${formatNumber(stats.noExpiry)} records have no expiry date`} icon={<CalendarX2 size={17} />} accent="slate" footer={<div className="text-[10px] text-slate-500">Expired permits remain visible for validation</div>} />
      </div>

      <Panel
        title="Renewal window"
        subtitle="Choose how far ahead to look; lapsed permits can be hidden to focus on upcoming work"
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            {HORIZONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setHorizon(value)}
                className={clsx(
                  'rounded-md border px-2 py-1 text-[10.5px] font-semibold transition',
                  horizon === value ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-200',
                )}
              >
                {value} d
              </button>
            ))}
            <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-[10.5px] text-slate-400">
              <input type="checkbox" checked={includeLapsed} onChange={(event) => setIncludeLapsed(event.target.checked)} className="h-3 w-3 accent-emerald-500" />
              Include lapsed
            </label>
          </div>
        }
      >
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Chart
              height={250}
              option={{
                ...chartBase(),
                grid: { left: 8, right: 14, top: 26, bottom: 4, containLabel: true },
                xAxis: { type: 'category', data: buckets.map((bucket) => bucket.label), ...axisStyle({ splitLine: { show: false } }) },
                yAxis: { type: 'value', ...axisStyle() },
                series: [
                  {
                    type: 'bar',
                    data: buckets.map((bucket) => ({ value: bucket.count, itemStyle: { color: bucket.color, borderRadius: [5, 5, 0, 0] } })),
                    barMaxWidth: 46,
                    label: { show: true, position: 'top', color: '#94a3b8', fontSize: 9.5 },
                  },
                ],
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {[
              { label: 'In watchlist', value: watchlist.length, tone: 'text-slate-100' },
              { label: 'DP records', value: typeSplit.dp, tone: 'text-sky-300' },
              { label: 'PTO records', value: typeSplit.pto, tone: 'text-violet-300' },
              { label: 'High-risk records', value: typeSplit.flagged, tone: 'text-rose-300' },
              { label: 'Without coordinates', value: typeSplit.noCoord, tone: 'text-amber-300' },
            ].map((entry) => (
              <div key={entry.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <div className="text-[9.5px] uppercase tracking-[0.12em] text-slate-600">{entry.label}</div>
                <div className={clsx('mt-0.5 font-mono text-[16px] font-semibold', entry.tone)}>{formatNumber(entry.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Expiry calendar" subtitle="Permits expiring by month over the next 12 months">
          <Chart
            height={270}
            option={{
              ...chartBase(),
              legend: { top: 0, right: 4, icon: 'roundRect', itemWidth: 10, itemHeight: 6, textStyle: { color: '#94a3b8', fontSize: 10 } },
              grid: { left: 8, right: 12, top: 30, bottom: 4, containLabel: true },
              xAxis: { type: 'category', data: monthly.labels, ...axisStyle({ splitLine: { show: false } }) },
              yAxis: { type: 'value', ...axisStyle() },
              series: [
                { name: 'DP', type: 'bar', stack: 'expiry', data: monthly.dp, barMaxWidth: 26, itemStyle: { color: '#0ea5e9' } },
                { name: 'PTO', type: 'bar', stack: 'expiry', data: monthly.pto, barMaxWidth: 26, itemStyle: { color: '#34d399', borderRadius: [4, 4, 0, 0] } },
              ],
            }}
          />
        </Panel>
        <Panel title="How this is computed" subtitle="Lifecycle is derived, not copied from the sheet">
          <div className="space-y-3 text-[11.5px] leading-relaxed text-slate-400">
            <p>
              A permit is <b className="text-emerald-300">Active</b> when its expiry is after the reference date,
              <b className="text-amber-300"> Expiring</b> within 90 days, and <b className="text-rose-300">Expired</b> once the expiry has passed.
            </p>
            <p>
              Records without an expiry date are <b className="text-slate-300">Unknown</b> and appear in the data quality queue rather than the calendar.
            </p>
            <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-3 text-[10.5px] text-amber-100/80">
              <div className="mb-1 flex items-center gap-1.5 font-semibold"><FileWarning size={12} /> {formatNumber(stats.noExpiry)} records lack expiry</div>
              Missing dates are not imputed; check the source register before sending notices.
            </div>
          </div>
        </Panel>
      </div>

      <Panel bodyClassName="p-3" title="Watchlist" action={<div className="relative"><input className="input h-8 w-[220px] pl-7 pr-2 text-[11px]" placeholder="Search establishment, permit, ECC/CNC…" value={search} onChange={(event) => setSearch(event.target.value)} /><Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" /></div>} subtitle={`${formatNumber(filteredWatchlist.length)} of ${watchlist.length} permits within ${horizon} days${includeLapsed ? ' including lapsed' : ''}`}>
        <DataTable<Permit>
          rows={filteredWatchlist.map((entry) => entry.permit)}
          columns={columns}
          rowKey={(row) => row.id}
          onRowClick={(row) => row.siteId && selectSite(row.siteId)}
          pageSize={40}
          maxHeight="max-h-[620px]"
          initialSort={{ key: 'expiry', direction: 'asc' }}
          empty={<div className="py-12 text-center text-[12px] text-slate-500">No permits fall inside this renewal window. Try widening the horizon.</div>}
        />
      </Panel>
    </div>
  );
}
