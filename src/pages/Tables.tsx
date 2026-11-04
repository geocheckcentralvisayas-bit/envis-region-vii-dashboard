import { useMemo, useState } from 'react';
import { Download, Table2 } from 'lucide-react';
import clsx from 'clsx';
import { requestExport } from '../lib/exportGate';
import { getSession } from '../lib/auth';
import { useDashboard, useFilteredPermits, useFilteredSites, useFilteredHw, useFilteredClearances } from '../store/useDashboard';
import { Chip, DataTable, Panel, SectionHeading, type Column } from '../components/ui';
import { MapButton } from '../components/MapButton';
import {
  CLEARANCE_STYLE, GAP_META, LIFECYCLE_STYLE, RISK_LABELS, downloadCsv, formatDate, formatNumber, riskColor, spatialSummary,
} from '../lib/format';
import type { Clearance, HwRegistration, Permit, Site } from '../types';

type TabId = 'permits' | 'sites' | 'hw' | 'clearances' | 'audit';

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: 'permits', label: 'Permit records', hint: 'Normalised DP and PTO register' },
  { id: 'sites', label: 'Establishments', hint: 'Intercrossed site register' },
  { id: 'hw', label: 'Hazardous waste', hint: 'HW generator registrations' },
  { id: 'clearances', label: 'ECC & CNC', hint: 'Clearance register' },
  { id: 'audit', label: 'Audit trail', hint: 'Logged normalisation changes' },
];

export function TablesPage() {
  const data = useDashboard((state) => state.data);
  const permits = useFilteredPermits();
  const sites = useFilteredSites();
  const hw = useFilteredHw();
  const clearances = useFilteredClearances();
  const selectSite = useDashboard((state) => state.selectSite);
  const [tab, setTab] = useState<TabId>('permits');
  const [showFlags, setShowFlags] = useState(true);

  const auditRows = data?.quality.audit ?? [];
  const auditColumns: Column<(typeof auditRows)[number]>[] = [
    { key: 'at', header: 'Logged', sortValue: (row) => row.at, render: (row) => <span className="whitespace-nowrap font-mono text-[9.5px] text-slate-500">{row.at}</span> },
    { key: 'permit', header: 'Permit', sortValue: (row) => row.permitNo, render: (row) => <div className="min-w-[150px]"><div className="font-mono text-[10px] text-slate-300">{row.permitNo}</div><div className="truncate text-[9.5px] text-slate-600">{row.company}</div></div> },
    { key: 'type', header: 'Type', render: (row) => <Chip tone={row.type === 'DP' ? 'sky' : 'violet'}>{row.type}</Chip> },
    { key: 'field', header: 'Field', sortValue: (row) => row.field, render: (row) => <span className="text-[10.5px] text-slate-400">{row.field}</span> },
    { key: 'original', header: 'Original', render: (row) => <span className="block max-w-[200px] truncate text-[10px] text-slate-600">{row.original || '(blank)'}</span> },
    { key: 'clean', header: 'Normalised', render: (row) => <span className="block max-w-[200px] truncate text-[10px] text-slate-300">{row.clean || '(blank)'}</span> },
    { key: 'action', header: 'Action', sortValue: (row) => row.action, render: (row) => <Chip tone={row.action === 'REVIEW' ? 'amber' : row.action === 'EXCLUDED' ? 'rose' : 'emerald'}>{row.action}</Chip> },
    { key: 'reason', header: 'Reason', render: (row) => <span className="block max-w-[340px] text-[10px] leading-snug text-slate-500">{row.reason}</span> },
  ];

  const permitColumns = useMemo<Column<Permit>[]>(() => {
    const list: Column<Permit>[] = [
      { key: 'permitNo', header: 'Permit no.', sortValue: (row) => row.permitNo, render: (row) => <div className="min-w-[130px]"><div className="font-mono text-[10.5px] text-slate-200">{row.permitNo}</div><div className="font-mono text-[9px] text-slate-600">App {row.appNo || '—'}</div></div> },
      { key: 'type', header: 'Type', sortValue: (row) => row.type, render: (row) => <Chip tone={row.type === 'DP' ? 'sky' : 'violet'}>{row.type}</Chip> },
      { key: 'company', header: 'Establishment', sortValue: (row) => row.company, render: (row) => <span className="block max-w-[260px] truncate font-medium text-slate-200">{row.company}</span> },
      { key: 'lgu', header: 'LGU', sortValue: (row) => row.municipality, render: (row) => <div className="whitespace-nowrap text-[10.5px]"><span className="text-slate-300">{row.municipality || '—'}</span><span className="ml-1 text-slate-600">{row.province}</span></div> },
      { key: 'barangay', header: 'Barangay', sortValue: (row) => row.barangay, render: (row) => <span className="text-[10.5px] text-slate-400">{row.barangay || <span className="text-rose-400/70">missing</span>}</span> },
      { key: 'issued', header: 'Issued', sortValue: (row) => row.issued ?? '', render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-400">{formatDate(row.issued)}</span> },
      { key: 'expiry', header: 'Expiry', sortValue: (row) => row.expiry ?? '', render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-400">{formatDate(row.expiry)}</span> },
      { key: 'lifecycle', header: 'Status', sortValue: (row) => row.lifecycle, render: (row) => <Chip tone={LIFECYCLE_STYLE[row.lifecycle].chip.replace('chip-', '')}>{row.lifecycle}</Chip> },
      { key: 'industry', header: 'Industry', sortValue: (row) => row.industry, render: (row) => <span className="block max-w-[160px] truncate text-[10px] text-slate-500">{row.industry || '—'}</span> },
      { key: 'source', header: 'Source', sortValue: (row) => row.sourceSheet, render: (row) => <div className="whitespace-nowrap text-[9.5px] text-slate-600">{row.workbook} · {row.sourceSheet}<br />row {row.sourceRow}</div> },
      { key: 'coords', header: 'Coordinates', sortValue: (row) => row.lat ?? 0, render: (row) => <div className="whitespace-nowrap font-mono text-[9.5px] text-slate-500">{row.lat === null || row.lon === null ? <span className={row.lat === null ? 'text-amber-400/80' : ''}>—</span> : `${row.lat.toFixed(4)}, ${row.lon.toFixed(4)}`}<div className="text-[8.5px] text-slate-700">{row.coordStatus}</div></div> },
      { key: 'risk', header: 'Risk', sortValue: (row) => row.risk ?? 0, render: (row) => <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px]" style={{ color: (row.risk ?? 0) ? riskColor(row.risk!) : '#64748b' }}><span className="h-1.5 w-1.5 rounded-full bg-current" />{RISK_LABELS[row.risk ?? 0]}</span> },
      { key: 'map', header: '', render: (row) => <MapButton lat={row.lat} lon={row.lon} label={`${row.company} · ${row.permitNo}`} siteId={row.siteId ?? null} /> },
    ];
    if (showFlags) {
      list.push({
        key: 'flags',
        header: 'QA flags',
        render: (row) => <span className="block max-w-[150px] text-[9.5px] leading-snug text-slate-600">{row.qa.join(', ') || '—'}</span>,
      });
    }
    return list;
  }, [showFlags]);

  const siteColumns = useMemo<Column<Site>[]>(
    () => [
      { key: 'id', header: 'Site', sortValue: (row) => row.id, render: (row) => <span className="font-mono text-[9.5px] text-slate-600">{row.id}</span> },
      { key: 'company', header: 'Establishment', sortValue: (row) => row.company, render: (row) => <span className="block max-w-[280px] truncate font-medium text-slate-200">{row.company}</span> },
      { key: 'lgu', header: 'LGU', sortValue: (row) => row.municipality, render: (row) => <div className="whitespace-nowrap text-[10.5px]"><span className="text-slate-300">{row.municipality || '—'}</span><span className="ml-1 text-slate-600">{row.province}</span></div> },
      { key: 'barangay', header: 'Barangay', sortValue: (row) => row.barangay, render: (row) => <span className="text-[10.5px] text-slate-400">{row.barangay || '—'}</span> },
      { key: 'dp', header: 'DP', sortValue: (row) => row.dpCount, render: (row) => <span className="font-mono text-[10.5px] text-sky-300">{row.dpCount}</span> },
      { key: 'pto', header: 'PTO', sortValue: (row) => row.ptoCount, render: (row) => <span className="font-mono text-[10.5px] text-violet-300">{row.ptoCount}</span> },
      { key: 'hw', header: 'HW', sortValue: (row) => row.hwCount, render: (row) => <span className="font-mono text-[10.5px] text-amber-300">{row.hwCount}</span> },
      { key: 'ecc', header: 'ECC', sortValue: (row) => row.eccCount, render: (row) => <span className="font-mono text-[10.5px] text-emerald-300">{row.eccCount}</span> },
      { key: 'cnc', header: 'CNC', sortValue: (row) => row.cncCount, render: (row) => <span className="font-mono text-[10.5px] text-sky-300">{row.cncCount}</span> },
      { key: 'match', header: 'Match', sortValue: (row) => row.matchMethod, render: (row) => <span className="text-[10px] capitalize text-slate-500">{row.matchType === 'both' ? row.matchMethod : 'single'}</span> },
      { key: 'latest', header: 'Latest issue', sortValue: (row) => row.latestIssued ?? '', render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-400">{formatDate(row.latestIssued)}</span> },
      { key: 'expiry', header: 'DP / PTO expiry', render: (row) => <div className="whitespace-nowrap text-[9.5px] text-slate-500"><div>{formatDate(row.dpExpiry)}</div><div>{formatDate(row.ptoExpiry)}</div></div> },
      { key: 'spatial', header: 'Spatial', render: (row) => <span className="block max-w-[150px] text-[9.5px] leading-snug text-slate-600">{spatialSummary(row.spatial)}</span> },
      { key: 'risk', header: 'Risk', sortValue: (row) => row.risk, render: (row) => <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px]" style={{ color: row.risk ? riskColor(row.risk) : '#64748b' }}><span className="h-1.5 w-1.5 rounded-full bg-current" />{RISK_LABELS[row.risk]}</span> },
      { key: 'scope', header: 'Scope', sortValue: (row) => row.scope, render: (row) => <span className={clsx('text-[9.5px] uppercase tracking-wider', row.scope === 'in' ? 'text-emerald-400/80' : row.scope === 'out' ? 'text-rose-400/70' : 'text-slate-600')}>{row.scope}</span> },
      { key: 'map', header: '', render: (row) => <MapButton lat={row.lat} lon={row.lon} label={row.company} siteId={row.id} /> },
    ],
    [],
  );

  const exportPermits = () =>
    downloadCsv(
      `envis-permit-register-${new Date().toISOString().slice(0, 10)}.csv`,
      permits.map((permit) => ({
        permit_no: permit.permitNo, application_no: permit.appNo, type: permit.type, year: permit.year,
        company: permit.company, barangay: permit.barangay, municipality: permit.municipality, province: permit.province,
        issued: permit.issued ?? '', expiry: permit.expiry ?? '', lifecycle: permit.lifecycle, filing: permit.sourceStatus,
        industry: permit.industry, psic: permit.psic, ecc_cnc: permit.eccNo, waterbody: permit.waterbody,
        wastewater_type: permit.wastewater, volume: permit.volume, pco: permit.pco,
        latitude: permit.lat ?? '', longitude: permit.lon ?? '', coord_status: permit.coordStatus,
        spatial_flags: spatialSummary(permit.spatial), risk: permit.risk ?? 0, qa_flags: permit.qa.join('|'),
        source_workbook: permit.workbook, source_sheet: permit.sourceSheet, source_row: permit.sourceRow,
      })),
    );

  const exportSites = () =>
    downloadCsv(
      `envis-establishment-register-${new Date().toISOString().slice(0, 10)}.csv`,
      sites.map((site) => ({
        site_id: site.id, establishment: site.company, barangay: site.barangay, municipality: site.municipality,
        province: site.province, address: site.address, dp_count: site.dpCount, pto_count: site.ptoCount,
        coverage: site.gap, match_type: site.matchType, match_method: site.matchMethod,
        latest_issued: site.latestIssued ?? '', dp_expiry: site.dpExpiry ?? '', pto_expiry: site.ptoExpiry ?? '',
        active_dp: site.activeDP, active_pto: site.activePTO, spatial_flags: spatialSummary(site.spatial),
        risk: site.risk, latitude: site.lat ?? '', longitude: site.lon ?? '', scope: site.scope,
      })),
    );

  const exportAudit = () => downloadCsv(`envis-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`, auditRows);

  const hwColumns: Column<HwRegistration>[] = [
    { key: 'company', header: 'Establishment', sortValue: (row) => row.company, render: (row) => <span className="block max-w-[260px] truncate font-medium text-slate-200">{row.company}</span> },
    { key: 'gr', header: 'HW GR no.', sortValue: (row) => row.hwGrNo, render: (row) => <span className="font-mono text-[10.5px] text-amber-300">{row.hwGrNo || '—'}</span> },
    { key: 'lgu', header: 'LGU', sortValue: (row) => row.municipality, render: (row) => <span className="text-[10.5px] text-slate-400">{row.municipality}, {row.province}</span> },
    { key: 'status', header: 'Status', sortValue: (row) => row.lifecycle, render: (row) => <Chip tone={LIFECYCLE_STYLE[row.lifecycle].chip.replace('chip-', '')}>{row.lifecycle}</Chip> },
    { key: 'subtype', header: 'Filing', sortValue: (row) => row.subtype, render: (row) => <span className="text-[10.5px] text-slate-400">{row.subtype}</span> },
    { key: 'issued', header: 'Issued', sortValue: (row) => row.issued ?? '', render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-400">{formatDate(row.issued)}</span> },
    { key: 'expiry', header: 'Expiry', sortValue: (row) => row.expiry ?? '', render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-400">{formatDate(row.expiry)}</span> },
    { key: 'codes', header: 'Waste codes', sortValue: (row) => row.wasteCount, render: (row) => <span className="text-[10.5px] text-slate-400">{row.wasteCount}</span> },
    { key: 'ecc', header: 'ECC', render: (row) => <span className="text-[10.5px] text-emerald-300">{row.eccNos.join(', ') || '—'}</span> },
    { key: 'cnc', header: 'CNC', render: (row) => <span className="text-[10.5px] text-sky-300">{row.cncNos.join(', ') || '—'}</span> },
    { key: 'match', header: 'Match', sortValue: (row) => row.matched ? 1 : 0, render: (row) => <Chip tone={row.matched ? 'emerald' : 'amber'}>{row.matched ? 'DP/PTO' : 'HW only'}</Chip> },
    { key: 'map', header: '', render: (row) => <MapButton lat={row.lat} lon={row.lon} label={`${row.company} · ${row.hwGrNo || row.appNo}`} siteId={row.siteId} /> },
  ];

  const clearanceColumns: Column<Clearance>[] = [
    { key: 'number', header: 'Clearance no.', sortValue: (row) => row.number, render: (row) => <span className="font-mono text-[10.5px] text-slate-200">{row.number}</span> },
    { key: 'type', header: 'Type', sortValue: (row) => row.type, render: (row) => <Chip tone={CLEARANCE_STYLE[row.type].chip.replace('chip-', '')}>{CLEARANCE_STYLE[row.type].label}</Chip> },
    { key: 'company', header: 'Establishment', sortValue: (row) => row.company, render: (row) => <span className="block max-w-[260px] truncate font-medium text-slate-200">{row.company || '—'}</span> },
    { key: 'lgu', header: 'LGU', sortValue: (row) => row.municipality, render: (row) => <span className="text-[10.5px] text-slate-400">{row.municipality}, {row.province}</span> },
    { key: 'status', header: 'Status', sortValue: (row) => row.lifecycle, render: (row) => <Chip tone={LIFECYCLE_STYLE[row.lifecycle].chip.replace('chip-', '')}>{row.lifecycle}</Chip> },
    { key: 'issued', header: 'Issued', sortValue: (row) => row.issued ?? '', render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-400">{formatDate(row.issued)}</span> },
    { key: 'expiry', header: 'Expiry', sortValue: (row) => row.expiry ?? '', render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-400">{formatDate(row.expiry)}</span> },
    { key: 'refs', header: 'Linked permits', render: (row) => <span className="text-[10px] text-slate-500">{row.permitRefs.join(', ') || '—'}</span> },
    { key: 'hw', header: 'HW GR', sortValue: (row) => row.hwGrNo, render: (row) => <span className="font-mono text-[9.5px] text-amber-300">{row.hwGrNo || '—'}</span> },
    { key: 'map', header: '', render: (row) => <MapButton lat={row.lat} lon={row.lon} label={`${row.company} · ${row.number}`} siteId={row.siteId} /> },
  ];

  if (!data) return null;

  const activeMeta = TABS.find((entry) => entry.id === tab)!;
  const exportFn =
    tab === 'permits' ? exportPermits :
    tab === 'sites' ? exportSites :
    tab === 'hw' ? () => downloadCsv(`envis-hw-register-${new Date().toISOString().slice(0, 10)}.csv`, hw.map((r) => ({ app_no: r.appNo, hw_gr_no: r.hwGrNo, company: r.company, municipality: r.municipality, province: r.province, issued: r.issued ?? '', expiry: r.expiry ?? '', lifecycle: r.lifecycle, ecc: r.eccNos.join('|'), cnc: r.cncNos.join('|'), waste_codes: r.wasteCodes.map((c) => c.code).join('|'), site_id: r.siteId ?? '' }))) :
    tab === 'clearances' ? () => downloadCsv(`envis-clearances-${new Date().toISOString().slice(0, 10)}.csv`, clearances.map((c) => ({ number: c.number, type: c.type, company: c.company, municipality: c.municipality, province: c.province, issued: c.issued ?? '', expiry: c.expiry ?? '', lifecycle: c.lifecycle, app_no: c.appNo, hw_gr_no: c.hwGrNo, linked_permits: c.permitRefs.join('|'), site_id: c.siteId ?? '' }))) :
    exportAudit;

  return (
    <div className="animate-fade-up space-y-4">
      <SectionHeading
        eyebrow="Registers"
        title="Data tables"
        description="Browse the complete normalised registers as compiled for this build. Global filters apply to permit and establishment tables; the audit trail is unfiltered."
        action={
          <>
            {tab === 'permits' && (
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-[10.5px] text-slate-400">
                <input type="checkbox" checked={showFlags} onChange={(event) => setShowFlags(event.target.checked)} className="h-3 w-3 accent-emerald-500" />
                Show QA flags
              </label>
            )}
            {getSession()?.role !== 'rd' && (
              <button type="button" className="btn btn-primary" onClick={() => requestExport(exportFn)}>
                <Download size={13} /> Export view
              </button>
            )}
          </>
        }
      />

      <Panel bodyClassName="p-3" title={activeMeta.label} subtitle={`${activeMeta.hint} · ${formatNumber(tab === 'permits' ? permits.length : tab === 'sites' ? sites.length : tab === 'hw' ? hw.length : tab === 'clearances' ? clearances.length : auditRows.length)} rows`}>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition',
                tab === entry.id ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200' : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200',
              )}
            >
              <Table2 size={12} /> {entry.label}
            </button>
          ))}
          <div className="ml-auto self-center text-[10px] text-slate-600">
            {tab === 'audit' ? 'Normalisation log, newest first' : 'Follows the filters in the top bar'}
          </div>
        </div>

        {tab === 'permits' && (
          <DataTable<Permit>
            rows={permits}
            columns={permitColumns}
            rowKey={(row) => row.id}
            onRowClick={(row) => row.siteId && selectSite(row.siteId)}
            pageSize={50}
            maxHeight="max-h-[640px]"
            initialSort={{ key: 'expiry', direction: 'desc' }}
            empty={<div className="py-12 text-center text-[12px] text-slate-500">No permit records match the current filters.</div>}
          />
        )}
        {tab === 'sites' && (
          <DataTable<Site>
            rows={sites}
            columns={siteColumns}
            rowKey={(row) => row.id}
            onRowClick={(row) => selectSite(row.id)}
            pageSize={50}
            maxHeight="max-h-[640px]"
            initialSort={{ key: 'company', direction: 'asc' }}
            empty={<div className="py-12 text-center text-[12px] text-slate-500">No establishments match the current filters.</div>}
          />
        )}
        {tab === 'hw' && (
          <DataTable<HwRegistration>
            rows={hw}
            columns={hwColumns}
            rowKey={(row) => row.id}
            onRowClick={(row) => row.siteId && selectSite(row.siteId)}
            pageSize={50}
            maxHeight="max-h-[640px]"
            initialSort={{ key: 'company', direction: 'asc' }}
            empty={<div className="py-12 text-center text-[12px] text-slate-500">No hazardous-waste registrations match the current filters.</div>}
          />
        )}
        {tab === 'clearances' && (
          <DataTable<Clearance>
            rows={clearances}
            columns={clearanceColumns}
            rowKey={(row) => row.id}
            onRowClick={(row) => row.siteId && selectSite(row.siteId)}
            pageSize={50}
            maxHeight="max-h-[640px]"
            initialSort={{ key: 'number', direction: 'asc' }}
            empty={<div className="py-12 text-center text-[12px] text-slate-500">No clearances match the current filters.</div>}
          />
        )}
        {tab === 'audit' && (
          <DataTable<(typeof auditRows)[number]>
            rows={auditRows}
            columns={auditColumns}
            rowKey={(row) => `${row.at}-${row.permitNo}-${row.field}-${row.action}`}
            pageSize={50}
            maxHeight="max-h-[640px]"
            empty={<div className="py-12 text-center text-[12px] text-slate-500">No audit entries.</div>}
          />
        )}
      </Panel>
    </div>
  );
}
