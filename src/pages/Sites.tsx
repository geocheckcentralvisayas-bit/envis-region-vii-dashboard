import { useMemo } from 'react';
import { Building2, Download, MapPin, Sparkles, Unlink2 } from 'lucide-react';
import clsx from 'clsx';
import { requestExport } from '../lib/exportGate';
import { getSession } from '../lib/auth';
import { useDashboard, useFilteredSites } from '../store/useDashboard';
import { Chip, DataTable, Panel, SectionHeading, StatCard, type Column } from '../components/ui';
import { MapButton } from '../components/MapButton';
import { GAP_META, RISK_LABELS, downloadCsv, formatDate, formatNumber, riskColor } from '../lib/format';
import type { Site, SiteGap } from '../types';

const GAP_ORDER: (SiteGap | 'all' | 'match-only')[] = ['all', 'match-only', 'both-active', 'dp-active', 'pto-active', 'both-inactive', 'dp-only', 'pto-only', 'hw-only'];

export function SitesPage() {
  const sites = useFilteredSites();
  const allSites = useDashboard((state) => state.data?.sites ?? []);
  const siteGap = useDashboard((state) => state.siteGap);
  const setSiteGap = useDashboard((state) => state.setSiteGap);
  const selectSite = useDashboard((state) => state.selectSite);
  const setPage = useDashboard((state) => state.setPage);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const site of allSites) map.set(site.gap, (map.get(site.gap) ?? 0) + 1);
    return map;
  }, [allSites]);

  const both = sites.filter((site) => site.matchType === 'both').length;
  const active = sites.filter((site) => site.activeDP || site.activePTO).length;

  const exportRows = () =>
    downloadCsv(
      `envis-sites-${new Date().toISOString().slice(0, 10)}.csv`,
      sites.map((site) => ({
        site_id: site.id,
        establishment: site.company,
        barangay: site.barangay,
        municipality: site.municipality,
        province: site.province,
        dp_records: site.dpCount,
        pto_records: site.ptoCount,
        hw_registrations: site.hwCount,
        hw_gr_numbers: site.hwGrNos.join('|'),
        ecc_nos: site.eccNos.join('|'),
        cnc_nos: site.cncNos.join('|'),
        coverage: GAP_META[site.gap].label,
        match_type: site.matchType,
        match_method: site.matchMethod,
        latest_issued: site.latestIssued ?? '',
        dp_expiry: site.dpExpiry ?? '',
        pto_expiry: site.ptoExpiry ?? '',
        risk: site.risk,
        latitude: site.lat ?? '',
        longitude: site.lon ?? '',
        address: site.address,
      })),
    );

  const columns: Column<Site>[] = [
    {
      key: 'company',
      header: 'Establishment',
      sortValue: (row) => row.company,
      render: (row) => (
        <div className="min-w-[230px] max-w-[340px]">
          <div className="truncate font-medium text-slate-200">{row.company}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
            <MapPin size={9} className="shrink-0" />
            <span className="truncate">{[row.barangay, row.municipality, row.province].filter(Boolean).join(', ')}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'dp',
      header: 'DP',
      sortValue: (row) => row.dpCount,
      render: (row) => <span className={clsx('font-mono text-[11px]', row.dpCount ? 'text-sky-300' : 'text-slate-600')}>{row.dpCount}</span>,
    },
    {
      key: 'pto',
      header: 'PTO',
      sortValue: (row) => row.ptoCount,
      render: (row) => <span className={clsx('font-mono text-[11px]', row.ptoCount ? 'text-violet-300' : 'text-slate-600')}>{row.ptoCount}</span>,
    },
    {
      key: 'hw',
      header: 'HW',
      sortValue: (row) => row.hwCount,
      render: (row) => <span className={clsx('font-mono text-[11px]', row.hwCount ? 'text-amber-300' : 'text-slate-600')}>{row.hwCount}</span>,
    },
    {
      key: 'ecc',
      header: 'ECC',
      sortValue: (row) => row.eccCount,
      render: (row) => <span className={clsx('font-mono text-[11px]', row.eccCount ? 'text-emerald-300' : 'text-slate-600')}>{row.eccCount}</span>,
    },
    {
      key: 'cnc',
      header: 'CNC',
      sortValue: (row) => row.cncCount,
      render: (row) => <span className={clsx('font-mono text-[11px]', row.cncCount ? 'text-sky-300' : 'text-slate-600')}>{row.cncCount}</span>,
    },
    {
      key: 'method',
      header: 'Match',
      sortValue: (row) => row.matchMethod,
      render: (row) => (
        <span className="text-[10.5px] capitalize text-slate-500">
          {row.matchType === 'both' ? row.matchMethod : '—'}
        </span>
      ),
    },
    {
      key: 'latest',
      header: 'Latest issue',
      sortValue: (row) => row.latestIssued ?? '',
      render: (row) => <span className="whitespace-nowrap text-[11px] text-slate-400">{formatDate(row.latestIssued)}</span>,
    },
    {
      key: 'risk',
      header: 'Risk',
      sortValue: (row) => row.risk,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10.5px]" style={{ color: row.risk ? riskColor(row.risk) : '#64748b' }}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {RISK_LABELS[row.risk] ?? 'None'}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <MapButton lat={row.lat} lon={row.lon} label={row.company} siteId={row.id} />
          <button
            type="button"
            className="btn btn-xs whitespace-nowrap"
            onClick={(event) => {
              event.stopPropagation();
              selectSite(row.id);
            }}
          >
            Details
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-up space-y-4">
      <SectionHeading
        eyebrow="Intercrossed registers"
        title="Establishments with DP and PTO coverage"
        description="Each site groups permit records with the same establishment identity inside a city or municipality. Use the coverage tabs to isolate matched, partial and inactive establishments."
        action={
          <>
            <button type="button" className="btn" onClick={() => setPage('map')}>
              <MapPin size={13} /> Map view
            </button>
            {getSession()?.role !== 'rd' && (
              <button type="button" className="btn btn-primary" onClick={() => requestExport(exportRows)}>
                <Download size={13} /> Export {formatNumber(sites.length)}
              </button>
            )}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Sites in view" value={formatNumber(sites.length)} hint={`${formatNumber(allSites.length)} total establishments`} icon={<Building2 size={17} />} accent="emerald" />
        <StatCard label="Matched on both" value={formatNumber(both)} hint="DP and PTO records found" icon={<Sparkles size={17} />} accent="violet" footer={<div className="text-[10px] text-slate-500">{sites.length ? Math.round((both / sites.length) * 100) : 0}% of filtered sites</div>} />
        <StatCard label="With active permit" value={formatNumber(active)} hint="DP or PTO still active" icon={<Building2 size={17} />} accent="sky" />
        <StatCard label="HW generators" value={formatNumber(sites.filter((site) => site.hwCount > 0).length)} hint={`${formatNumber(allSites.filter((site) => site.hwCount > 0).length)} total`} icon={<Building2 size={17} />} accent="amber" />
        <StatCard label="Unpaired" value={formatNumber(sites.filter((site) => site.matchType !== 'both').length)} hint="Only one register found" icon={<Unlink2 size={17} />} accent="amber" />
      </div>

      <Panel bodyClassName="p-3" title="Coverage filter" subtitle="Counts reflect all establishments, not just the current filter">
        <div className="flex flex-wrap gap-1.5">
          {GAP_ORDER.map((key) => {
            const isMatchOnly = key === 'match-only';
            const label = key === 'all' ? 'All establishments' : isMatchOnly ? 'Matched only' : GAP_META[key].label;
            const count = isMatchOnly ? allSites.filter((site) => site.matchType === 'both').length : key === 'all' ? allSites.length : counts.get(key) ?? 0;
            const active = siteGap === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSiteGap(key)}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition',
                  active
                    ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200',
                )}
              >
                {key !== 'all' && !isMatchOnly && <span className="h-1.5 w-1.5 rounded-full" style={{ background: GAP_META[key].color }} />}
                {label}
                <span className="font-mono text-[9.5px] text-slate-500">{formatNumber(count)}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel bodyClassName="p-3" title="Establishment register" subtitle={`${formatNumber(sites.length)} sites matching current filters`}>
        <DataTable<Site>
          rows={sites}
          columns={columns}
          rowKey={(row) => row.id}
          onRowClick={(row) => selectSite(row.id)}
          pageSize={40}
          maxHeight="max-h-[620px]"
          initialSort={{ key: 'company', direction: 'asc' }}
          empty={<div className="py-12 text-center text-[12px] text-slate-500">No establishments match the current filters. Try clearing the year, province or coverage filter.</div>}
        />
      </Panel>

      <div className="grid gap-3 lg:grid-cols-3">
        {(['both-active', 'dp-active', 'pto-active'] as SiteGap[]).map((gap) => {
          const list = sites.filter((site) => site.gap === gap).slice(0, 4);
          return (
            <Panel key={gap} title={GAP_META[gap].label} subtitle={GAP_META[gap].description}>
              <div className="space-y-2">
                {list.length === 0 && <div className="py-4 text-center text-[11px] text-slate-600">Nothing in this view.</div>}
                {list.map((site) => (
                  <button key={site.id} type="button" onClick={() => selectSite(site.id)} className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-left hover:border-white/15">
                    <div className="min-w-0">
                      <div className="truncate text-[11.5px] font-medium text-slate-300">{site.company}</div>
                      <div className="text-[9.5px] text-slate-600">{site.municipality} · DP {site.dpCount} / PTO {site.ptoCount}</div>
                    </div>
                    <span className="shrink-0 font-mono text-[9.5px] text-slate-600">{formatDate(site.latestIssued)}</span>
                  </button>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
