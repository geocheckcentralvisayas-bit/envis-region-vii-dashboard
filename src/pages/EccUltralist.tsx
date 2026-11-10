import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, FileCheck2, RefreshCw, Search } from 'lucide-react';
import { requestExport } from '../lib/exportGate';
import { getSession } from '../lib/auth';
import { useDashboard } from '../store/useDashboard';
import { Chip, DataTable, MetricRow, Panel, SectionHeading, StatCard, type Column } from '../components/ui';
import { MapButton } from '../components/MapButton';
import { Chart, axisStyle, chartBase } from '../components/Chart';
import {
  CLEARANCE_STYLE, LIFECYCLE_STYLE, downloadCsv, formatDate, formatNumber,
} from '../lib/format';
import type {
  EccUltraMatchMethod, EccUltraRecord, HwRegistration, Permit, Site,
} from '../types';

const MATCH_STYLE: Record<EccUltraMatchMethod, { label: string; chip: string; hint: string }> = {
  number: { label: 'Number', chip: 'chip-emerald', hint: 'Matched by exact ECC / CNC reference number' },
  exact: { label: 'Name', chip: 'chip-sky', hint: 'Matched by exact proponent name' },
  alias: { label: 'Alias', chip: 'chip-violet', hint: 'Matched by normalised proponent name' },
  none: { label: 'No match', chip: 'chip-slate', hint: 'No DP, PTO or hazardous-waste record found' },
};

const PROVINCE_OPTIONS = [
  { id: 'all', label: 'All provinces' },
  { id: 'Cebu', label: 'Cebu' },
  { id: 'Bohol', label: 'Bohol' },
];

const KIND_OPTIONS = [
  { id: 'all', label: 'ECC and CNC' },
  { id: 'ECC', label: 'ECC only' },
  { id: 'CNC', label: 'CNC only' },
];

const LINK_OPTIONS = [
  { id: 'all', label: 'All records' },
  { id: 'linked', label: 'With DP / PTO / HW link' },
  { id: 'unlinked', label: 'Without a register link' },
];

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
  label: string;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
      <span className="hidden sm:inline">{label}</span>
      <select className="select h-9 min-w-[128px]" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function DetailValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">{label}</div>
      <div className="mt-0.5 break-words text-[11.5px] leading-snug text-slate-300">{children || '—'}</div>
    </div>
  );
}

function LinkedPermits({
  record,
  permitByNo,
}: {
  record: EccUltraRecord;
  permitByNo: Map<string, Permit>;
}) {
  if (!record.permitNos.length) {
    return <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2 text-[11px] text-slate-600">No DP or PTO record linked.</div>;
  }
  return (
    <div className="space-y-1.5">
      {record.permitNos.slice(0, 12).map((number) => {
        const permit = permitByNo.get(number);
        return (
          <div key={number} className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.015] px-2.5 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Chip tone={permit?.type === 'DP' ? 'sky' : 'violet'}>{permit?.type ?? (number.startsWith('DP') ? 'DP' : 'PTO')}</Chip>
                <span className="truncate font-mono text-[10px] text-slate-300">{number}</span>
              </div>
              <div className="mt-0.5 text-[9.5px] text-slate-600">
                {[permit?.year ? String(permit.year) : '', permit?.municipality ?? ''].filter(Boolean).join(' · ') || 'Linked register record'}
              </div>
            </div>
            {permit && (
              <div className="shrink-0 text-right">
                <div className="text-[9px] text-slate-600">Expiry</div>
                <div className="whitespace-nowrap text-[9.5px] text-slate-400">{formatDate(permit.expiry)}</div>
                <Chip tone={LIFECYCLE_STYLE[permit.lifecycle].chip.replace('chip-', '')}>{permit.lifecycle}</Chip>
              </div>
            )}
          </div>
        );
      })}
      {record.permitNos.length > 12 && (
        <div className="text-[10px] text-slate-600">+{record.permitNos.length - 12} more permit references</div>
      )}
    </div>
  );
}

function LinkedHw({ record, hwByNo }: { record: EccUltraRecord; hwByNo: Map<string, HwRegistration> }) {
  if (!record.hwNos.length) {
    return <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2 text-[11px] text-slate-600">No hazardous-waste registration linked.</div>;
  }
  return (
    <div className="space-y-1.5">
      {record.hwNos.slice(0, 12).map((number) => {
        const registration = hwByNo.get(number);
        return (
          <div key={number} className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.015] px-2.5 py-2">
            <div className="min-w-0">
              <div className="font-mono text-[10px] text-amber-200">{number}</div>
              <div className="mt-0.5 text-[9.5px] text-slate-600">
                {[registration?.municipality, registration?.province].filter(Boolean).join(', ') || 'Hazardous-waste register'}
              </div>
            </div>
            {registration && (
              <div className="shrink-0 text-right">
                <div className="text-[9px] text-slate-600">Expiry</div>
                <div className="whitespace-nowrap text-[9.5px] text-slate-400">{formatDate(registration.expiry)}</div>
                <Chip tone={LIFECYCLE_STYLE[registration.lifecycle].chip.replace('chip-', '')}>{registration.lifecycle}</Chip>
              </div>
            )}
          </div>
        );
      })}
      {record.hwNos.length > 12 && (
        <div className="text-[10px] text-slate-600">+{record.hwNos.length - 12} more hazardous-waste registrations</div>
      )}
    </div>
  );
}

function RecordDetail({
  record,
  permitByNo,
  hwByNo,
  siteById,
}: {
  record: EccUltraRecord;
  permitByNo: Map<string, Permit>;
  hwByNo: Map<string, HwRegistration>;
  siteById: Map<string, Site>;
}) {
  const sites = record.siteIds.map((id) => siteById.get(id)).filter((site): site is Site => Boolean(site));
  const style = CLEARANCE_STYLE[record.kind];
  const match = MATCH_STYLE[record.matchMethod];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={style.chip.replace('chip-', '')}>{style.label}</Chip>
          <Chip tone={match.chip.replace('chip-', '')}>{match.label}</Chip>
          {record.sources.map((source) => <Chip key={source} tone="slate">{source}</Chip>)}
        </div>
        <div className="mt-2 font-mono text-[12px] font-semibold text-slate-200">{record.number || 'No reference number'}</div>
        <div className="mt-1 text-[13px] font-semibold leading-snug text-slate-100">{record.project || 'Untitled project'}</div>
        <div className="mt-0.5 text-[11px] text-slate-500">{record.proponent || 'Proponent not recorded'}</div>
        <div className="mt-2">
          <MapButton
            lat={record.lat}
            lon={record.lon}
            label={`${record.number || record.project} · ${record.proponent}`}
            siteId={record.siteIds[0] ?? null}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
        <DetailValue label="City / municipality">{record.municipality}</DetailValue>
        <DetailValue label="Province">{record.province}</DetailValue>
        <DetailValue label="Issued">{formatDate(record.issued)}</DetailValue>
        <DetailValue label="Year">{record.year ? String(record.year) : ''}</DetailValue>
        <DetailValue label="Status">{record.status}</DetailValue>
        <DetailValue label="Application">{record.applicationType}</DetailValue>
        <DetailValue label="Project type">{record.projectType}</DetailValue>
        <DetailValue label="Project size">{record.sizeAmount ? `${record.sizeAmount} ${record.sizeUnit}`.trim() : ''}</DetailValue>
        <DetailValue label="Within protected area">{record.withinPa}</DetailValue>
        <DetailValue label="Government project">{record.government}</DetailValue>
        <DetailValue label="Amendment">{record.amendment}</DetailValue>
        <DetailValue label="IIS / IS no.">{record.iis}</DetailValue>
      </div>

      {record.address && (
        <div className="border-t border-white/[0.06] pt-3">
          <DetailValue label="Address">{record.address}</DetailValue>
        </div>
      )}

      {record.remarks && (
        <div className="border-t border-white/[0.06] pt-3">
          <DetailValue label="Remarks">{record.remarks}</DetailValue>
        </div>
      )}

      <div className="border-t border-white/[0.06] pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">DP / PTO intercross</div>
          <div className="text-[10px] text-slate-600">{record.dpCount} DP · {record.ptoCount} PTO</div>
        </div>
        <LinkedPermits record={record} permitByNo={permitByNo} />
      </div>

      <div className="border-t border-white/[0.06] pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Hazardous-waste intercross</div>
          <div className="text-[10px] text-slate-600">{record.hwCount} HW GR</div>
        </div>
        <LinkedHw record={record} hwByNo={hwByNo} />
      </div>

      <div className="border-t border-white/[0.06] pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Linked establishments</div>
          <div className="text-[10px] text-slate-600">{record.siteCount}</div>
        </div>
        {sites.length ? (
          <div className="space-y-1.5">
            {sites.slice(0, 10).map((site) => (
              <div key={site.id} className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-2.5 py-2">
                <div className="text-[11px] font-medium text-slate-300">{site.company}</div>
                <div className="mt-0.5 text-[9.5px] text-slate-600">{[site.municipality, site.province].filter(Boolean).join(', ')}</div>
              </div>
            ))}
            {record.siteCount > 10 && <div className="text-[10px] text-slate-600">+{record.siteCount - 10} more establishments</div>}
          </div>
        ) : (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2 text-[11px] text-slate-600">
            No establishment in the DP / PTO / HW registers matched this record.
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] pt-3 text-[9.5px] leading-relaxed text-slate-600">
        {match.hint}. {record.coordSource === 'record' ? 'Map point comes from the ultralist row.' : record.coordSource === 'linked-site' ? 'Map point uses the exact linked establishment coordinate.' : 'No usable coordinate for this record.'}
      </div>
    </div>
  );
}

export function EccUltralistPage() {
  const data = useDashboard((state) => state.eccUltralist);
  const loading = useDashboard((state) => state.eccUltralistLoading);
  const error = useDashboard((state) => state.eccUltralistError);
  const load = useDashboard((state) => state.loadEccUltralist);
  const dashboardData = useDashboard((state) => state.data);

  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('all');
  const [kind, setKind] = useState('all');
  const [source, setSource] = useState('all');
  const [year, setYear] = useState('all');
  const [link, setLink] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const permitByNo = useMemo(
    () => new Map((dashboardData?.permits ?? []).map((permit) => [permit.permitNo, permit])),
    [dashboardData],
  );
  const hwByNo = useMemo(
    () => new Map((dashboardData?.hw ?? []).map((registration) => [registration.hwGrNo || registration.id, registration])),
    [dashboardData],
  );
  const siteById = useMemo(
    () => new Map((dashboardData?.sites ?? []).map((site) => [site.id, site])),
    [dashboardData],
  );

  const records = data?.records ?? [];
  const sourceOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const record of records) {
      for (const name of record.sources) seen.add(name);
    }
    return [{ id: 'all', label: 'All source tabs' }, ...[...seen].sort().map((name) => ({ id: name, label: name }))];
  }, [records]);

  const yearOptions = useMemo(() => {
    const years = [...new Set(records.map((record) => record.year).filter((value): value is number => value !== null))].sort((a, b) => b - a);
    return [{ id: 'all', label: 'All years' }, ...years.map((value) => ({ id: String(value), label: String(value) }))];
  }, [records]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      if (province !== 'all' && record.province !== province) return false;
      if (kind !== 'all' && record.kind !== kind) return false;
      if (source !== 'all' && !record.sources.includes(source)) return false;
      if (year !== 'all' && record.year !== Number(year)) return false;
      if (link === 'linked' && !record.matched) return false;
      if (link === 'unlinked' && record.matched) return false;
      if (!query) return true;
      return [
        record.number, record.project, record.proponent, record.municipality,
        record.province, record.projectType, record.iis, record.status, record.address,
      ].some((value) => String(value ?? '').toLowerCase().includes(query));
    });
  }, [records, province, kind, source, year, link, search]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((record) => record.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = useMemo(
    () => filtered.find((record) => record.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  const totals = data?.totals;
  const filteredCounts = useMemo(() => ({
    ecc: filtered.filter((record) => record.kind === 'ECC').length,
    cnc: filtered.filter((record) => record.kind === 'CNC').length,
    matched: filtered.filter((record) => record.matched).length,
    dp: filtered.filter((record) => record.dpCount > 0).length,
    pto: filtered.filter((record) => record.ptoCount > 0).length,
    hw: filtered.filter((record) => record.hwCount > 0).length,
  }), [filtered]);

  const yearSeries = useMemo(() => {
    const map = new Map<number, { ecc: number; cnc: number }>();
    for (const record of filtered) {
      if (!record.year) continue;
      const entry = map.get(record.year) ?? { ecc: 0, cnc: 0 };
      if (record.kind === 'CNC') entry.cnc += 1;
      else entry.ecc += 1;
      map.set(record.year, entry);
    }
    const years = [...map.keys()].sort((a, b) => a - b);
    return {
      years,
      ecc: years.map((value) => map.get(value)?.ecc ?? 0),
      cnc: years.map((value) => map.get(value)?.cnc ?? 0),
    };
  }, [filtered]);

  const lguSeries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of filtered) {
      const key = record.municipality || 'Unmatched';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).reverse();
    return { labels: top.map(([label]) => label), values: top.map(([, value]) => value) };
  }, [filtered]);

  const reset = () => {
    setSearch('');
    setProvince('all');
    setKind('all');
    setSource('all');
    setYear('all');
    setLink('all');
  };

  const columns: Column<EccUltraRecord>[] = [
    {
      key: 'number',
      header: 'Reference no.',
      sortValue: (row) => row.number || row.project,
      render: (row) => (
        <div className="min-w-[172px]">
          <div className="flex items-center gap-1.5">
            <Chip tone={CLEARANCE_STYLE[row.kind].chip.replace('chip-', '')}>{row.kind}</Chip>
            <span className="font-mono text-[10px] text-slate-300">{row.number || 'No number'}</span>
          </div>
          <div className="mt-0.5 truncate text-[9px] text-slate-600">{row.sources.join(' · ')}</div>
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Project / proponent',
      sortValue: (row) => row.project,
      render: (row) => (
        <div className="min-w-[240px] max-w-[380px]">
          <div className="line-clamp-2 text-[11px] font-medium leading-snug text-slate-200">{row.project || 'Untitled project'}</div>
          <div className="mt-0.5 truncate text-[10px] text-slate-500">{row.proponent || 'Proponent not recorded'}</div>
        </div>
      ),
    },
    {
      key: 'lgu',
      header: 'City / municipality',
      sortValue: (row) => `${row.municipality} ${row.province}`,
      render: (row) => (
        <div className="min-w-[130px]">
          <div className="truncate text-[10.5px] text-slate-300">{row.municipality || '—'}</div>
          <div className="text-[9.5px] text-slate-600">{row.province || '—'}</div>
        </div>
      ),
    },
    {
      key: 'issued',
      header: 'Issued / year',
      sortValue: (row) => row.year ?? 0,
      render: (row) => (
        <div className="whitespace-nowrap">
          <div className="text-[10.5px] text-slate-400">{row.year ?? '—'}</div>
          <div className="text-[9.5px] text-slate-600">{formatDate(row.issued)}</div>
        </div>
      ),
    },
    {
      key: 'links',
      header: 'Intercross',
      sortValue: (row) => row.dpCount + row.ptoCount + row.hwCount,
      render: (row) => (
        <div className="flex min-w-[120px] flex-wrap gap-1">
          {row.dpCount > 0 && <span className="chip chip-sky">DP {row.dpCount}</span>}
          {row.ptoCount > 0 && <span className="chip chip-violet">PTO {row.ptoCount}</span>}
          {row.hwCount > 0 && <span className="chip chip-amber">HW {row.hwCount}</span>}
          {!row.dpCount && !row.ptoCount && !row.hwCount && <span className="text-[9.5px] text-slate-600">—</span>}
        </div>
      ),
    },
    {
      key: 'match',
      header: 'Match',
      sortValue: (row) => row.matchMethod,
      render: (row) => <Chip tone={MATCH_STYLE[row.matchMethod].chip.replace('chip-', '')}>{MATCH_STYLE[row.matchMethod].label}</Chip>,
    },
    {
      key: 'action',
      header: '',
      render: (row) => (
        <MapButton
          lat={row.lat}
          lon={row.lon}
          label={`${row.number || row.project} · ${row.proponent}`}
          siteId={row.siteIds[0] ?? null}
        />
      ),
    },
  ];

  const exportRows = () =>
    downloadCsv(
      `envis-ecc-cnc-ultralist-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((record) => ({
        reference_no: record.number,
        type: record.kind,
        project: record.project,
        proponent: record.proponent,
        municipality: record.municipality,
        province: record.province,
        issued: record.issued ?? '',
        year: record.year ?? '',
        status: record.status,
        application_type: record.applicationType,
        project_type: record.projectType,
        source_tabs: record.sources.join('|'),
        match_method: record.matchMethod,
        linked_dp: record.dpCount,
        linked_pto: record.ptoCount,
        linked_hw: record.hwCount,
        permit_refs: record.permitNos.join('|'),
        hw_refs: record.hwNos.join('|'),
        latitude: record.lat ?? '',
        longitude: record.lon ?? '',
      })),
    );

  if (error && !data) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/20">
          <AlertTriangle size={20} />
        </div>
        <h1 className="mt-3 text-[15px] font-semibold text-slate-100">ECC / CNC ultralist could not be loaded</h1>
        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{error}</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => load()}>
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card grid min-h-[280px] place-items-center p-8 text-center">
        <div>
          <div className="mx-auto h-1 w-40 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-emerald-500/20 via-emerald-300 to-emerald-500/20" />
          </div>
          <p className="mt-3 text-[12px] text-slate-500">{loading ? 'Loading the ECC / CNC ultralist…' : 'Opening the ECC / CNC ultralist…'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <SectionHeading
        eyebrow="EIA ultralist"
        title="ECC and CNC Ultralist"
        description="Approved Environmental Compliance Certificates and Certificates of Non-Coverage from the EIA ultralist, limited to Cebu and Bohol and intercrossed with the DP, PTO and hazardous-waste registers."
        action={
          getSession()?.role !== 'rd' ? (
            <button type="button" className="btn btn-primary" onClick={() => requestExport(exportRows)}>
              <Download size={13} /> Export {formatNumber(filtered.length)}
            </button>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Ultralist records" value={formatNumber(totals?.records ?? 0)} hint={`${data.sources.length} source tabs · ${data.scopeLabel}`} icon={<FileCheck2 size={17} />} accent="emerald" />
        <StatCard label="ECC" value={formatNumber(totals?.ecc ?? 0)} hint="Environmental Compliance Certificates" icon={<FileCheck2 size={17} />} accent="emerald" onClick={() => setKind('ECC')} />
        <StatCard label="CNC" value={formatNumber(totals?.cnc ?? 0)} hint="Certificates of Non-Coverage" icon={<FileCheck2 size={17} />} accent="sky" onClick={() => setKind('CNC')} />
        <StatCard label="With DP link" value={formatNumber(totals?.linkedDp ?? 0)} hint="Records matched to a discharge permit" icon={<FileCheck2 size={17} />} accent="sky" />
        <StatCard label="With PTO link" value={formatNumber(totals?.linkedPto ?? 0)} hint="Records matched to a permit to operate" icon={<FileCheck2 size={17} />} accent="violet" />
        <StatCard label="With HW link" value={formatNumber(totals?.linkedHw ?? 0)} hint={`${formatNumber(totals?.linkedSites ?? 0)} linked establishments`} icon={<FileCheck2 size={17} />} accent="amber" />
      </div>

      <Panel bodyClassName="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              className="input h-9 w-full pl-8"
              placeholder="Search reference, project, proponent, LGU, address…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select label="Province" value={province} onChange={setProvince} options={PROVINCE_OPTIONS} />
          <Select label="Type" value={kind} onChange={setKind} options={KIND_OPTIONS} />
          <Select label="Source" value={source} onChange={setSource} options={sourceOptions} />
          <Select label="Year" value={year} onChange={setYear} options={yearOptions} />
          <Select label="Link" value={link} onChange={setLink} options={LINK_OPTIONS} />
          <button type="button" className="btn h-9" onClick={reset}>Reset</button>
          <div className="ml-auto text-[11px] text-slate-500">
            <span className="font-semibold text-slate-300">{formatNumber(filtered.length)}</span> of {formatNumber(records.length)} records
            <span className="ml-2 text-slate-600">{filteredCounts.ecc} ECC · {filteredCounts.cnc} CNC · {filteredCounts.matched} matched</span>
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="ECC and CNC by year" subtitle="Records with a recorded issue year in the current filter">
          <Chart
            height={280}
            option={{
              ...chartBase(),
              legend: { top: 0, right: 6, icon: 'roundRect', itemWidth: 10, itemHeight: 6, textStyle: { color: '#94a3b8', fontSize: 10 } },
              grid: { left: 8, right: 12, top: 30, bottom: 4, containLabel: true },
              xAxis: { type: 'category', data: yearSeries.years, ...axisStyle({ splitLine: { show: false } }) },
              yAxis: { type: 'value', ...axisStyle() },
              series: [
                { name: 'ECC', type: 'bar', stack: 'ultralist', data: yearSeries.ecc, barMaxWidth: 24, itemStyle: { color: '#34d399' } },
                { name: 'CNC', type: 'bar', stack: 'ultralist', data: yearSeries.cnc, barMaxWidth: 24, itemStyle: { color: '#38bdf8', borderRadius: [4, 4, 0, 0] } },
              ],
            }}
          />
        </Panel>

        <Panel title="Source tabs and scope" subtitle="Rows fetched, kept and excluded before matching">
          <div className="space-y-3">
            {data.sources.map((entry) => (
              <MetricRow
                key={entry.key}
                label={entry.sheet}
                value={entry.keptRows}
                max={Math.max(1, ...data.sources.map((item) => item.keptRows))}
                tone="bg-emerald-400"
                hint={`${formatNumber(entry.fetchedRows)} fetched · ${formatNumber(entry.excludedNegros + entry.excludedSiquijor)} excluded for Negros / Siquijor`}
              />
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2 text-[10px] leading-relaxed text-slate-500">
            Only Cebu and Bohol rows are retained. Duplicate reference numbers across tabs are merged into a single record.
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <Panel title="Top cities and municipalities" subtitle="Current filter · top 10 LGUs">
            <Chart
              height={240}
              option={{
                ...chartBase({ tooltip: { ...chartBase().tooltip, trigger: 'axis' } }),
                grid: { left: 8, right: 22, top: 6, bottom: 4, containLabel: true },
                xAxis: { type: 'value', ...axisStyle() },
                yAxis: {
                  type: 'category',
                  data: lguSeries.labels,
                  ...axisStyle({ splitLine: { show: false } }),
                  axisLabel: { color: '#94a3b8', fontSize: 9, width: 110, overflow: 'truncate' },
                },
                series: [
                  {
                    type: 'bar',
                    data: lguSeries.values,
                    barMaxWidth: 12,
                    itemStyle: { color: '#38bdf8', borderRadius: [0, 4, 4, 0] },
                    label: { show: true, position: 'right', color: '#8ea9a1', fontSize: 9 },
                  },
                ],
              }}
            />
          </Panel>

          <Panel bodyClassName="p-3" title="ECC / CNC register" subtitle={`${formatNumber(filtered.length)} records matching current filters`}>
            <DataTable<EccUltraRecord>
              rows={filtered}
              columns={columns}
              rowKey={(row) => row.id}
              onRowClick={(row) => setSelectedId(row.id)}
              pageSize={40}
              maxHeight="max-h-[640px]"
              initialSort={{ key: 'issued', direction: 'desc' }}
              empty={<div className="py-12 text-center text-[12px] text-slate-500">No ECC / CNC records match the current filters.</div>}
            />
          </Panel>
        </div>

        <Panel
          className="self-start xl:sticky xl:top-[76px]"
          title={selected ? selected.number || 'Record details' : 'Record details'}
          subtitle={selected ? `${selected.kind} · ${selected.matchMethod === 'none' ? 'no register match' : `${MATCH_STYLE[selected.matchMethod].label.toLowerCase()} match`}` : 'Select a row to inspect'}
          bodyClassName="p-3.5"
        >
          {selected ? (
            <RecordDetail record={selected} permitByNo={permitByNo} hwByNo={hwByNo} siteById={siteById} />
          ) : (
            <div className="grid min-h-[220px] place-items-center text-center text-[11.5px] text-slate-600">
              Select an ECC or CNC record from the register.
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Method and scope" subtitle="How this ultralist is built">
        <ul className="space-y-1.5 text-[11px] leading-relaxed text-slate-500">
          {data.notes.map((note) => (
            <li key={note} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/70" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-3 text-[10px] text-slate-600">
          <span>Reference date {data.referenceDate}</span>
          <span>Generated {new Date(data.generatedAt).toLocaleString('en-PH')}</span>
          <a className="hover:text-slate-400" href={data.sourceUrl} target="_blank" rel="noreferrer">Source workbook</a>
        </div>
      </Panel>
    </div>
  );
}
