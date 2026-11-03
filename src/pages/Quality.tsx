import { useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, ClipboardList, Copy, FileWarning, Filter, ListChecks,
  ShieldQuestion, Table2, Wrench,
} from 'lucide-react';
import clsx from 'clsx';
import { useDashboard } from '../store/useDashboard';
import { Chip, DataTable, MetricRow, Panel, SectionHeading, StatCard, type Column } from '../components/ui';
import { QA_HELP, QA_LABELS, formatDateTime, formatNumber } from '../lib/format';
import type { QualityData } from '../types';

type TabId = 'flags' | 'coordinates' | 'audit' | 'review' | 'duplicates' | 'skipped';

const TABS: { id: TabId; label: string; icon: typeof ListChecks }[] = [
  { id: 'flags', label: 'QA flags', icon: ListChecks },
  { id: 'coordinates', label: 'Coordinates', icon: AlertTriangle },
  { id: 'audit', label: 'Audit trail', icon: ClipboardList },
  { id: 'review', label: 'Review queue', icon: ShieldQuestion },
  { id: 'duplicates', label: 'Duplicates', icon: Copy },
  { id: 'skipped', label: 'Skipped rows', icon: FileWarning },
];

type AuditRow = QualityData['audit'][number];
type ReviewRow = QualityData['reviewQueue'][number];
type DuplicateRow = QualityData['duplicates'][number];
type SkippedRow = QualityData['skipped'][number];

export function QualityPage() {
  const data = useDashboard((state) => state.data);
  const [tab, setTab] = useState<TabId>('flags');
  const [action, setAction] = useState('all');
  const [field, setField] = useState('all');

  const quality = data?.quality;
  const meta = data?.meta;

  const auditRows = useMemo(() => {
    if (!quality) return [];
    return quality.audit.filter((row) => {
      if (action !== 'all' && row.action !== action) return false;
      if (field !== 'all' && row.field !== field) return false;
      return true;
    });
  }, [quality, action, field]);

  const flagTotal = useMemo(() => (meta?.qa ?? []).reduce((sum, entry) => sum + entry.count, 0), [meta]);

  const auditColumns: Column<AuditRow>[] = [
    { key: 'at', header: 'Logged', sortValue: (row) => row.at, render: (row) => <span className="whitespace-nowrap font-mono text-[9.5px] text-slate-500">{row.at}</span> },
    { key: 'permit', header: 'Permit', sortValue: (row) => row.permitNo, render: (row) => <div className="min-w-[150px]"><div className="font-mono text-[10px] text-slate-300">{row.permitNo}</div><div className="truncate text-[9.5px] text-slate-600">{row.company}</div></div> },
    { key: 'type', header: 'Type', render: (row) => <Chip tone={row.type === 'DP' ? 'sky' : 'violet'}>{row.type}</Chip> },
    { key: 'field', header: 'Field', sortValue: (row) => row.field, render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-400">{row.field}</span> },
    {
      key: 'change',
      header: 'Original → normalised',
      render: (row) => (
        <div className="max-w-[260px] space-y-0.5 text-[10px]">
          <div className="truncate text-slate-600 line-through">{row.original || '(blank)'}</div>
          <div className="truncate text-slate-300">{row.clean || '(blank)'}</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortValue: (row) => row.action,
      render: (row) => (
        <Chip tone={row.action === 'REVIEW' ? 'amber' : row.action === 'EXCLUDED' ? 'rose' : row.action === 'AUTO-FIX' ? 'sky' : 'emerald'}>{row.action}</Chip>
      ),
    },
    { key: 'reason', header: 'Reason', render: (row) => <span className="block max-w-[340px] text-[10px] leading-snug text-slate-500">{row.reason}</span> },
  ];

  const reviewColumns: Column<ReviewRow>[] = [
    { key: 'permit', header: 'Permit', sortValue: (row) => row.permitNo, render: (row) => <div className="min-w-[150px]"><div className="font-mono text-[10px] text-slate-300">{row.permitNo}</div><div className="truncate text-[9.5px] text-slate-600">{row.company}</div></div> },
    { key: 'type', header: 'Type', render: (row) => <Chip tone={row.type === 'DP' ? 'sky' : 'violet'}>{row.type}</Chip> },
    { key: 'year', header: 'Year', sortValue: (row) => row.year, render: (row) => <span className="font-mono text-[10.5px] text-slate-400">{row.year}</span> },
    { key: 'lgu', header: 'LGU', sortValue: (row) => row.municipality, render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-400">{row.municipality || '—'}<span className="ml-1 text-slate-600">{row.province}</span></span> },
    { key: 'issue', header: 'Issue', sortValue: (row) => row.issue, render: (row) => <Chip tone="amber">{row.issue.replace(/_/g, ' ')}</Chip> },
    { key: 'action', header: 'Recommended action', render: (row) => <span className="block max-w-[420px] text-[10px] leading-snug text-slate-500">{row.action}</span> },
  ];

  const duplicateColumns: Column<DuplicateRow>[] = [
    { key: 'permitNo', header: 'Permit no.', sortValue: (row) => row.permitNo, render: (row) => <span className="font-mono text-[10.5px] text-slate-300">{row.permitNo}</span> },
    { key: 'type', header: 'Type', render: (row) => <Chip tone={row.type === 'DP' ? 'sky' : 'violet'}>{row.type}</Chip> },
    { key: 'company', header: 'Establishment', sortValue: (row) => row.company, render: (row) => <span className="block max-w-[320px] truncate text-[11px] text-slate-300">{row.company}</span> },
    { key: 'kept', header: 'Kept from', render: (row) => <span className="whitespace-nowrap text-[10.5px] text-emerald-300/80">{row.keptFrom}</span> },
    { key: 'dropped', header: 'Dropped from', render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-500">{row.droppedFrom}</span> },
  ];

  const skippedColumns: Column<SkippedRow>[] = [
    { key: 'tab', header: 'Tab', sortValue: (row) => row.tab, render: (row) => <span className="whitespace-nowrap font-mono text-[10px] text-slate-400">{row.tab}</span> },
    { key: 'row', header: 'Row', sortValue: (row) => row.row, render: (row) => <span className="font-mono text-[10.5px] text-slate-500">{row.row}</span> },
    { key: 'permitNo', header: 'Permit / application', render: (row) => <span className="block max-w-[240px] truncate text-[10.5px] text-slate-300">{row.permitNo || '—'}</span> },
    { key: 'company', header: 'Establishment', render: (row) => <span className="block max-w-[260px] truncate text-[10.5px] text-slate-400">{row.company || '—'}</span> },
    { key: 'reason', header: 'Reason', render: (row) => <Chip tone="rose">{row.reason}</Chip> },
  ];

  if (!data || !quality || !meta) return null;

  const actions = [...new Set(quality.audit.map((row) => row.action))];
  const fields = [...new Set(quality.audit.map((row) => row.field))];

  if (!data || !quality || !meta) return null;

  return (
    <div className="animate-fade-up space-y-4">
      <SectionHeading
        eyebrow="Data confidence"
        title="Data quality & normalisation"
        description="Every automatic correction is logged with its source row and rationale. Review queues highlight issues that cannot be resolved safely without a human checking the register or the project location."
        action={<Chip tone="slate"><Wrench size={10} /> Build {meta.generatedAt.slice(0, 10)}</Chip>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="QA flags" value={formatNumber(flagTotal)} hint={`${meta.qa.length} distinct flag types`} icon={<AlertTriangle size={17} />} accent="amber" />
        <StatCard label="Audit entries" value={formatNumber(meta.audit.rows)} hint="Automated changes logged" icon={<ClipboardList size={17} />} accent="sky" />
        <StatCard label="Review queue" value={formatNumber(meta.reviewQueue.length)} hint="Needs manual verification" icon={<ShieldQuestion size={17} />} accent="rose" />
        <StatCard label="Duplicates merged" value={formatNumber(meta.totals.duplicates)} hint="Retained the fullest copy" icon={<Copy size={17} />} accent="violet" />
        <StatCard label="Rows skipped" value={formatNumber(meta.totals.skippedRows)} hint="No establishment name or unusable row" icon={<FileWarning size={17} />} accent="slate" />
      </div>

      <Panel bodyClassName="p-0">
        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-3 pt-2">
          {TABS.map((entry) => {
            const Icon = entry.icon;
            const counts: Record<TabId, number> = {
              flags: meta.qa.length,
              coordinates: (data?.permits ?? []).filter((permit) => permit.coordStatus !== 'ok' || permit.qa.includes('possible_water')).length + (data?.hw ?? []).filter((registration) => registration.coordStatus !== 'ok' || registration.qa.includes('possible_water')).length,
              audit: quality.audit.length,
              review: quality.reviewQueue.length,
              duplicates: quality.duplicates.length,
              skipped: quality.skipped.length,
            };
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={clsx(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-[11.5px] font-medium transition',
                  tab === entry.id
                    ? 'border-emerald-400 text-emerald-200'
                    : 'border-transparent text-slate-500 hover:text-slate-300',
                )}
              >
                <Icon size={13} /> {entry.label}
                <span className="font-mono text-[9px] text-slate-600">{counts[entry.id]}</span>
              </button>
            );
          })}
        </div>

        <div className="p-3">
          {tab === 'flags' && (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-3">
                {meta.qa.map((entry) => (
                  <div key={entry.name}>
                    <MetricRow
                      label={<span className="inline-flex items-center gap-1.5"><span className={clsx('h-1.5 w-1.5 rounded-full', entry.count > 500 ? 'bg-rose-400' : entry.count > 100 ? 'bg-amber-400' : 'bg-sky-400')} />{QA_LABELS[entry.name] ?? entry.name}</span>}
                      value={entry.count}
                      max={Math.max(1, meta.qa[0]?.count ?? 1)}
                      tone={entry.count > 500 ? 'bg-rose-400' : entry.count > 100 ? 'bg-amber-400' : 'bg-sky-400'}
                    />
                    <div className="mt-1 pl-3 text-[10px] leading-snug text-slate-600">{QA_HELP[entry.name] ?? 'Additional quality flag raised during normalisation.'}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <h3 className="panel-title mb-2">Corrections by action</h3>
                  <div className="space-y-2">
                    {meta.audit.byAction.map((entry) => (
                      <MetricRow key={entry.name} label={entry.name} value={entry.count} max={Math.max(1, meta.audit.rows)} tone="bg-emerald-400" />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <h3 className="panel-title mb-2">Corrections by field</h3>
                  <div className="space-y-2">
                    {meta.audit.byField.map((entry) => (
                      <MetricRow key={entry.name} label={entry.name} value={entry.count} max={Math.max(1, meta.audit.rows)} tone="bg-sky-400" />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] p-3 text-[10.5px] leading-relaxed text-emerald-100/70">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-200"><CheckCircle2 size={12} /> Conservative by design</div>
                  Missing values are never invented. Barangays are only derived from explicit markers in the address, and coordinates are only corrected when both the original and corrected pair are plausible.
                </div>
              </div>
            </div>
          )}

          {tab === 'coordinates' && (
            <DataTable
              rows={[
                ...data.permits
                  .filter((permit) => permit.coordStatus !== 'ok' || permit.qa.includes('possible_water'))
                  .map((permit) => ({
                    kind: permit.type,
                    id: permit.id,
                    company: permit.company,
                    municipality: permit.municipality,
                    province: permit.province,
                    coordStatus: permit.coordStatus,
                    lat: permit.lat,
                    lon: permit.lon,
                    issue: permit.qa.includes('possible_water') ? 'Possible water / no land cover' : QA_LABELS[permit.coordStatus === 'missing' ? 'no_coordinates' : permit.coordStatus === 'invalid' ? 'invalid_coordinates' : 'coordinates_suspect'] ?? permit.coordStatus,
                    siteId: permit.siteId ?? null,
                  })),
                ...data.hw
                  .filter((registration) => registration.coordStatus !== 'ok' || registration.qa.includes('possible_water'))
                  .map((registration) => ({
                    kind: 'HW',
                    id: registration.id,
                    company: registration.company,
                    municipality: registration.municipality,
                    province: registration.province,
                    coordStatus: registration.coordStatus,
                    lat: registration.lat,
                    lon: registration.lon,
                    issue: registration.qa.includes('possible_water') ? 'Possible water / no land cover' : QA_LABELS[registration.coordStatus === 'missing' ? 'no_coordinates' : registration.coordStatus === 'invalid' ? 'invalid_coordinates' : 'coordinates_suspect'] ?? registration.coordStatus,
                    siteId: registration.siteId,
                  })),
              ]}
              columns={[
                { key: 'kind', header: 'Type', sortValue: (row) => row.kind, render: (row) => <Chip tone={row.kind === 'DP' ? 'sky' : row.kind === 'PTO' ? 'violet' : 'amber'}>{row.kind}</Chip> },
                { key: 'company', header: 'Establishment', sortValue: (row) => row.company, render: (row) => <span className="block max-w-[260px] truncate font-medium text-slate-200">{row.company}</span> },
                { key: 'lgu', header: 'LGU', sortValue: (row) => row.municipality, render: (row) => <span className="text-[10.5px] text-slate-400">{row.municipality}, {row.province}</span> },
                { key: 'status', header: 'Coord status', sortValue: (row) => row.coordStatus, render: (row) => <span className="font-mono text-[10px] text-slate-400">{row.coordStatus}</span> },
                { key: 'coords', header: 'Coordinates', render: (row) => <span className="font-mono text-[9.5px] text-slate-500">{row.lat === null ? '—' : `${row.lat.toFixed(5)}, ${row.lon?.toFixed(5)}`}</span> },
                { key: 'issue', header: 'Issue', render: (row) => <span className="text-[10px] text-amber-300">{row.issue}</span> },
              ]}
              rowKey={(row) => row.id}
              onRowClick={(row) => row.siteId && useDashboard.getState().selectSite(row.siteId)}
              pageSize={50}
              maxHeight="max-h-[640px]"
              initialSort={{ key: 'kind', direction: 'asc' }}
              empty={<div className="py-12 text-center text-[12px] text-slate-500">No coordinate issues detected.</div>}
            />
          )}

          {tab === 'audit' && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Filter size={12} className="text-slate-500" />
                <select className="select h-7 w-auto text-[10.5px]" value={action} onChange={(event) => setAction(event.target.value)}>
                  <option value="all">All actions</option>
                  {actions.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <select className="select h-7 w-auto text-[10.5px]" value={field} onChange={(event) => setField(event.target.value)}>
                  <option value="all">All fields</option>
                  {fields.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <span className="ml-auto text-[10px] text-slate-600">{formatNumber(auditRows.length)} matching entries</span>
              </div>
              <DataTable<AuditRow>
                rows={auditRows}
                columns={auditColumns}
                rowKey={(row) => `${row.at}-${row.permitNo}-${row.field}-${row.action}`}
                pageSize={30}
                maxHeight="max-h-[560px]"
                empty={<div className="py-10 text-center text-[11px] text-slate-500">No audit entries match these filters.</div>}
              />
            </div>
          )}

          {tab === 'review' && (
            <div className="space-y-2">
              <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.05] px-3 py-2 text-[10.5px] text-amber-100/80">
                These records need a source check. The pipeline did not auto-correct them because doing so could create a false location or identity.
              </div>
              <DataTable<ReviewRow> rows={quality.reviewQueue} columns={reviewColumns} rowKey={(row) => `${row.type}-${row.permitNo}-${row.issue}`} pageSize={30} maxHeight="max-h-[560px]" />
            </div>
          )}

          {tab === 'duplicates' && (
            <div className="space-y-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10.5px] text-slate-500">
                Duplicate permit numbers are resolved by keeping the most complete row (latest tab with usable dates and coordinates). The dropped source is preserved here for traceability.
              </div>
              <DataTable<DuplicateRow> rows={quality.duplicates} columns={duplicateColumns} rowKey={(row) => `${row.permitNo}-${row.droppedFrom}`} pageSize={30} maxHeight="max-h-[560px]" />
            </div>
          )}

          {tab === 'skipped' && (
            <div className="space-y-2">
              <div className="rounded-xl border border-rose-400/15 bg-rose-400/[0.045] px-3 py-2 text-[10.5px] text-rose-100/80">
                Rows without an establishment name are not usable as permits. PTO 2025 contains application-only rows that are excluded from the dataset but retained for QA.
              </div>
              <DataTable<SkippedRow> rows={quality.skipped} columns={skippedColumns} rowKey={(row) => `${row.tab}-${row.row}`} pageSize={30} maxHeight="max-h-[560px]" />
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Source intake" subtitle="Workbook tabs compiled into this build" action={<Table2 size={14} className="text-slate-500" />}>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {meta.sources.tabs.map((source) => (
            <div key={source.key} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-[11px]">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-300">{source.sheet}</div>
                <div className="text-[9px] text-slate-600">{source.sheet}{source.columns ? ` · ${source.columns} cols` : ''}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-[10px] text-emerald-300/80">{formatNumber(source.rows)}</div>
                {source.error && <div className="text-[8.5px] text-rose-400">{source.error}</div>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-slate-600">Data fetched {formatDateTime(meta.sources.fetchedAt)} · dataset generated {formatDateTime(meta.generatedAt)}</div>
      </Panel>
    </div>
  );
}
