import { useEffect, useMemo, useState } from 'react';
import {
  Building2, ChevronRight, Download, FileWarning, Gavel, Landmark, MapPin, Scale, Search, ShieldAlert, Wallet, X,
} from 'lucide-react';
import clsx from 'clsx';
import { useDashboard } from '../store/useDashboard';
import { Chip, DataTable, EmptyState, Panel, SectionHeading, StatCard, type Column } from '../components/ui';
import { MapButton } from '../components/MapButton';
import { Chart, axisStyle, chartBase } from '../components/Chart';
import { requestExport } from '../lib/exportGate';
import { getSession } from '../lib/auth';
import {
  LEGAL_COVERAGE_STYLE, LEGAL_MATCH_LABEL, LEGAL_PAYMENT_STYLE, LEGAL_STATUS_STYLE, REGISTER_META,
  downloadCsv, formatDate, formatNumber, formatPeso,
} from '../lib/format';
import type { LegalCase, LegalEntity, LegalMatchMethod, LegalPayment, LegalStatus } from '../types';

type LegalView = 'entities' | 'docket' | 'pab';

const VIEWS: { id: LegalView; label: string; icon: typeof Gavel }[] = [
  { id: 'entities', label: 'Establishments', icon: Building2 },
  { id: 'docket', label: 'Docket tracker', icon: Gavel },
  { id: 'pab', label: 'PAB coverage', icon: Wallet },
];

const STATUS_TONE: Record<LegalStatus, string> = {
  CLOSED: 'chip-emerald',
  OPEN: 'chip-rose',
  PARTIAL: 'chip-amber',
  UNKNOWN: 'chip-slate',
};

function StatusBadge({ status }: { status: LegalStatus }) {
  return <Chip tone={STATUS_TONE[status]}>{LEGAL_STATUS_STYLE[status].label}</Chip>;
}

function PaymentBadge({ payment }: { payment: LegalPayment }) {
  return <Chip tone={LEGAL_PAYMENT_STYLE[payment].chip.replace('chip-', '')}>{LEGAL_PAYMENT_STYLE[payment].label}</Chip>;
}

function MatchBadge({ method }: { method: LegalMatchMethod }) {
  if (method === 'exact') return <Chip tone="emerald">Exact</Chip>;
  if (method === 'alias') return <Chip tone="sky">Normalised</Chip>;
  if (method === 'manual') return <Chip tone="violet">Reviewed</Chip>;
  return <Chip tone="slate">Not in register</Chip>;
}

function entityLabel(entity: LegalEntity): string {
  return entity.name || entity.legalNames[0] || 'Unnamed respondent';
}

function caseLabel(row: LegalCase): string {
  return row.displayCaseNo || row.caseNo || row.pabCaseNos[0] || '—';
}

function matchesQuery(values: Array<string | number | null | undefined>, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return values.some((value) => String(value ?? '').toLowerCase().includes(needle));
}

export function LegalPage() {
  const data = useDashboard((state) => state.data);
  const setPage = useDashboard((state) => state.setPage);
  const provinceFilter = useDashboard((state) => state.filters.province);
  const legalFocus = useDashboard((state) => state.legalFocus);
  const legal = data?.legal;

  const [view, setView] = useState<LegalView>('entities');
  const [search, setSearch] = useState('');
  const [year, setYear] = useState<'all' | string>('all');
  const [municipality, setMunicipality] = useState('all');
  const [status, setStatus] = useState<'all' | LegalStatus>('all');
  const [payment, setPayment] = useState<'all' | LegalPayment>('all');
  const [showOrphans, setShowOrphans] = useState(false);
  const [activeCase, setActiveCase] = useState<LegalCase | null>(null);

  const years = legal?.docketYears?.length ? legal.docketYears : ['2021', '2022', '2023', '2024', '2025', '2026'];

  const municipalities = useMemo(() => {
    if (!legal) return [];
    const values = new Set<string>();
    for (const row of legal.cases) {
      if (!row.municipality) continue;
      if (provinceFilter !== 'all' && row.province && row.province !== provinceFilter) continue;
      values.add(row.municipality);
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [legal, provinceFilter]);

  const scopedEntities = useMemo(() => {
    if (!legal) return [];
    return legal.entities.filter((entity) => {
      if (provinceFilter !== 'all' && entity.province !== provinceFilter) return false;
      if (municipality !== 'all' && entity.municipality !== municipality) return false;
      if (status !== 'all' && entity.status !== status) return false;
      if (payment !== 'all' && entity.payment !== payment) return false;
      if (year !== 'all' && !entity.years.includes(year)) return false;
      return matchesQuery([entity.name, entity.legalNames.join(' '), entity.municipality, entity.province], search);
    });
  }, [legal, provinceFilter, municipality, status, payment, year, search]);

  const scopedOrphans = useMemo(() => {
    if (!legal) return [];
    return legal.orphans.filter((entity) => {
      if (provinceFilter !== 'all' && entity.province !== provinceFilter) return false;
      if (municipality !== 'all' && entity.municipality !== municipality) return false;
      if (status !== 'all' && entity.status !== status) return false;
      if (payment !== 'all' && entity.payment !== payment) return false;
      if (year !== 'all' && !entity.years.includes(year)) return false;
      return matchesQuery([entity.name, entity.legalNames.join(' '), entity.municipality, entity.province], search);
    });
  }, [legal, provinceFilter, municipality, status, payment, year, search]);

  const scopedCases = useMemo(() => {
    if (!legal) return [];
    return legal.cases.filter((row) => {
      if (provinceFilter !== 'all' && row.province && row.province !== provinceFilter) return false;
      if (municipality !== 'all' && row.municipality !== municipality) return false;
      if (year !== 'all' && row.year !== year) return false;
      if (status !== 'all' && row.status !== status) return false;
      if (payment !== 'all' && row.payment !== payment) return false;
      return matchesQuery([row.displayCaseNo, row.caseNo, row.pabCaseNos.join(' '), row.establishment, row.entityName, row.municipality, row.province, row.iisRef], search);
    });
  }, [legal, provinceFilter, municipality, year, status, payment, search]);

  const entityByFacility = useMemo(() => {
    const map = new Map<string, LegalEntity>();
    if (!legal) return map;
    for (const entity of legal.entities) if (entity.facilityId) map.set(entity.facilityId, entity);
    return map;
  }, [legal]);

  const activeEntity = useMemo(() => {
    if (!legal || !activeCase) return null;
    return [...legal.entities, ...legal.orphans].find((entity) => entity.id === activeCase.entityId) ?? null;
  }, [legal, activeCase]);

  const openInDocket = (entityId: string) => {
    setView('docket');
    setSearch('');
    setYear('all');
    setStatus('all');
    setPayment('all');
    setMunicipality('all');
    const entity = legal ? [...legal.entities, ...legal.orphans].find((row) => row.id === entityId) : null;
    setSearch(entity ? entity.name : '');
  };

  /*
   * "View docket" hand-off from a map popup: jump straight to every docket row
   * for that establishment, with the year/status filters cleared so nothing is
   * hidden by the previous legal-view session.
   */
  useEffect(() => {
    if (!legalFocus || !legal) return;
    const entity = [...legal.entities, ...legal.orphans].find((row) => row.id === legalFocus.entityId);
    if (!entity) return;
    setView('docket');
    setSearch(entity.name);
    setYear('all');
    setMunicipality('all');
    setStatus('all');
    setPayment('all');
  }, [legalFocus, legal]);

  const exportCurrent = () => {
    if (!legal) return;
    if (view === 'entities') {
      const rows = scopedEntities.map((entity) => ({
        establishment: entityLabel(entity),
        legal_names: entity.legalNames.join(' | '),
        municipality: entity.municipality,
        province: entity.province,
        registers: entity.registers.join('|'),
        nov_cases: entity.novCount,
        pab_novs: entity.pabNovCount,
        erf_records: entity.erfCount,
        complaints: entity.complaintCount,
        payment: entity.payment,
        case_status: entity.status,
        years: entity.years.join('|'),
        match: entity.matchMethod,
      }));
      requestExport(() => downloadCsv(`envis-nov-establishments-${new Date().toISOString().slice(0, 10)}.csv`, rows));
      return;
    }
    if (view === 'docket') {
      const rows = scopedCases.map((row) => ({
        year: row.year,
        case_no: row.displayCaseNo || row.caseNo,
        pab_case_no: row.pabCaseNos.join('|'),
        iis_ref: row.iisRef,
        establishment: row.entityName ?? row.establishment,
        legal_respondent: row.establishment,
        municipality: row.municipality,
        province: row.province,
        record_type: row.type,
        stage: row.stageLabel,
        violations: row.violations.join('|'),
        status: row.status,
        payment: row.payment,
        match: row.matchMethod,
      }));
      requestExport(() => downloadCsv(`envis-nov-docket-${new Date().toISOString().slice(0, 10)}.csv`, rows));
    }
  };

  const entityColumns: Column<LegalEntity>[] = [
    {
      key: 'name',
      header: 'Establishment',
      sortValue: (row) => entityLabel(row),
      render: (row) => {
        const aliases = row.legalNames.filter((name) => name && name !== row.name);
        return (
          <div className="min-w-0 max-w-[280px]">
            <div className="truncate text-[12px] font-medium text-slate-100" title={row.name}>{entityLabel(row)}</div>
            {aliases.length > 0 && (
              <div className="truncate text-[10px] text-slate-500" title={aliases.join(' · ')}>
                also cited as {aliases.slice(0, 2).join(' · ')}
                {aliases.length > 2 ? ` +${aliases.length - 2}` : ''}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'location',
      header: 'Location',
      sortValue: (row) => `${row.municipality} ${row.province}`,
      render: (row) => (
        <div className="whitespace-nowrap text-[11.5px] text-slate-300">
          {row.municipality || '—'}
          <span className="text-slate-500">{row.province ? `, ${row.province}` : ''}</span>
        </div>
      ),
    },
    {
      key: 'registers',
      header: 'Register',
      sortValue: (row) => row.registers.join(''),
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.registers.map((id) => (
            <Chip key={id} tone={REGISTER_META[id].chip.replace('chip-', '')}>{id}</Chip>
          ))}
        </div>
      ),
    },
    {
      key: 'nov',
      header: 'NOV',
      sortValue: (row) => row.novCount,
      render: (row) => <span className="font-mono text-[11.5px] tabular-nums text-slate-200">{formatNumber(row.novCount)}</span>,
    },
    {
      key: 'pab',
      header: 'PAB',
      sortValue: (row) => row.pabNovCount,
      render: (row) => <span className="font-mono text-[11.5px] tabular-nums text-slate-200">{formatNumber(row.pabNovCount)}</span>,
    },
    {
      key: 'erf',
      header: 'ERF',
      sortValue: (row) => row.erfCount,
      render: (row) => <span className="font-mono text-[11.5px] tabular-nums text-slate-200">{formatNumber(row.erfCount)}</span>,
    },
    {
      key: 'complaints',
      header: 'Complaints',
      sortValue: (row) => row.complaintCount,
      render: (row) => <span className="font-mono text-[11.5px] tabular-nums text-slate-200">{formatNumber(row.complaintCount)}</span>,
    },
    {
      key: 'status',
      header: 'Case status',
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'payment',
      header: 'Payment',
      sortValue: (row) => row.payment,
      render: (row) => <PaymentBadge payment={row.payment} />,
    },
    {
      key: 'match',
      header: 'Match',
      sortValue: (row) => row.matchMethod,
      render: (row) => <MatchBadge method={row.matchMethod} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <MapButton lat={row.lat} lon={row.lon} label={entityLabel(row)} siteId={row.siteId} />
          <button
            type="button"
            className="btn btn-xs whitespace-nowrap"
            onClick={(event) => {
              event.stopPropagation();
              openInDocket(row.id);
            }}
          >
            Docket <ChevronRight size={11} />
          </button>
        </div>
      ),
    },
  ];

  const docketColumns: Column<LegalCase>[] = [
    {
      key: 'year',
      header: 'Year',
      sortValue: (row) => row.year,
      render: (row) => <span className="font-mono text-[11px] text-slate-300">{row.year}</span>,
    },
    {
      key: 'case',
      header: 'Case no.',
      sortValue: (row) => caseLabel(row),
      render: (row) => (
        <div className="min-w-0 max-w-[200px]">
          <div className="truncate text-[11.5px] font-medium text-slate-100">{caseLabel(row)}</div>
          <div className="truncate text-[10px] text-slate-500">
            {row.pabCaseNos[0] ? `PAB ${row.pabCaseNos[0]}` : row.iisRef || 'No reference'}
          </div>
        </div>
      ),
    },
    {
      key: 'establishment',
      header: 'Establishment',
      sortValue: (row) => row.entityName ?? row.establishment,
      render: (row) => (
        <div className="min-w-0 max-w-[260px]">
          <div className="truncate text-[11.5px] text-slate-200" title={row.entityName ?? row.establishment}>
            {row.entityName ?? row.establishment}
          </div>
          {row.entityName && row.entityName !== row.establishment && (
            <div className="truncate text-[10px] text-slate-500">cited as {row.establishment}</div>
          )}
        </div>
      ),
    },
    {
      key: 'municipality',
      header: 'Municipality',
      sortValue: (row) => row.municipality,
      render: (row) => <span className="whitespace-nowrap text-[11px] text-slate-300">{row.municipality || '—'}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      sortValue: (row) => row.type,
      render: (row) => <Chip tone={row.type === 'NOV' ? 'rose' : row.type === 'Complaint' ? 'amber' : row.type.startsWith('PAB') ? 'violet' : 'sky'}>{row.type}</Chip>,
    },
    {
      key: 'violations',
      header: 'Violations',
      sortValue: (row) => row.violations.join('|'),
      render: (row) => (
        <div className="flex max-w-[200px] flex-wrap gap-1">
          {row.violations.slice(0, 3).map((violation) => <Chip key={violation} tone="slate">{violation}</Chip>)}
          {row.violations.length > 3 && <Chip tone="slate">+{row.violations.length - 3}</Chip>}
          {!row.violations.length && <span className="text-[10px] text-slate-600">—</span>}
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      sortValue: (row) => row.stageLabel,
      render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-400">{row.stageLabel}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'payment',
      header: 'Payment',
      sortValue: (row) => row.payment,
      render: (row) => <PaymentBadge payment={row.payment} />,
    },
    {
      key: 'match',
      header: 'Match',
      sortValue: (row) => row.matchMethod,
      render: (row) => <MatchBadge method={row.matchMethod} />,
    },
  ];

  if (!data || !legal) return null;

  if (!legal.entities.length) {
    return (
      <div className="animate-fade-up space-y-5">
        <SectionHeading
          eyebrow="Enforcement"
          title="NOV & legal cases"
          description="Notices of violation, PAB cases, ERF payments and complaints intercrossed with DP, PTO and hazardous-waste establishments."
        />
        <Panel title="Legal dataset not built yet">
          <EmptyState
            icon={<Gavel size={20} />}
            title="No legal records loaded"
            description="Run npm run data:legal to build public/data/legal.json from the pinned Legal Dashboards snapshot, then reload."
          />
        </Panel>
      </div>
    );
  }

  const totalCollected = legal.pabByYear.reduce((sum, row) => sum + row.collected, 0);
  const chartYears = legal.pabByYear.filter((row) => row.pabNovIssued || row.penaltyRecords || row.erfRecords);

  return (
    <div className="animate-fade-up space-y-5">
      <SectionHeading
        eyebrow="Enforcement"
        title="NOV & legal cases"
        description="Establishments named in notices of violation, PAB cases, ERF payments and complaints — shown under the same name they carry in the DP, PTO and hazardous-waste registers. Payment amounts appear only in the PAB coverage view."
        action={
          <>
            <button type="button" className="btn" onClick={() => setPage('map')}>
              <MapPin size={13} /> Map
            </button>
            {view !== 'pab' && getSession()?.role !== 'rd' && (
              <button type="button" className="btn btn-primary" onClick={exportCurrent}>
                <Download size={13} /> Export {formatNumber(view === 'entities' ? scopedEntities.length : scopedCases.length)}
              </button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
        <span>
          Legal snapshot <span className="text-slate-300">{legal.dataDate || '—'}</span>
          {' · '}fetched {legal.fetchedAt ? new Date(legal.fetchedAt).toLocaleDateString('en-PH') : '—'}
          {' · '}scope {legal.scopeLabel || 'Cebu · Bohol'}
        </span>
        <span className="text-slate-600">
          {formatNumber(legal.totals.cases)} NOV cases · {formatNumber(legal.totals.pabNov)} PAB NOVs · {formatNumber(legal.totals.erf)} ERF records
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Matched establishments"
          value={formatNumber(legal.totals.matchedEntities)}
          hint={`${legal.matchQuality.exact} exact · ${legal.matchQuality.alias} normalised · ${legal.matchQuality.manual} reviewed`}
          icon={<Building2 size={17} />}
          accent="emerald"
        />
        <StatCard
          label="Open establishments"
          value={formatNumber(legal.totals.openEntities)}
          hint={`${formatNumber(legal.totals.closedEntities)} fully closed`}
          icon={<ShieldAlert size={17} />}
          accent="rose"
        />
        <StatCard
          label="NOV cases"
          value={formatNumber(legal.totals.cases)}
          hint={`${formatNumber(legal.totals.complaints)} complaints · ${formatNumber(legal.totals.erf)} ERF`}
          icon={<Gavel size={17} />}
          accent="amber"
        />
        <StatCard
          label="PAB collected"
          value={formatPeso(totalCollected)}
          hint="Penalty payments, 2023–2026"
          icon={<Wallet size={17} />}
          accent="sky"
        />
        <StatCard
          label="Not in DP / PTO / HW"
          value={formatNumber(legal.totals.unmatchedEntities)}
          hint={`${formatNumber(legal.candidateCount)} possible matches to review`}
          icon={<FileWarning size={17} />}
          accent="violet"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition',
              view === id ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/25' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
            )}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {view !== 'pab' && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={view === 'entities' ? 'Search establishment or cited name…' : 'Search case no., PAB no., establishment…'}
              className="input h-8 w-full pl-8"
            />
          </div>
          <select value={year} onChange={(event) => setYear(event.target.value)} className="select h-8">
            <option value="all">All years</option>
            {years.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={municipality} onChange={(event) => setMunicipality(event.target.value)} className="select h-8">
            <option value="all">All municipalities</option>
            {municipalities.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as 'all' | LegalStatus)} className="select h-8">
            <option value="all">Any status</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="PARTIAL">Partly closed</option>
            <option value="UNKNOWN">No status</option>
          </select>
          <select value={payment} onChange={(event) => setPayment(event.target.value as 'all' | LegalPayment)} className="select h-8">
            <option value="all">Any payment</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="MIXED">Mixed</option>
            <option value="NONE">No record</option>
          </select>
          {(search || year !== 'all' || municipality !== 'all' || status !== 'all' || payment !== 'all') && (
            <button
              type="button"
              className="btn btn-xs"
              onClick={() => { setSearch(''); setYear('all'); setMunicipality('all'); setStatus('all'); setPayment('all'); }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {view === 'entities' && (
        <div className="space-y-4">
          <Panel
            title="Establishments with NOVs, PAB cases, ERF or complaints"
            subtitle={`Names follow the DP, PTO and hazardous-waste registers. ${formatNumber(scopedEntities.length)} of ${formatNumber(legal.entities.length)} matched establishments in the current filter.`}
            bodyClassName="p-0"
          >
            <DataTable
              rows={scopedEntities}
              columns={entityColumns}
              rowKey={(row) => row.id}
              initialSort={{ key: 'nov', direction: 'desc' }}
              pageSize={50}
              maxHeight="max-h-[620px]"
              empty={<EmptyState icon={<Building2 size={20} />} title="No establishments match" description="Adjust the year, municipality, status or payment filters." />}
            />
          </Panel>

          <Panel
            title={
              <button type="button" className="inline-flex items-center gap-2 text-left" onClick={() => setShowOrphans((value) => !value)}>
                <ChevronRight size={14} className={clsx('transition', showOrphans && 'rotate-90')} />
                Respondents not found in DP, PTO or HW registers
                <Chip tone="slate">{formatNumber(scopedOrphans.length)}</Chip>
              </button>
            }
            subtitle="Kept for completeness so no legal record disappears. These are never plotted on the map because no register coordinate exists."
            bodyClassName={showOrphans ? 'p-0' : 'hidden'}
          >
            <DataTable
              rows={scopedOrphans}
              columns={[
                {
                  key: 'name',
                  header: 'Legal respondent',
                  sortValue: (row) => entityLabel(row),
                  render: (row) => (
                    <div className="min-w-0 max-w-[320px]">
                      <div className="truncate text-[12px] text-slate-200">{entityLabel(row)}</div>
                      {row.legalNames.length > 1 && (
                        <div className="truncate text-[10px] text-slate-500">{row.legalNames.slice(1, 3).join(' · ')}</div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'location',
                  header: 'Location',
                  sortValue: (row) => `${row.municipality} ${row.province}`,
                  render: (row) => <span className="whitespace-nowrap text-[11px] text-slate-400">{row.municipality || '—'}{row.province ? `, ${row.province}` : ''}</span>,
                },
                {
                  key: 'records',
                  header: 'Records',
                  sortValue: (row) => row.recordCount,
                  render: (row) => <span className="font-mono text-[11px] tabular-nums text-slate-300">{formatNumber(row.recordCount)}</span>,
                },
                {
                  key: 'nov',
                  header: 'NOV',
                  sortValue: (row) => row.novCount,
                  render: (row) => <span className="font-mono text-[11px] tabular-nums text-slate-300">{formatNumber(row.novCount)}</span>,
                },
                {
                  key: 'pab',
                  header: 'PAB',
                  sortValue: (row) => row.pabNovCount,
                  render: (row) => <span className="font-mono text-[11px] tabular-nums text-slate-300">{formatNumber(row.pabNovCount)}</span>,
                },
                {
                  key: 'erf',
                  header: 'ERF',
                  sortValue: (row) => row.erfCount,
                  render: (row) => <span className="font-mono text-[11px] tabular-nums text-slate-300">{formatNumber(row.erfCount)}</span>,
                },
                {
                  key: 'status',
                  header: 'Case status',
                  sortValue: (row) => row.status,
                  render: (row) => <StatusBadge status={row.status} />,
                },
                {
                  key: 'payment',
                  header: 'Payment',
                  sortValue: (row) => row.payment,
                  render: (row) => <PaymentBadge payment={row.payment} />,
                },
                {
                  key: 'actions',
                  header: '',
                  render: (row) => (
                    <button type="button" className="btn btn-xs" onClick={() => openInDocket(row.id)}>
                      Docket <ChevronRight size={11} />
                    </button>
                  ),
                },
              ]}
              rowKey={(row) => row.id}
              initialSort={{ key: 'records', direction: 'desc' }}
              pageSize={50}
              maxHeight="max-h-[520px]"
            />
          </Panel>
        </div>
      )}

      {view === 'docket' && (
        <Panel
          title="Case docket"
          subtitle={`${formatNumber(scopedCases.length)} docket rows in the current filter. Click a row for the raw source statuses.`}
          bodyClassName="p-0"
        >
          <DataTable
            rows={scopedCases}
            columns={docketColumns}
            rowKey={(row) => row.id}
            onRowClick={setActiveCase}
            initialSort={{ key: 'year', direction: 'desc' }}
            pageSize={50}
            maxHeight="max-h-[640px]"
            empty={<EmptyState icon={<Gavel size={20} />} title="No docket rows match" description="Adjust the year, municipality, status or payment filters." />}
          />
        </Panel>
      )}

      {view === 'pab' && (
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-3">
            <Panel className="xl:col-span-2" title="PAB coverage and collections" subtitle="Penalty amounts are shown only here, aggregated by source year.">
              <Chart
                height={280}
                option={{
                  ...chartBase(),
                  grid: { left: 10, right: 18, top: 32, bottom: 8, containLabel: true },
                  legend: { top: 0, right: 0, icon: 'roundRect', itemWidth: 8, itemHeight: 8, textStyle: { color: '#94a3b8', fontSize: 10.5 } },
                  tooltip: { ...chartBase().tooltip, valueFormatter: (value: unknown) => formatPeso(Number(value)) },
                  xAxis: { type: 'category', data: chartYears.map((row) => row.year), ...axisStyle() },
                  yAxis: {
                    type: 'value',
                    ...axisStyle(),
                    axisLabel: { ...axisStyle().axisLabel, formatter: (value: number) => `₱${(value / 1_000_000).toFixed(1)}M` },
                  },
                  series: [
                    { name: 'Assessed', type: 'bar', data: chartYears.map((row) => Math.round(row.assessed)), barWidth: '32%', itemStyle: { color: 'rgba(251, 191, 36, 0.55)', borderRadius: [4, 4, 0, 0] } },
                    { name: 'Collected', type: 'bar', data: chartYears.map((row) => Math.round(row.collected)), barWidth: '32%', itemStyle: { color: '#34d399', borderRadius: [4, 4, 0, 0] } },
                  ],
                }}
              />
            </Panel>
            <Panel title="How to read this" subtitle="Coverage differs by year in the source workbooks.">
              <ul className="space-y-2 text-[11.5px] leading-relaxed text-slate-400">
                <li><strong className="text-slate-200">2021–2022</strong> — master NOVs only. No PAB tab exists, so PAB counts and collections are shown as not covered.</li>
                <li><strong className="text-slate-200">2023</strong> — PAB NOV tab only; paid amounts are the OR lines embedded in that tab.</li>
                <li><strong className="text-slate-200">2024–2026</strong> — PAB penalty register; collections are the paid penalty records, not the NOV embedded amounts.</li>
                <li className="text-amber-300/90">Amounts are never attached to an individual establishment, NOV or case in this dashboard.</li>
              </ul>
            </Panel>
          </div>

          <Panel title="Yearly PAB records" subtitle="Assessed = penalty amount on file. Collected = records with a PAID status. ERF collections are shown separately." bodyClassName="p-0">
            <DataTable
              rows={legal.pabByYear}
              columns={[
                { key: 'year', header: 'Year', sortValue: (row) => row.year, render: (row) => <span className="font-mono text-[11.5px] text-slate-200">{row.year}</span> },
                { key: 'coverage', header: 'Coverage', sortValue: (row) => row.coverage, render: (row) => <Chip tone={LEGAL_COVERAGE_STYLE[row.coverage].chip.replace('chip-', '')}>{LEGAL_COVERAGE_STYLE[row.coverage].label}</Chip> },
                { key: 'nov', header: 'PAB NOVs', sortValue: (row) => row.pabNovIssued, render: (row) => <span className="font-mono text-[11px] tabular-nums text-slate-300">{formatNumber(row.pabNovIssued)}</span> },
                { key: 'orders', header: 'PAB orders', sortValue: (row) => row.pabOrders, render: (row) => <span className="font-mono text-[11px] tabular-nums text-slate-300">{formatNumber(row.pabOrders)}</span> },
                { key: 'pen', header: 'Penalty records', sortValue: (row) => row.penaltyRecords, render: (row) => <span className="font-mono text-[11px] tabular-nums text-slate-300">{formatNumber(row.penaltyRecords)}</span> },
                { key: 'paid', header: 'Paid', sortValue: (row) => row.paid, render: (row) => <span className="font-mono text-[11px] tabular-nums text-emerald-300">{formatNumber(row.paid)}</span> },
                { key: 'pending', header: 'Pending', sortValue: (row) => row.pending, render: (row) => <span className="font-mono text-[11px] tabular-nums text-amber-300">{formatNumber(row.pending)}</span> },
                { key: 'assessed', header: 'Assessed', sortValue: (row) => row.assessed, render: (row) => <span className="font-mono text-[11.5px] tabular-nums text-slate-200">{formatPeso(row.assessed)}</span> },
                { key: 'collected', header: 'Collected', sortValue: (row) => row.collected, render: (row) => <span className="font-mono text-[11.5px] tabular-nums text-emerald-300">{formatPeso(row.collected)}</span> },
                { key: 'erf', header: 'ERF collected', sortValue: (row) => row.erfCollected, render: (row) => <span className="font-mono text-[11.5px] tabular-nums text-sky-300">{formatPeso(row.erfCollected)}</span> },
                { key: 'note', header: 'Coverage note', render: (row) => <span className="text-[10.5px] text-slate-500">{row.note}</span> },
              ]}
              rowKey={(row) => row.year}
              maxHeight="max-h-none"
            />
          </Panel>
        </div>
      )}

      {activeCase && (
        <div className="fixed inset-0 z-[950] flex justify-end bg-black/55 backdrop-blur-sm" onClick={() => setActiveCase(null)}>
          <aside
            className="h-full w-full max-w-md overflow-y-auto border-l border-white/[0.08] bg-[#07110e] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80">{activeCase.type}</div>
                <h2 className="mt-1 truncate text-[17px] font-bold text-slate-100">{caseLabel(activeCase)}</h2>
                <p className="mt-0.5 truncate text-[11.5px] text-slate-500">{activeCase.iisRef || 'No IIS reference'}</p>
              </div>
              <button type="button" className="btn btn-xs" onClick={() => setActiveCase(null)}><X size={12} /></button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <StatusBadge status={activeCase.status} />
              <PaymentBadge payment={activeCase.payment} />
              <MatchBadge method={activeCase.matchMethod} />
              {activeCase.year && <Chip tone="slate">{activeCase.year}</Chip>}
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Register establishment</div>
              <div className="mt-0.5 text-[12.5px] font-medium text-slate-100">{activeCase.entityName ?? 'Not linked to a DP / PTO / HW record'}</div>
              <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">Cited by the docket</div>
              <div className="mt-0.5 text-[12px] text-slate-300">{activeCase.establishment}</div>
              {activeEntity && activeEntity.legalNames.length > 1 && (
                <div className="mt-1 text-[10.5px] text-slate-500">All cited names: {activeEntity.legalNames.join(' · ')}</div>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-[11.5px]">
              {[
                ['Docket year', activeCase.year],
                ['Source year', activeCase.sourceYear],
                ['Date docketed', activeCase.dateDocketed ? formatDate(activeCase.dateDocketed) : '—'],
                ['Municipality', activeCase.municipality || '—'],
                ['Province', activeCase.province || '—'],
                ['Document type', activeCase.documentType || '—'],
                ['Stage', activeCase.stageLabel],
                ['PAB case no.', activeCase.pabCaseNos.join(', ') || '—'],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-[9.5px] uppercase tracking-wider text-slate-500">{label}</dt>
                  <dd className="mt-0.5 text-slate-200">{value || '—'}</dd>
                </div>
              ))}
            </dl>

            {activeCase.address && (
              <div className="mt-3">
                <div className="text-[9.5px] uppercase tracking-wider text-slate-500">Address</div>
                <div className="mt-0.5 text-[11.5px] text-slate-300">{activeCase.address}</div>
              </div>
            )}

            {activeCase.violations.length > 0 && (
              <div className="mt-4">
                <div className="text-[9.5px] uppercase tracking-wider text-slate-500">Violations</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeCase.violations.map((violation) => <Chip key={violation} tone="rose">{violation}</Chip>)}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[9.5px] uppercase tracking-wider text-emerald-400/80">Closing signals</div>
                {activeCase.closedSignals.length ? (
                  <ul className="mt-1 space-y-1 text-[10.5px] text-slate-400">
                    {activeCase.closedSignals.map((signal) => <li key={signal}>• {signal}</li>)}
                  </ul>
                ) : <p className="mt-1 text-[10.5px] text-slate-600">None on file</p>}
              </div>
              <div>
                <div className="text-[9.5px] uppercase tracking-wider text-amber-400/80">Open signals</div>
                {activeCase.openSignals.length ? (
                  <ul className="mt-1 space-y-1 text-[10.5px] text-slate-400">
                    {activeCase.openSignals.map((signal) => <li key={signal}>• {signal}</li>)}
                  </ul>
                ) : <p className="mt-1 text-[10.5px] text-slate-600">None on file</p>}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[10.5px] text-slate-400">
              <div className="mb-1 text-[9.5px] uppercase tracking-wider text-slate-500">Linked records</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(activeCase.types).filter(([, count]) => count > 0).map(([key, count]) => (
                  <Chip key={key} tone="slate">{key} {count}</Chip>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {activeEntity && (
                <MapButton lat={activeEntity.lat} lon={activeEntity.lon} label={entityLabel(activeEntity)} siteId={activeEntity.siteId} />
              )}
              {activeEntity && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setActiveCase(null);
                    openInDocket(activeEntity.id);
                  }}
                >
                  <Landmark size={12} /> All cases for this establishment
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
