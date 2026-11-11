import { useMemo } from 'react';
import { CalendarClock, CheckCircle2, Download, Droplets, FileWarning, MapPin } from 'lucide-react';
import { requestExport } from '../lib/exportGate';
import { getSession } from '../lib/auth';
import { useDashboard, useFilteredPermits } from '../store/useDashboard';
import { Chip, DataTable, MetricRow, Panel, SectionHeading, StatCard, type Column } from '../components/ui';
import { MapButton } from '../components/MapButton';
import { Chart, axisStyle, chartBase } from '../components/Chart';
import { LIFECYCLE_STYLE, QA_LABELS, RISK_LABELS, downloadCsv, formatDate, formatNumber, relativeExpiry, riskColor } from '../lib/format';
import type { Lifecycle, Permit, PermitType } from '../types';

export function PermitsPage({ type }: { type: PermitType }) {
  const allPermits = useFilteredPermits();
  const data = useDashboard((state) => state.data);
  const selectSite = useDashboard((state) => state.selectSite);
  const setPage = useDashboard((state) => state.setPage);
  const permits = useMemo(() => allPermits.filter((permit) => permit.type === type), [allPermits, type]);

  const isDP = type === 'DP';
  const label = isDP ? 'Discharge permit' : 'Permit to operate';

  const stats = useMemo(() => {
    const byLifecycle = (status: Lifecycle) => permits.filter((permit) => permit.lifecycle === status).length;
    return {
      active: byLifecycle('Active'),
      expiring: byLifecycle('Expiring'),
      expired: byLifecycle('Expired'),
      unknown: byLifecycle('Unknown'),
      noCoord: permits.filter((permit) => permit.lat === null).length,
      noExpiry: permits.filter((permit) => !permit.expiry).length,
    };
  }, [permits]);

  const yearOption = useMemo(() => {
    const years = data?.meta.years ?? [];
    const counts = new Map<number, number>();
    for (const permit of permits) counts.set(permit.year, (counts.get(permit.year) ?? 0) + 1);
    return {
      ...chartBase(),
      grid: { left: 8, right: 14, top: 16, bottom: 4, containLabel: true },
      xAxis: { type: 'category', data: years, ...axisStyle({ splitLine: { show: false } }) },
      yAxis: { type: 'value', ...axisStyle() },
      series: [
        {
          type: 'bar',
          data: years.map((year) => counts.get(year) ?? 0),
          barMaxWidth: 32,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: isDP ? '#0ea5e9' : '#34d399',
          },
          label: { show: true, position: 'top', color: '#7d948d', fontSize: 9 },
        },
      ],
    };
  }, [permits, data, isDP]);

  const industryRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const permit of permits) counts.set(permit.industry || 'Unspecified', (counts.get(permit.industry || 'Unspecified') ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [permits]);

  const lguRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const permit of permits) counts.set(permit.municipality || 'Unmatched', (counts.get(permit.municipality || 'Unmatched') ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [permits]);

  const columns: Column<Permit>[] = [
    {
      key: 'company',
      header: 'Establishment',
      sortValue: (row) => row.company,
      render: (row) => (
        <div className="min-w-[210px] max-w-[320px]">
          <div className="truncate font-medium text-slate-200">{row.company}</div>
          <div className="mt-0.5 truncate text-[10px] text-slate-500">{row.address || `${row.barangay}, ${row.municipality}`}</div>
        </div>
      ),
    },
    { key: 'permitNo', header: 'Permit no.', sortValue: (row) => row.permitNo, render: (row) => <span className="whitespace-nowrap font-mono text-[10.5px] text-slate-400">{row.permitNo}</span> },
    {
      key: 'lgu',
      header: 'LGU',
      sortValue: (row) => row.municipality,
      render: (row) => (
        <div className="whitespace-nowrap text-[11px]">
          <span className="text-slate-300">{row.municipality || '—'}</span>
          <span className="ml-1 text-slate-600">{row.province}</span>
        </div>
      ),
    },
    { key: 'issued', header: 'Issued', sortValue: (row) => row.issued ?? '', render: (row) => <span className="whitespace-nowrap text-[11px] text-slate-400">{formatDate(row.issued)}</span> },
    { key: 'expiry', header: 'Expiry', sortValue: (row) => row.expiry ?? '', render: (row) => <span className="whitespace-nowrap text-[11px] text-slate-400">{formatDate(row.expiry)}</span> },
    {
      key: 'lifecycle',
      header: 'Status',
      sortValue: (row) => row.lifecycle,
      render: (row) => (
        <div className="whitespace-nowrap">
          <Chip tone={LIFECYCLE_STYLE[row.lifecycle].chip.replace('chip-', '')}>{row.lifecycle}</Chip>
          {row.lifecycle === 'Expiring' && <div className="mt-0.5 text-[9.5px] text-amber-400/80">{relativeExpiry(row.expiry)}</div>}
        </div>
      ),
    },
    { key: 'sourceStatus', header: 'Type / Domestic Waste', sortValue: (row) => row.sourceStatus, render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-500">{row.sourceStatus}</span> },
    {
      key: 'wastewater',
      header: 'Waste water',
      sortValue: (row) => row.wastewater,
      render: (row) => <span className="block max-w-[170px] truncate text-[10.5px] text-slate-400" title={row.wastewater}>{row.wastewater || '—'}</span>,
    },
    {
      key: 'industry',
      header: 'Industry',
      sortValue: (row) => row.industry,
      render: (row) => <span className="block max-w-[170px] truncate text-[10.5px] text-slate-500">{row.industry || '—'}</span>,
    },
    {
      key: 'risk',
      header: 'Risk',
      sortValue: (row) => row.risk ?? 0,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10.5px]" style={{ color: (row.risk ?? 0) ? riskColor(row.risk!) : '#64748b' }}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {RISK_LABELS[row.risk ?? 0] ?? 'None'}
        </span>
      ),
    },
    {
      key: 'qa',
      header: 'Data flags',
      render: (row) => {
        const flags = row.qa.filter((flag) => flag !== 'duplicate_source');
        if (!flags.length) return <CheckCircle2 size={12} className="text-emerald-400/70" />;
        return (
          <div className="flex max-w-[180px] flex-wrap gap-1">
            {flags.slice(0, 2).map((flag) => (
              <span key={flag} title={QA_LABELS[flag] ?? flag} className="chip chip-amber px-1 py-0 text-[8.5px] normal-case tracking-normal">
                {QA_LABELS[flag] ?? flag}
              </span>
            ))}
            {flags.length > 2 && <span className="text-[9px] text-slate-600">+{flags.length - 2}</span>}
          </div>
        );
      },
    },
    {
      key: 'map',
      header: '',
      render: (row) => (
        <MapButton
          lat={row.lat}
          lon={row.lon}
          label={`${row.company} · ${row.permitNo}`}
          siteId={row.siteId ?? null}
        />
      ),
    },
  ];

  const exportRows = () =>
    downloadCsv(
      `envis-${type.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`,
      permits.map((permit) => ({
        permit_no: permit.permitNo,
        application_no: permit.appNo,
        type: permit.type,
        year: permit.year,
        company: permit.company,
        barangay: permit.barangay,
        municipality: permit.municipality,
        province: permit.province,
        issued: permit.issued ?? '',
        expiry: permit.expiry ?? '',
        lifecycle: permit.lifecycle,
        filing: permit.sourceStatus,
        industry: permit.industry,
        psic: permit.psic,
        ecc_cnc: permit.eccNo,
        waterbody: permit.waterbody,
        wastewater_type: permit.wastewater,
        allowed_volume: permit.volume,
        latitude: permit.lat ?? '',
        longitude: permit.lon ?? '',
        risk: permit.risk ?? 0,
        qa_flags: permit.qa.join('|'),
        source_sheet: permit.sourceSheet,
      })),
    );

  if (!data) return null;

  return (
    <div className="animate-fade-up space-y-4">
      <SectionHeading
        eyebrow={isDP ? 'Wastewater discharge' : 'Air & water operations'}
        title={`${label}s`}
        description={
          isDP
            ? 'Discharge permits issued under DAO 2016-08, including volume, receiving waterbody and facility details as recorded in the Region VII register.'
            : 'Permits to operate for pollution-control facilities and wastewater treatment systems, cross-referenced with discharge permits.'
        }
        action={
          <>
            <button type="button" className="btn" onClick={() => setPage('map')}>
              <MapPin size={13} /> Map
            </button>
{getSession()?.role !== 'rd' && (
            <button type="button" className="btn btn-primary" onClick={() => requestExport(exportRows)}>
              <Download size={13} /> Export {formatNumber(permits.length)}
            </button>
          )}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`${type} records`} value={formatNumber(permits.length)} hint={`${formatNumber(permits.filter((permit) => permit.scope === 'in').length)} in Cebu / Bohol`} icon={<Droplets size={17} />} accent={isDP ? 'sky' : 'emerald'} />
        <StatCard label="Active" value={formatNumber(stats.active)} hint={`${formatNumber(stats.expiring)} expiring within 90 days`} icon={<CheckCircle2 size={17} />} accent="emerald" footer={<div className="text-[10px] text-slate-500">{permits.length ? Math.round((stats.active / permits.length) * 100) : 0}% of records</div>} />
        <StatCard label="Expired" value={formatNumber(stats.expired)} hint={`${formatNumber(stats.unknown)} with no usable expiry`} icon={<CalendarClock size={17} />} accent="rose" />
        <StatCard label="Coordinate gaps" value={formatNumber(stats.noCoord)} hint={`${formatNumber(permits.filter((permit) => permit.lat !== null).length)} mappable`} icon={<FileWarning size={17} />} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title={`${type} issuance by year`} subtitle="Records after de-duplication and normalisation">
          <Chart height={270} option={yearOption} />
        </Panel>
        <Panel title="Status split" subtitle="Lifecycle derived from expiry date">
          <div className="space-y-3 py-1">
            {(['Active', 'Expiring', 'Expired', 'Unknown'] as Lifecycle[]).map((status) => {
              const count = permits.filter((permit) => permit.lifecycle === status).length;
              return (
                <MetricRow
                  key={status}
                  label={<span className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${LIFECYCLE_STYLE[status].dot}`} />{status}</span>}
                  value={count}
                  max={Math.max(1, permits.length)}
                  tone={status === 'Active' ? 'bg-emerald-400' : status === 'Expiring' ? 'bg-amber-400' : status === 'Expired' ? 'bg-rose-400' : 'bg-slate-400'}
                />
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
              <div className="text-[9.5px] uppercase tracking-wider text-slate-600">New filings</div>
              <div className="font-mono text-[13px] text-slate-200">{formatNumber(permits.filter((permit) => permit.sourceStatus === 'New').length)}</div>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
              <div className="text-[9.5px] uppercase tracking-wider text-slate-600">Renewals</div>
              <div className="font-mono text-[13px] text-slate-200">{formatNumber(permits.filter((permit) => permit.sourceStatus === 'Renewal').length)}</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Top industries" subtitle="By permit count in current filter">
          <div className="space-y-2.5">
            {industryRows.map(([industry, count]) => (
              <MetricRow key={industry} label={industry} value={count} max={Math.max(1, industryRows[0]?.[1] ?? 1)} tone={isDP ? 'bg-sky-400' : 'bg-emerald-400'} />
            ))}
          </div>
        </Panel>
        <Panel title="Top LGUs" subtitle={`All ${formatNumber(lguRows.length)} cities / municipalities · scroll to view more`}>
          <div className="scroll-thin max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
            {lguRows.map(([municipality, count]) => (
              <MetricRow key={municipality} label={municipality} value={count} max={Math.max(1, lguRows[0]?.[1] ?? 1)} tone="bg-violet-400" />
            ))}
          </div>
        </Panel>
      </div>

      <Panel bodyClassName="p-3" title={`${type} register`} subtitle={`${formatNumber(permits.length)} records · click a row to open the establishment`}>
        <DataTable<Permit>
          rows={permits}
          columns={columns}
          rowKey={(row) => row.id}
          pageSize={40}
          maxHeight="max-h-[640px]"
          initialSort={{ key: 'expiry', direction: 'desc' }}
          onRowClick={(row) => row.siteId && selectSite(row.siteId)}
          empty={<div className="py-12 text-center text-[12px] text-slate-500">No {type} records match the current filters.</div>}
        />
      </Panel>
    </div>
  );
}
