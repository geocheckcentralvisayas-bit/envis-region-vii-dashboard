import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertTriangle, Download, KeyRound, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserPlus, X,
} from 'lucide-react';
import clsx from 'clsx';
import {
  ROLES, addAccount, canManageAccounts, clearActivity, deleteAccount, getAccounts, getActivity, getSession,
  setAccountActive, setAccountPassword, updateAccount,
  type ActivityEntry, type ActivityType, type Role, type StoredAccount,
} from '../lib/auth';
import { requestExport } from '../lib/exportGate';
import { downloadCsv, formatNumber } from '../lib/format';
import { Chip, DataTable, Panel, SectionHeading, StatCard, type Column } from '../components/ui';

const ACTIVITY_TYPES: { id: ActivityType | 'all'; label: string }[] = [
  { id: 'all', label: 'All activity' },
  { id: 'login', label: 'Sign-ins' },
  { id: 'login-failed', label: 'Failed sign-ins' },
  { id: 'logout', label: 'Sign-outs' },
  { id: 'export', label: 'CSV exports' },
  { id: 'geojson', label: 'GeoJSON downloads' },
  { id: 'account-add', label: 'Accounts created' },
  { id: 'account-update', label: 'Account updates' },
  { id: 'account-delete', label: 'Accounts deleted' },
  { id: 'password-change', label: 'Password changes' },
  { id: 'role-change', label: 'Role changes' },
];

const ACTIVITY_TONE: Record<ActivityType, 'emerald' | 'rose' | 'slate' | 'sky' | 'violet' | 'amber'> = {
  login: 'emerald',
  'login-failed': 'rose',
  logout: 'slate',
  export: 'sky',
  geojson: 'violet',
  'account-add': 'emerald',
  'account-update': 'amber',
  'account-delete': 'rose',
  'password-change': 'amber',
  'role-change': 'violet',
};

function timeLabel(at: number): string {
  return new Date(at).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-slate-100">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-white/5 hover:text-slate-300">
            <X size={15} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function AdminPage() {
  const session = getSession();
  const [tab, setTab] = useState<'accounts' | 'activity'>('accounts');
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => getAccounts());
  const [activity, setActivity] = useState<ActivityEntry[]>(() => getActivity());
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', displayName: '', division: '', role: 'viewer' as Role, password: '', confirm: '' });

  const [editing, setEditing] = useState<StoredAccount | null>(null);
  const [editForm, setEditForm] = useState({ username: '', displayName: '', division: '', role: 'viewer' as Role });

  const [passwordFor, setPasswordFor] = useState<StoredAccount | null>(null);
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' });

  const [activityFilter, setActivityFilter] = useState<ActivityType | 'all'>('all');
  const [activitySearch, setActivitySearch] = useState('');

  useEffect(() => {
    const id = setInterval(() => setActivity(getActivity()), 5000);
    return () => clearInterval(id);
  }, []);

  const refreshAccounts = () => setAccounts(getAccounts());

  const flash = (message: string) => {
    setNotice(message);
    setError('');
    setActivity(getActivity());
  };

  const fail = (err: unknown) => {
    setError(err instanceof Error ? err.message : 'Something went wrong.');
    setNotice('');
  };

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (addForm.password !== addForm.confirm) {
      fail(new Error('Passwords do not match.'));
      return;
    }
    setBusy(true);
    try {
      await addAccount(addForm);
      refreshAccounts();
      setShowAdd(false);
      setAddForm({ username: '', displayName: '', division: '', role: 'viewer', password: '', confirm: '' });
      flash('Account created.');
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (account: StoredAccount) => {
    setEditing(account);
    setEditForm({ username: account.username, displayName: account.displayName, division: account.division, role: account.role });
    setError('');
    setNotice('');
  };

  const handleSaveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      await updateAccount(editing.username, editForm);
      refreshAccounts();
      setEditing(null);
      flash('Account updated.');
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const openPassword = (account: StoredAccount) => {
    setPasswordFor(account);
    setPwForm({ password: '', confirm: '' });
    setError('');
    setNotice('');
  };

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwordFor) return;
    if (pwForm.password !== pwForm.confirm) {
      fail(new Error('Passwords do not match.'));
      return;
    }
    setBusy(true);
    try {
      await setAccountPassword(passwordFor.username, pwForm.password);
      refreshAccounts();
      setPasswordFor(null);
      flash(`Password updated for ${passwordFor.username}.`);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = (account: StoredAccount) => {
    try {
      setAccountActive(account.username, !account.active);
      refreshAccounts();
      flash(`${account.username} ${account.active ? 'deactivated' : 'activated'}.`);
    } catch (err) {
      fail(err);
    }
  };

  const handleDelete = (account: StoredAccount) => {
    if (!window.confirm(`Delete account "${account.username}"? This cannot be undone.`)) return;
    try {
      deleteAccount(account.username);
      refreshAccounts();
      flash('Account deleted.');
    } catch (err) {
      fail(err);
    }
  };

  const filteredActivity = useMemo(() => {
    const query = activitySearch.trim().toLowerCase();
    return activity.filter((entry) => {
      if (activityFilter !== 'all' && entry.type !== activityFilter) return false;
      if (!query) return true;
      return [entry.username, entry.role, entry.detail].some((value) => String(value).toLowerCase().includes(query));
    });
  }, [activity, activityFilter, activitySearch]);

  const exportActivity = () =>
    downloadCsv(
      `envis-activity-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredActivity.map((entry) => ({
        timestamp: new Date(entry.at).toISOString(),
        type: entry.type,
        username: entry.username,
        role: entry.role,
        detail: entry.detail,
      })),
    );

  const handleClearActivity = () => {
    if (!window.confirm('Clear the activity log? This cannot be undone.')) return;
    clearActivity();
    setActivity([]);
    flash('Activity log cleared.');
  };

  const stats = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter((account) => account.active).length,
    mis: accounts.filter((account) => account.role === 'mis').length,
    exporters: accounts.filter((account) => account.role === '[redacted]' || account.role === 'mis').length,
  }), [accounts]);

  const activityStats = useMemo(() => ({
    total: activity.length,
    exports: activity.filter((entry) => entry.type === 'export').length,
    logins: activity.filter((entry) => entry.type === 'login').length,
    failed: activity.filter((entry) => entry.type === 'login-failed').length,
    changes: activity.filter((entry) => entry.type.startsWith('account-') || entry.type === 'password-change' || entry.type === 'role-change').length,
  }), [activity]);

  const accountColumns: Column<StoredAccount>[] = [
    {
      key: 'username',
      header: 'Username',
      sortValue: (row) => row.username,
      render: (row) => <span className="font-mono text-[11px] text-slate-200">{row.username}</span>,
    },
    {
      key: 'displayName',
      header: 'Display name',
      sortValue: (row) => row.displayName,
      render: (row) => <span className="text-[11px] text-slate-300">{row.displayName}</span>,
    },
    {
      key: 'division',
      header: 'Division',
      sortValue: (row) => row.division,
      render: (row) => <span className="text-[11px] text-slate-400">{row.division}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: (row) => row.role,
      render: (row) => <Chip tone={row.role === 'mis' ? 'violet' : row.role === 'rd' ? 'amber' : 'slate'}>{row.role}</Chip>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (row) => (row.active ? 1 : 0),
      render: (row) => <Chip tone={row.active ? 'emerald' : 'rose'}>{row.active ? 'Active' : 'Inactive'}</Chip>,
    },
    {
      key: 'updated',
      header: 'Updated',
      sortValue: (row) => row.updatedAt,
      render: (row) => <span className="whitespace-nowrap text-[10px] text-slate-500">{timeLabel(row.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button type="button" title="Edit account" onClick={() => openEdit(row)} className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200">
            <Pencil size={13} />
          </button>
          <button type="button" title="Reset password" onClick={() => openPassword(row)} className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-amber-300">
            <KeyRound size={13} />
          </button>
          <button type="button" title={row.active ? 'Deactivate' : 'Activate'} onClick={() => handleToggleActive(row)} className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-sky-300">
            <ShieldCheck size={13} />
          </button>
          <button type="button" title="Delete account" onClick={() => handleDelete(row)} className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-rose-300">
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  const activityColumns: Column<ActivityEntry>[] = [
    {
      key: 'at',
      header: 'Time',
      sortValue: (row) => row.at,
      render: (row) => <span className="whitespace-nowrap text-[10.5px] text-slate-400">{timeLabel(row.at)}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      sortValue: (row) => row.type,
      render: (row) => <Chip tone={ACTIVITY_TONE[row.type]}>{row.type}</Chip>,
    },
    {
      key: 'username',
      header: 'Account',
      sortValue: (row) => row.username,
      render: (row) => <span className="font-mono text-[10.5px] text-slate-300">{row.username}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: (row) => row.role,
      render: (row) => <span className="text-[10.5px] text-slate-400">{row.role}</span>,
    },
    {
      key: 'detail',
      header: 'Detail',
      sortValue: (row) => row.detail,
      render: (row) => <span className="text-[11px] text-slate-300">{row.detail}</span>,
    },
  ];

  if (!canManageAccounts(session)) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/20">
          <AlertTriangle size={20} />
        </div>
        <h1 className="mt-3 text-[15px] font-semibold text-slate-100">MIS account required</h1>
        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
          Only the MIS account can manage accounts and view activity monitoring.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <SectionHeading
        eyebrow="MIS only"
        title="Accounts & Activity"
        description="Manage dashboard accounts and review sign-in, export and account-change activity. Data is stored in this browser's local storage."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => { refreshAccounts(); setActivity(getActivity()); }}>
              <RefreshCw size={13} /> Refresh
            </button>
            {tab === 'accounts' ? (
              <button type="button" className="btn btn-primary" onClick={() => { setShowAdd(true); setError(''); setNotice(''); }}>
                <Plus size={13} /> Add account
              </button>
            ) : (
              <>
                <button type="button" className="btn" onClick={handleClearActivity}>
                  <Trash2 size={13} /> Clear log
                </button>
                <button type="button" className="btn btn-primary" onClick={() => requestExport(exportActivity)}>
                  <Download size={13} /> Export activity
                </button>
              </>
            )}
          </div>
        }
      />

      {(notice || error) && (
        <div className={clsx(
          'rounded-lg border px-3 py-2 text-[11.5px]',
          error ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
        )}>
          {error || notice}
        </div>
      )}

      <div className="flex gap-1 border-b border-white/[0.06]">
        {([
          { id: 'accounts', label: `Accounts (${stats.total})` },
          { id: 'activity', label: `Activity (${activityStats.total})` },
        ] as const).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              if (item.id === 'activity') setActivity(getActivity());
            }}
            className={clsx(
              'border-b-2 px-4 py-2 text-[12px] font-medium transition-colors',
              tab === item.id ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-300',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'accounts' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Accounts" value={formatNumber(stats.total)} hint="Registered in this browser" icon={<UserPlus size={17} />} accent="emerald" />
            <StatCard label="Active" value={formatNumber(stats.active)} hint={`${formatNumber(stats.total - stats.active)} inactive`} icon={<ShieldCheck size={17} />} accent="sky" />
            <StatCard label="MIS accounts" value={formatNumber(stats.mis)} hint="Can manage this panel" icon={<ShieldCheck size={17} />} accent="violet" />
            <StatCard label="Exporters" value={formatNumber(stats.exporters)} hint="[redacted] + MIS roles" icon={<Download size={17} />} accent="amber" />
          </div>

          <Panel
            title="Dashboard accounts"
            subtitle="Changes apply to this browser. Passwords are stored as SHA-256 hashes."
            bodyClassName="p-3"
          >
            <DataTable<StoredAccount>
              rows={accounts}
              columns={accountColumns}
              rowKey={(row) => row.username}
              pageSize={20}
              initialSort={{ key: 'username', direction: 'asc' }}
              empty={<div className="py-12 text-center text-[12px] text-slate-500">No accounts yet.</div>}
            />
          </Panel>
        </>
      )}

      {tab === 'activity' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Events" value={formatNumber(activityStats.total)} hint="Stored in this browser" icon={<ShieldCheck size={17} />} accent="emerald" />
            <StatCard label="CSV exports" value={formatNumber(activityStats.exports)} hint="Gated downloads" icon={<Download size={17} />} accent="sky" />
            <StatCard label="Sign-ins" value={formatNumber(activityStats.logins)} hint="Successful logins" icon={<ShieldCheck size={17} />} accent="violet" />
            <StatCard label="Failed sign-ins" value={formatNumber(activityStats.failed)} hint="Wrong password or unknown user" icon={<AlertTriangle size={17} />} accent="rose" />
            <StatCard label="Account changes" value={formatNumber(activityStats.changes)} hint="Creates, updates, password resets" icon={<KeyRound size={17} />} accent="amber" />
          </div>

          <Panel bodyClassName="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  className="input h-9 w-full pl-8"
                  placeholder="Search account or detail…"
                  value={activitySearch}
                  onChange={(event) => setActivitySearch(event.target.value)}
                />
              </div>
              <select className="select h-9 min-w-[168px]" value={activityFilter} onChange={(event) => setActivityFilter(event.target.value as ActivityType | 'all')}>
                {ACTIVITY_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
              <div className="ml-auto text-[11px] text-slate-500">
                <span className="font-semibold text-slate-300">{formatNumber(filteredActivity.length)}</span> of {formatNumber(activity.length)} events
              </div>
            </div>
          </Panel>

          <Panel title="Activity log" subtitle="Sign-ins, sign-outs, CSV exports, GeoJSON downloads and account changes" bodyClassName="p-3">
            <DataTable<ActivityEntry>
              rows={filteredActivity}
              columns={activityColumns}
              rowKey={(row) => row.id}
              pageSize={50}
              maxHeight="max-h-[620px]"
              initialSort={{ key: 'at', direction: 'desc' }}
              empty={<div className="py-12 text-center text-[12px] text-slate-500">No activity recorded yet.</div>}
            />
          </Panel>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2 text-[10.5px] leading-relaxed text-slate-500">
            Activity is recorded in this browser's local storage, so it reflects sign-ins and downloads made on this device. A shared backend is required to monitor every user across devices.
          </div>
        </>
      )}

      {showAdd && (
        <Modal title="Add account" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <Field label="Username">
              <input className="input h-9 w-full" value={addForm.username} onChange={(e) => setAddForm({ ...addForm, username: e.target.value })} required />
            </Field>
            <Field label="Display name">
              <input className="input h-9 w-full" value={addForm.displayName} onChange={(e) => setAddForm({ ...addForm, displayName: e.target.value })} />
            </Field>
            <Field label="Division">
              <input className="input h-9 w-full" value={addForm.division} onChange={(e) => setAddForm({ ...addForm, division: e.target.value })} />
            </Field>
            <Field label="Role">
              <select className="select h-9 w-full" value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value as Role })}>
                {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Password">
                <input type="password" className="input h-9 w-full" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required />
              </Field>
              <Field label="Confirm">
                <input type="password" className="input h-9 w-full" value={addForm.confirm} onChange={(e) => setAddForm({ ...addForm, confirm: e.target.value })} required />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn h-9" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" disabled={busy} className="btn btn-primary h-9">{busy ? 'Creating…' : 'Create account'}</button>
            </div>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit ${editing.username}`} onClose={() => setEditing(null)}>
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <Field label="Username">
              <input className="input h-9 w-full" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} required />
            </Field>
            <Field label="Display name">
              <input className="input h-9 w-full" value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} />
            </Field>
            <Field label="Division">
              <input className="input h-9 w-full" value={editForm.division} onChange={(e) => setEditForm({ ...editForm, division: e.target.value })} />
            </Field>
            <Field label="Role">
              <select className="select h-9 w-full" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}>
                {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn h-9" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" disabled={busy} className="btn btn-primary h-9">{busy ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {passwordFor && (
        <Modal title={`Reset password — ${passwordFor.username}`} onClose={() => setPasswordFor(null)}>
          <form onSubmit={handlePassword} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="New password">
                <input type="password" className="input h-9 w-full" value={pwForm.password} onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })} required />
              </Field>
              <Field label="Confirm">
                <input type="password" className="input h-9 w-full" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn h-9" onClick={() => setPasswordFor(null)}>Cancel</button>
              <button type="submit" disabled={busy} className="btn btn-primary h-9">{busy ? 'Saving…' : 'Update password'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
