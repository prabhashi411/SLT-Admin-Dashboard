import { useEffect, useState } from 'react';
import {
  Building2,
  Cloud,
  Cpu,
  Plus,
  RefreshCw,
  Shield,
  Users,
  ArrowRightCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client';
import type {
  GlobalProvidersStatus,
  SuperAdminOverview,
  TenantSummary,
} from '../types/api';

interface SuperAdminPortalProps {
  activeTab: 'overview' | 'tenants' | 'providers';
  searchQuery: string;
  onInspectCompany: (tenant: TenantSummary) => void;
  onToast: (message: string) => void;
}

export default function SuperAdminPortal({
  activeTab,
  searchQuery,
  onInspectCompany,
  onToast,
}: SuperAdminPortalProps) {
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [providers, setProviders] = useState<GlobalProvidersStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding form
  const [showOnboard, setShowOnboard] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState<'Starter' | 'Growth' | 'Enterprise'>('Enterprise');
  const [contactEmail, setContactEmail] = useState('');
  const [maxConcurrent, setMaxConcurrent] = useState(50);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [savingTenant, setSavingTenant] = useState(false);

  // Add admin inline modal state
  const [adminModalTenant, setAdminModalTenant] = useState<TenantSummary | null>(null);
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  // Provider pool controls
  const [sttStrategy, setSttStrategy] = useState('cloud_first');
  const [ttsStrategy, setTtsStrategy] = useState('cloud_first');
  const [maxCloudStt, setMaxCloudStt] = useState(64);
  const [maxCloudTts, setMaxCloudTts] = useState(64);
  const [maxLocalCpu, setMaxLocalCpu] = useState(2);
  const [savingPool, setSavingPool] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, tList, prov] = await Promise.all([
        api.getSuperOverview(),
        api.getTenants(),
        api.getGlobalProviders(),
      ]);
      setOverview(ov);
      setTenants(tList);
      setProviders(prov);
      setSttStrategy(prov.stt_strategy);
      setTtsStrategy(prov.tts_strategy);
      setMaxCloudStt(prov.limits.max_concurrent_cloud_stt);
      setMaxCloudTts(prov.limits.max_concurrent_cloud_tts);
      setMaxLocalCpu(prov.limits.max_local_cpu_stt);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'Failed to load Super Admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setSavingTenant(true);
    setError(null);
    try {
      await api.createTenant({
        name: companyName.trim(),
        slug: slug.trim() || undefined,
        plan,
        contact_email: contactEmail.trim() || null,
        max_concurrent_sessions: Number(maxConcurrent || 50),
        stt_provider: 'shared_cloud',
        tts_provider: 'shared_cloud',
        admin_username: adminUsername.trim() || undefined,
        admin_password: adminPassword || undefined,
      });
      setCompanyName('');
      setSlug('');
      setContactEmail('');
      setAdminUsername('');
      setAdminPassword('');
      setShowOnboard(false);
      onToast('Company onboarded with isolated tenant workspace.');
      await loadAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'Could not onboard company.');
    } finally {
      setSavingTenant(false);
    }
  };

  const handleToggleTenantStatus = async (tenant: TenantSummary) => {
    const next = tenant.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await api.updateTenant(tenant.id, { status: next });
      onToast(`${tenant.name} status set to ${next}.`);
      await loadAll();
    } catch {
      setError('Could not update company status.');
    }
  };

  const handleCreateTenantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminModalTenant) return;
    try {
      await api.createTenantAdmin(adminModalTenant.id, {
        username: newAdminUser.trim(),
        password: newAdminPass,
        role: 'company_admin',
      });
      onToast(`Created scoped Company Admin '${newAdminUser.trim()}' for ${adminModalTenant.name}.`);
      setAdminModalTenant(null);
      setNewAdminUser('');
      setNewAdminPass('');
      await loadAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'Could not create Company Admin.');
    }
  };

  const handleSavePool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPool(true);
    setError(null);
    try {
      const updated = await api.updateGlobalProviders({
        stt_strategy: sttStrategy,
        tts_strategy: ttsStrategy,
        max_concurrent_cloud_stt: Number(maxCloudStt),
        max_concurrent_cloud_tts: Number(maxCloudTts),
        max_local_cpu_stt: Number(maxLocalCpu),
      });
      setProviders(updated);
      onToast('Updated shared cloud STT & TTS burst settings.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'Failed to update global provider settings.');
    } finally {
      setSavingPool(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.plan.toLowerCase().includes(q)
    );
  });

  const poolMetrics = providers?.metrics;

  return (
    <div className="cc-page">
      <div className="cc-page-header">
        <div>
          <span className="cc-badge cc-badge-blue" style={{ marginBottom: 8 }}>
            <Shield size={12} /> PLATFORM SUPER ADMIN PORTAL
          </span>
          <h1 className="cc-page-title">
            {activeTab === 'tenants'
              ? 'Company Onboarding & Tenants'
              : activeTab === 'providers'
              ? 'Shared Cloud STT & TTS Providers'
              : 'Global Platform Command Center'}
          </h1>
          <p className="cc-page-sub">
            Manage isolated customer companies, provision scoped Company Admins, and balance shared cloud speech APIs across concurrent bursts.
          </p>
        </div>
        <div className="cc-header-actions">
          <button type="button" className="cc-btn cc-btn-secondary" onClick={loadAll} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={() => setShowOnboard((v) => !v)}>
            <Plus size={15} />
            <span>{showOnboard ? 'Close Onboarding' : 'Onboard Company'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="cc-alert cc-alert-error" style={{ marginBottom: 16 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            {error}
          </span>
        </div>
      )}

      {showOnboard && (
        <form className="cc-card" onSubmit={handleOnboard} style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Onboard New Company Tenant</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Colombo Fiber Corp" required />
            </div>
            <div className="form-group">
              <label className="form-label">Tenant Slug</label>
              <input className="form-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="colombo-fiber (auto if blank)" />
            </div>
            <div className="form-group">
              <label className="form-label">Plan Tier</label>
              <select className="form-input" value={plan} onChange={(e) => setPlan(e.target.value as 'Starter' | 'Growth' | 'Enterprise')}>
                <option value="Enterprise">Enterprise</option>
                <option value="Growth">Growth</option>
                <option value="Starter">Starter</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max Concurrent Calls</label>
              <input type="number" className="form-input" value={maxConcurrent} onChange={(e) => setMaxConcurrent(Number(e.target.value))} min={1} max={5000} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input type="email" className="form-input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="ops@company.lk" />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Company Admin Username</label>
              <input className="form-input" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="company_admin" />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Admin Password (min 10 chars)</label>
              <input type="password" className="form-input" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••••••" />
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="submit" className="cc-btn cc-btn-primary" disabled={savingTenant}>
              {savingTenant ? 'Onboarding...' : 'Create Isolated Tenant'}
            </button>
          </div>
        </form>
      )}

      {adminModalTenant && (
        <form className="cc-card" onSubmit={handleCreateTenantAdmin} style={{ padding: 20, marginBottom: 20, borderColor: 'var(--primary)' }}>
          <h3 style={{ marginBottom: 8 }}>Provision Scoped Company Admin for {adminModalTenant.name}</h3>
          <p className="cc-muted" style={{ marginBottom: 12 }}>
            This user will only see {adminModalTenant.name}'s bots, routing rules, settings, and conversations.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={newAdminUser} onChange={(e) => setNewAdminUser(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password (min 10 characters)</label>
              <input type="password" className="form-input" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} required minLength={10} />
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setAdminModalTenant(null)}>Cancel</button>
            <button type="submit" className="cc-btn cc-btn-primary">Create Company Admin</button>
          </div>
        </form>
      )}

      {(activeTab === 'overview' || activeTab === 'providers') && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="cc-card stat-card">
            <span className="stat-label"><Building2 size={14} /> Active Companies</span>
            <strong className="stat-value">{overview ? `${overview.active_tenants} / ${overview.total_tenants}` : '—'}</strong>
            <span className="stat-sub">Isolated multi-tenant workspaces</span>
          </div>
          <div className="cc-card stat-card">
            <span className="stat-label"><CheckCircle2 size={14} /> Live Tenant Chatbots</span>
            <strong className="stat-value">{overview ? `${overview.live_bots} / ${overview.total_bots}` : '—'}</strong>
            <span className="stat-sub">{overview?.total_rules ?? 0} scoped routing rules</span>
          </div>
          <div className="cc-card stat-card">
            <span className="stat-label"><Cloud size={14} /> Cloud Speech Offload</span>
            <strong className="stat-value">{poolMetrics ? `${poolMetrics.cloud_offload_percent}%` : '100%'}</strong>
            <span className="stat-sub">
              STT {poolMetrics?.active_stt_streams ?? 0}/{providers?.limits.max_concurrent_cloud_stt ?? 64} • TTS {poolMetrics?.active_tts_streams ?? 0}/{providers?.limits.max_concurrent_cloud_tts ?? 64}
            </span>
          </div>
          <div className="cc-card stat-card">
            <span className="stat-label"><Cpu size={14} /> Local CPU Guard</span>
            <strong className="stat-value">{providers ? `${providers.limits.max_local_cpu_stt} workers` : '2 workers'}</strong>
            <span className="stat-sub">Peak bursts: STT {poolMetrics?.peak_stt_streams ?? 0} / TTS {poolMetrics?.peak_tts_streams ?? 0}</span>
          </div>
        </div>
      )}

      {activeTab === 'providers' && providers && (
        <form className="cc-card" onSubmit={handleSavePool} style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 6 }}>Global Shared Cloud Speech Pool Configuration</h3>
          <p className="cc-muted" style={{ marginBottom: 16 }}>
            Simultaneous calls across companies share cloud Google/Azure/Edge pools while capping local CPU Whisper fallbacks.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Shared STT Routing Strategy</label>
              <select className="form-input" value={sttStrategy} onChange={(e) => setSttStrategy(e.target.value)}>
                {providers.allowed_stt_strategies.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Shared TTS Routing Strategy</label>
              <select className="form-input" value={ttsStrategy} onChange={(e) => setTtsStrategy(e.target.value)}>
                {providers.allowed_tts_strategies.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max Concurrent Cloud STT</label>
              <input type="number" className="form-input" value={maxCloudStt} onChange={(e) => setMaxCloudStt(Number(e.target.value))} min={1} max={500} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Concurrent Cloud TTS</label>
              <input type="number" className="form-input" value={maxCloudTts} onChange={(e) => setMaxCloudTts(Number(e.target.value))} min={1} max={500} />
            </div>
            <div className="form-group">
              <label className="form-label">CPU Guard (Max Local Whisper Jobs)</label>
              <input type="number" className="form-input" value={maxLocalCpu} onChange={(e) => setMaxLocalCpu(Number(e.target.value))} min={1} max={16} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="cc-btn cc-btn-primary" disabled={savingPool}>
              {savingPool ? 'Saving...' : 'Save Global Pool Config'}
            </button>
          </div>
        </form>
      )}

      {(activeTab === 'overview' || activeTab === 'tenants') && (
        <div className="cc-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0 }}>Onboarded Company Tenants ({filteredTenants.length})</h3>
          </div>
          <table className="cc-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Company & Slug</th>
                <th>Plan / Quota</th>
                <th>Bots & Rules</th>
                <th>Speech Pool</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <div><strong>{tenant.name}</strong></div>
                    <span className="cc-muted" style={{ fontSize: '0.78rem' }}>ID #{tenant.id} · {tenant.slug}</span>
                  </td>
                  <td>
                    <div>{tenant.plan}</div>
                    <span className="cc-muted" style={{ fontSize: '0.78rem' }}>{tenant.max_concurrent_sessions} max calls · {tenant.admins_count} admins</span>
                  </td>
                  <td>
                    <div>{tenant.agents_count + tenant.portal_agents_count} bots ({tenant.live_agents_count} live)</div>
                    <span className="cc-muted" style={{ fontSize: '0.78rem' }}>{tenant.rules_count} rules · {tenant.sessions_24h} calls/24h</span>
                  </td>
                  <td>
                    <span className="cc-badge">{tenant.stt_provider}</span>
                  </td>
                  <td>
                    <span className={`cc-badge ${tenant.status === 'Active' ? 'cc-badge-green' : 'cc-badge-red'}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        type="button"
                        className="cc-btn cc-btn-sm cc-btn-primary"
                        onClick={() => onInspectCompany(tenant)}
                        title="Open this company's scoped dashboard"
                      >
                        <ArrowRightCircle size={13} />
                        <span>Manage</span>
                      </button>
                      <button
                        type="button"
                        className="cc-btn cc-btn-sm cc-btn-secondary"
                        onClick={() => setAdminModalTenant(tenant)}
                        title="Add a Company Admin user"
                      >
                        <Users size={13} />
                        <span>+ Admin</span>
                      </button>
                      {tenant.id !== 1 && (
                        <button
                          type="button"
                          className="cc-btn cc-btn-sm cc-btn-secondary"
                          onClick={() => handleToggleTenantStatus(tenant)}
                        >
                          {tenant.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
