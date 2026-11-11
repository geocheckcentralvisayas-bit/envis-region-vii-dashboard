import { X, MapPin, Building2, CalendarDays, ShieldAlert, ExternalLink } from 'lucide-react';
import { useDashboard } from '../store/useDashboard';
import { Chip } from './ui';
import { GAP_META, LIFECYCLE_STYLE, RISK_LABELS, CLEARANCE_STYLE, formatDate, riskColor, spatialSummary } from '../lib/format';

export function SiteDrawer() {
  const selectedSiteId = useDashboard((state) => state.selectedSiteId);
  const selectSite = useDashboard((state) => state.selectSite);
  const setPage = useDashboard((state) => state.setPage);
  const data = useDashboard((state) => state.data);

  if (!selectedSiteId || !data) return null;
  const site = data.sites.find((entry) => entry.id === selectedSiteId);
  if (!site) return null;
  const permits = data.permits
    .filter((permit) => permit.siteId === site.id)
    .sort((a, b) => (b.issued ?? '').localeCompare(a.issued ?? ''));
  const hwRegs = data.hw
    .filter((registration) => registration.siteId === site.id)
    .sort((a, b) => (b.issued ?? '').localeCompare(a.issued ?? ''));
  const siteClearances = [
    ...(site.eccNos ?? []).map((number) => ({ id: `ECC-${number}`, type: 'ECC' as const, number })),
    ...(site.cncNos ?? []).map((number) => ({ id: `CNC-${number}`, type: 'CNC' as const, number })),
    ...(site.ambiguousNos ?? []).map((number) => ({ id: `ECC/CNC-${number}`, type: 'ECC/CNC' as const, number })),
  ].sort((a, b) => a.type.localeCompare(b.type) || a.number.localeCompare(b.number));
  const gap = GAP_META[site.gap];

  return (
    <div className="fixed inset-0 z-[1200] no-print">
      <button type="button" aria-label="Close details" className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={() => selectSite(null)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col border-l border-emerald-400/15 bg-[#07110e] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Chip tone={gap.chip.replace('chip-', '')}>{gap.label}</Chip>
              <span className="font-mono text-[10px] text-slate-600">{site.id}</span>
            </div>
            <h2 className="text-[17px] font-bold leading-snug text-slate-50">{site.company}</h2>
            <p className="mt-1 flex items-center gap-1 text-[11.5px] text-slate-400">
              <MapPin size={12} className="text-emerald-400" />
              {[site.barangay, site.municipality, site.province].filter(Boolean).join(', ')}
            </p>
          </div>
          <button type="button" className="btn btn-ghost h-8 w-8 shrink-0 p-0" onClick={() => selectSite(null)}>
            <X size={16} />
          </button>
        </header>

        <div className="grid grid-cols-4 gap-px border-b border-white/[0.07] bg-white/[0.05]">
          {[
            { label: 'DP records', value: site.dpCount },
            { label: 'PTO records', value: site.ptoCount },
            { label: 'HW regs', value: site.hwCount, color: site.hwCount ? '#f59e0b' : undefined },
            { label: 'Spatial risk', value: site.risk, color: riskColor(site.risk) },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#07110e] px-3 py-3 text-center">
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</div>
              <div className="mt-1 text-xl font-bold" style={stat.color ? { color: stat.color } : undefined}>{stat.value}</div>
            </div>
          ))}
        </div>

        {siteClearances.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-white/[0.07] px-5 py-2.5">
            {siteClearances.map((clearance) => (
              <Chip key={clearance.id} tone={CLEARANCE_STYLE[clearance.type].chip.replace('chip-', '')}>
                {CLEARANCE_STYLE[clearance.type].label} · {clearance.number}
              </Chip>
            ))}
          </div>
        )}

        <div className="scroll-thin flex-1 space-y-4 overflow-auto px-5 py-4">
          <section>
            <h3 className="panel-title mb-2">Establishment profile</h3>
            <dl className="space-y-1.5 text-[12px]">
              <Row icon={<Building2 size={12} />} label="Industry" value={site.industry || 'Not classified'} />
              <Row icon={<MapPin size={12} />} label="Address" value={site.address || 'No address on file'} />
              <Row icon={<CalendarDays size={12} />} label="Latest permit issued" value={formatDate(site.latestIssued)} />
              <Row icon={<CalendarDays size={12} />} label="DP expiry" value={formatDate(site.dpExpiry)} />
              <Row icon={<CalendarDays size={12} />} label="PTO expiry" value={formatDate(site.ptoExpiry)} />
              <Row icon={<ShieldAlert size={12} />} label="Spatial flags" value={spatialSummary(site.spatial)} />
              <Row icon={<ShieldAlert size={12} />} label="Risk index" value={`${site.risk} / 10 · ${RISK_LABELS[site.risk] ?? '—'}`} />
            </dl>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="panel-title">Hazardous waste registration</h3>
              <span className="text-[10px] text-slate-500">{hwRegs.length} linked</span>
            </div>
            {hwRegs.length === 0 && <div className="text-[12px] text-slate-500">No hazardous-waste registration on file.</div>}
            <div className="space-y-2">
              {hwRegs.map((registration) => (
                <div key={registration.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10.5px] text-amber-300">{registration.hwGrNo || registration.appNo}</span>
                    <Chip tone={LIFECYCLE_STYLE[registration.lifecycle].chip.replace('chip-', '')}>{registration.lifecycle}</Chip>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px] text-slate-500">
                    <span>Sub type <b className="font-medium text-slate-300">{registration.subtype}</b></span>
                    <span>Issued <b className="font-medium text-slate-300">{formatDate(registration.issued)}</b></span>
                    <span>Expiry <b className="font-medium text-slate-300">{formatDate(registration.expiry)}</b></span>
                    <span>Waste codes <b className="font-medium text-slate-300">{registration.wasteCount}</b></span>
                  </div>
                  {registration.wasteCodes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {registration.wasteCodes.slice(0, 6).map((code) => (
                        <span key={code.code} className="rounded-md border border-white/[0.07] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-slate-400">
                          {code.code}
                        </span>
                      ))}
                      {registration.wasteCodes.length > 6 && (
                        <span className="text-[9px] text-slate-600">+{registration.wasteCodes.length - 6}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="panel-title">ECC / CNC clearances</h3>
              <span className="text-[10px] text-slate-500">{siteClearances.length} linked</span>
            </div>
            {siteClearances.length === 0 && <div className="text-[12px] text-slate-500">No ECC or CNC clearance reference on file.</div>}
            <div className="flex flex-wrap gap-1.5">
              {siteClearances.map((clearance) => (
                <Chip key={clearance.id} tone={CLEARANCE_STYLE[clearance.type].chip.replace('chip-', '')}>
                  {CLEARANCE_STYLE[clearance.type].label} · {clearance.number}
                </Chip>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="panel-title">Permit timeline</h3>
              <span className="text-[10px] text-slate-500">{permits.length} linked records</span>
            </div>
            <div className="space-y-2">
              {permits.map((permit) => {
                const tone = LIFECYCLE_STYLE[permit.lifecycle];
                return (
                  <div key={permit.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Chip tone={permit.type === 'DP' ? 'sky' : 'violet'}>{permit.type}</Chip>
                        <span className="font-mono text-[10.5px] text-slate-400">{permit.permitNo}</span>
                      </div>
                      <Chip tone={tone.chip.replace('chip-', '')}>{permit.lifecycle}</Chip>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px] text-slate-500">
                      <span>Issued <b className="font-medium text-slate-300">{formatDate(permit.issued)}</b></span>
                      <span>Expiry <b className="font-medium text-slate-300">{formatDate(permit.expiry)}</b></span>
                      <span>Year <b className="font-medium text-slate-300">{permit.year}</b></span>
                      <span>Source <b className="font-medium text-slate-300">{permit.sourceSheet}</b></span>
                    </div>
                    {(permit.waterbody || permit.wastewater) && (
                      <div className="mt-2 border-t border-white/[0.05] pt-1.5 text-[10.5px] text-slate-500">
                        {permit.wastewater && <div>Discharge: <span className="text-slate-300">{permit.wastewater}</span></div>}
                        {permit.waterbody && <div>Receiving water: <span className="text-slate-300">{permit.waterbody}</span></div>}
                      </div>
                    )}
                  </div>
                );
              })}
              {!permits.length && <div className="text-[12px] text-slate-500">No linked permits.</div>}
            </div>
          </section>

          <section className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] p-3 text-[11px] leading-relaxed text-emerald-100/70">
            Intercross method: <b className="text-emerald-200">{site.matchMethod}</b>. Sites are matched on
            normalised establishment name within the same city/municipality, with alias and fuzzy checks for
            branch naming differences.
          </section>
        </div>

        <footer className="flex items-center gap-2 border-t border-white/[0.07] px-5 py-3">
          <button type="button" className="btn btn-primary flex-1" onClick={() => { selectSite(null); setPage('map'); }}>
            <MapPin size={13} /> Open map
          </button>
          {site.lat !== null && site.lon !== null && (
            <a
              className="btn"
              href={`https://www.google.com/maps/search/?api=1&query=${site.lat},${site.lon}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={13} /> Coordinates
            </a>
          )}
        </footer>
      </aside>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 shrink-0 text-slate-600">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] text-slate-600">{label}</dt>
        <dd className="text-[11.5px] leading-snug text-slate-300">{value}</dd>
      </div>
    </div>
  );
}
