import { useEffect, useMemo, useRef, useState } from 'react';
import {
  RotateCw,
  Server,
  Key,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Lock,
  Search,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type {
  McpClient,
  AuditEntry,
  HubStatus,
  HealthResponse,
  CreateMcpClientResponse,
} from '../types/api';

interface GatewayAuditProps {
  searchQuery?: string;
  onOpenLogin: () => void;
}

type TabId = 'tools' | 'keys' | 'audit';

const TOOL_CATALOG = [
  {
    name: 'SLT Knowledgebase Search',
    code: 'search_knowledgebase_tool',
    access: 'Public',
    desc: 'Answers general questions on Fiber, Broadband, PeoTV, and 5G packages.',
  },
  {
    name: 'Data Balance & Daily Usage',
    code: 'show_gb_balance / show_daily_usage',
    access: 'OTP Required',
    desc: 'Checks remaining gigabytes and daily consumption for a verified subscriber.',
  },
  {
    name: 'Billing History & Last Payment',
    code: 'show_bill_history / show_last_payment',
    access: 'OTP Required',
    desc: 'Reads monthly invoice amounts and recent payments after SMS OTP login.',
  },
  {
    name: 'LTE Wallet & Fault Reports',
    code: 'show_lte_wallet_detail / show_fault_list',
    access: 'OTP Required',
    desc: 'Inspects 4G/LTE add-on quotas and open line fault tickets for a customer.',
  },
];

export default function GatewayAudit({ searchQuery = '', onOpenLogin }: GatewayAuditProps) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('tools');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Gateway & Health
  const [hubStatus, setHubStatus] = useState<HubStatus | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // API Keys (MCP Clients)
  const [clients, setClients] = useState<McpClient[]>([]);
  const [newClientName, setNewClientName] = useState('');
  const [newClientScopes, setNewClientScopes] = useState('knowledge:read assistant:ask');
  const [createOpen, setCreateOpen] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<CreateMcpClientResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<McpClient | null>(null);

  // Audit Logs & Filtering
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'ok' | 'error'>('all');
  const [error, setError] = useState<string | null>(null);

  const createDialogRef = useRef<HTMLDialogElement>(null);
  const revokeDialogRef = useRef<HTMLDialogElement>(null);

  const loadAll = async () => {
    setRefreshing(true);
    try {
      const [hStatus, hData] = await Promise.all([
        api.getHubStatus().catch(() => null),
        api.getHealth().catch(() => null),
      ]);
      if (hStatus) setHubStatus(hStatus);
      if (hData) setHealthData(hData);

      if (isAuthenticated) {
        const [cList, aLogs] = await Promise.all([
          api.getMcpClients().catch(() => []),
          api.getAuditLog(100).catch(() => []),
        ]);
        setClients(cList);
        setAuditLogs(aLogs);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [isAuthenticated]);

  // Sync native <dialog> for Create Key modal
  useEffect(() => {
    const dialog = createDialogRef.current;
    if (!dialog) return;

    if (createOpen && !dialog.open) {
      dialog.showModal();
    } else if (!createOpen && dialog.open) {
      dialog.close();
    }
  }, [createOpen]);

  // Sync native <dialog> for Revoke confirmation
  useEffect(() => {
    const dialog = revokeDialogRef.current;
    if (!dialog) return;

    if (revokeTarget && !dialog.open) {
      dialog.showModal();
    } else if (!revokeTarget && dialog.open) {
      dialog.close();
    }
  }, [revokeTarget]);

  // Wire close events & pointerdown/pointerup fallback on both dialogs
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const bindDialog = (dialog: HTMLDialogElement | null, closeFn: () => void) => {
      if (!dialog) return;
      dialog.addEventListener('close', closeFn);
      cleanups.push(() => dialog.removeEventListener('close', closeFn));

      if (!('closedBy' in HTMLDialogElement.prototype)) {
        const outside = (e: PointerEvent) => {
          const r = dialog.getBoundingClientRect();
          return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        };
        let pressedOutside = false;
        const onDown = (e: PointerEvent) => {
          pressedOutside = outside(e);
        };
        const onUp = (e: PointerEvent) => {
          if (pressedOutside && outside(e)) dialog.close();
        };
        dialog.addEventListener('pointerdown', onDown);
        dialog.addEventListener('pointerup', onUp);
        cleanups.push(() => {
          dialog.removeEventListener('pointerdown', onDown);
          dialog.removeEventListener('pointerup', onUp);
        });
      }
    };

    bindDialog(createDialogRef.current, () => {
      setCreateOpen(false);
      setCreatedSecret(null);
    });
    bindDialog(revokeDialogRef.current, () => setRevokeTarget(null));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const order: TabId[] = ['tools', 'keys', 'audit'];
    const currentIndex = order.indexOf(activeTab);
    let nextIndex = -1;

    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % order.length;
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + order.length) % order.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = order.length - 1;

    if (nextIndex !== -1) {
      e.preventDefault();
      const nextId = order[nextIndex];
      setActiveTab(nextId);
      const nextBtn = tabRefs.current[nextIndex];
      nextBtn?.focus();
      nextBtn?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    setError(null);
    try {
      const scopes = newClientScopes.split(/\s+/).filter(Boolean);
      const res = await api.createMcpClient({ name: newClientName.trim(), scopes });
      setCreatedSecret(res);
      setNewClientName('');
      const refreshed = await api.getMcpClients();
      setClients(refreshed);
    } catch {
      setError('Failed to create API key. Check your admin session.');
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setError(null);
    try {
      await api.revokeMcpClient(revokeTarget.id);
      setRevokeTarget(null);
      const refreshed = await api.getMcpClients();
      setClients(refreshed);
    } catch {
      setError('Failed to revoke API key.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const effectiveSearch = (localSearch || searchQuery).trim().toLowerCase();

  const filteredTools = useMemo(() => {
    if (!effectiveSearch) return TOOL_CATALOG;
    return TOOL_CATALOG.filter(
      (t) =>
        t.name.toLowerCase().includes(effectiveSearch) ||
        t.code.toLowerCase().includes(effectiveSearch) ||
        t.desc.toLowerCase().includes(effectiveSearch)
    );
  }, [effectiveSearch]);

  const filteredAudit = useMemo(() => {
    return auditLogs.filter((entry) => {
      if (outcomeFilter === 'ok' && entry.outcome !== 'ok') return false;
      if (outcomeFilter === 'error' && entry.outcome === 'ok') return false;
      if (!effectiveSearch) return true;
      return (
        entry.action.toLowerCase().includes(effectiveSearch) ||
        entry.actor_id.toLowerCase().includes(effectiveSearch) ||
        (entry.detail || '').toLowerCase().includes(effectiveSearch)
      );
    });
  }, [auditLogs, outcomeFilter, effectiveSearch]);

  return (
    <div className="cc-page">
      {/* Header */}
      <div className="cc-page-header">
        <div>
          <h1 className="cc-page-title">Security & API Keys</h1>
          <p className="cc-page-sub">
            View how SLT account tools are protected, issue API keys for partner apps, and inspect the security audit log.
          </p>
        </div>
        <button
          type="button"
          className="cc-btn cc-btn-secondary"
          onClick={loadAll}
          disabled={refreshing}
        >
          <RotateCw size={15} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="cc-alert cc-alert-error">
          <span>{error}</span>
          <button type="button" className="cc-btn cc-btn-secondary cc-btn-sm" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Search bar shared across tabs */}
      <div className="cc-toolbar">
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
          <div className="topbar-search" style={{ width: '100%' }}>
            <Search size={15} className="topbar-search-icon" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search SLT tools, actions, or audit details..."
              aria-label="Search tools and audit logs"
            />
          </div>
        </div>
      </div>

      {/* WAI-ARIA Tablist (modern-web-guidance tabs pattern) */}
      <div>
        <div
          role="tablist"
          aria-label="Security and gateway sections"
          className="cc-tablist"
          onKeyDown={handleTabKeyDown}
        >
          <button
            ref={(el) => {
              tabRefs.current[0] = el;
            }}
            type="button"
            role="tab"
            id="tools-tab"
            aria-selected={activeTab === 'tools'}
            tabIndex={activeTab === 'tools' ? 0 : -1}
            onClick={() => setActiveTab('tools')}
          >
            <Server size={16} />
            <span>SLT Backend Tools</span>
          </button>

          <button
            ref={(el) => {
              tabRefs.current[1] = el;
            }}
            type="button"
            role="tab"
            id="keys-tab"
            aria-selected={activeTab === 'keys'}
            tabIndex={activeTab === 'keys' ? 0 : -1}
            onClick={() => setActiveTab('keys')}
          >
            <Key size={16} />
            <span>External API Keys ({clients.length})</span>
          </button>

          <button
            ref={(el) => {
              tabRefs.current[2] = el;
            }}
            type="button"
            role="tab"
            id="audit-tab"
            aria-selected={activeTab === 'audit'}
            tabIndex={activeTab === 'audit' ? 0 : -1}
            onClick={() => setActiveTab('audit')}
          >
            <Shield size={16} />
            <span>Security Audit Log ({auditLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: SLT Backend Tools */}
        <div
          role="tabpanel"
          aria-labelledby="tools-tab"
          hidden={activeTab !== 'tools'}
          tabIndex={activeTab === 'tools' ? 0 : undefined}
        >
          <div className="cc-tabpanel-inner">
            <div className="cc-tool-grid">
              <div className="cc-card">
                <div className="cc-card-body">
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    SLT Tool Hub
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, margin: '6px 0' }}>
                    {healthData?.mcp_hub?.breaker_open
                      ? `Paused (${healthData.mcp_hub.breaker_seconds_left}s)`
                      : healthData?.mcp_hub?.reachable
                      ? 'Connected & Ready'
                      : 'Standby / Local'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                    Connects to SLT billing & broadband services
                  </div>
                </div>
              </div>

              <div className="cc-card">
                <div className="cc-card-body">
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Verified Customer Sessions
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, margin: '6px 0' }}>
                    {hubStatus?.gateway.sessions ?? 0}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                    Customers currently signed in via SMS OTP
                  </div>
                </div>
              </div>

              <div className="cc-card">
                <div className="cc-card-body">
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Average Tool Speed
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, margin: '6px 0' }}>
                    {hubStatus?.tool_agent.turns ? `${hubStatus.tool_agent.avg_tool_ms} ms` : '—'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                    {hubStatus?.tool_agent.turns ?? 0} total tool lookups
                  </div>
                </div>
              </div>
            </div>

            <section className="cc-card">
              <div className="cc-card-header">
                <div>
                  <h2 className="cc-card-title">Protected Tool Permissions</h2>
                  <p className="cc-card-sub">
                    What information the assistant can share openly vs. what requires customer OTP verification
                  </p>
                </div>
              </div>
              <div className="cc-card-body">
                <div className="cc-two-col">
                  {filteredTools.map((tool) => (
                    <div key={tool.code} className="cc-check-item" style={{ justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span className="cc-check-title">{tool.name}</span>
                          <span className={`cc-badge ${tool.access === 'Public' ? 'cc-badge-blue' : 'cc-badge-green'}`}>
                            {tool.access}
                          </span>
                        </div>
                        <div className="cc-check-desc">{tool.desc}</div>
                        <code style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>{tool.code}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* TAB 2: External API Keys */}
        <div
          role="tabpanel"
          aria-labelledby="keys-tab"
          hidden={activeTab !== 'keys'}
          tabIndex={activeTab === 'keys' ? 0 : undefined}
        >
          <div className="cc-tabpanel-inner">
            {!isAuthenticated ? (
              <div className="cc-auth-prompt">
                <div className="cc-empty-icon">
                  <Lock size={22} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700 }}>Administrator Sign-In Required</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: 440 }}>
                  Sign in to view, create, or revoke API keys for external apps connecting to this server.
                </p>
                <button type="button" className="cc-btn cc-btn-primary" onClick={onOpenLogin}>
                  <Lock size={15} />
                  <span>Sign In as Administrator</span>
                </button>
              </div>
            ) : (
              <>
                <div className="cc-toolbar">
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                    Issue credentials for partner systems calling this server&apos;s <code>/mcp</code> integration endpoint.
                  </p>
                  <button
                    type="button"
                    className="cc-btn cc-btn-primary"
                    onClick={() => {
                      setCreatedSecret(null);
                      setCreateOpen(true);
                    }}
                  >
                    <Plus size={15} />
                    <span>Create API Key</span>
                  </button>
                </div>

                {clients.length === 0 ? (
                  <div className="cc-empty-state">
                    <div className="cc-empty-icon">
                      <Key size={22} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>No API Keys Created Yet</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      Create an API key when an external partner app needs programmatic access.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrapper" tabIndex={0} role="region" aria-labelledby="keys-table-caption">
                    <table>
                      <caption id="keys-table-caption" style={{ position: 'absolute', left: -9999 }}>
                        External API keys
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Application Name</th>
                          <th scope="col">Client ID</th>
                          <th scope="col">Permissions (Scopes)</th>
                          <th scope="col">Created</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Revoke</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map((c) => (
                          <tr key={c.id}>
                            <th scope="row">{c.name}</th>
                            <td>
                              <code style={{ fontSize: '0.8rem' }}>{c.client_id}</code>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {c.scopes.map((s, idx) => (
                                  <span key={idx} className="cc-badge cc-badge-neutral">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="cc-btn cc-btn-sm cc-btn-danger"
                                onClick={() => setRevokeTarget(c)}
                                aria-label={`Revoke key for ${c.name}`}
                              >
                                <Trash2 size={13} />
                                <span>Revoke</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* TAB 3: Security Audit Log */}
        <div
          role="tabpanel"
          aria-labelledby="audit-tab"
          hidden={activeTab !== 'audit'}
          tabIndex={activeTab === 'audit' ? 0 : undefined}
        >
          <div className="cc-tabpanel-inner">
            {!isAuthenticated ? (
              <div className="cc-auth-prompt">
                <div className="cc-empty-icon">
                  <Lock size={22} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700 }}>Administrator Sign-In Required</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: 440 }}>
                  Sign in to inspect security events, admin actions, and blocked access attempts.
                </p>
                <button type="button" className="cc-btn cc-btn-primary" onClick={onOpenLogin}>
                  <Lock size={15} />
                  <span>Sign In as Administrator</span>
                </button>
              </div>
            ) : (
              <>
                <div className="cc-toolbar">
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Showing {filteredAudit.length} recent security events
                  </span>
                  <div className="cc-segmented" role="group" aria-label="Filter audit outcome">
                    {([
                      { id: 'all', label: 'All Events' },
                      { id: 'ok', label: 'Allowed / OK' },
                      { id: 'error', label: 'Blocked / Errors' },
                    ] as const).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={outcomeFilter === f.id ? 'active' : ''}
                        onClick={() => setOutcomeFilter(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredAudit.length === 0 ? (
                  <div className="cc-empty-state">
                    <div className="cc-empty-icon">
                      <Shield size={22} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>No Matching Audit Events</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      No security events match your current filters.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrapper" tabIndex={0} role="region" aria-labelledby="audit-table-caption">
                    <table>
                      <caption id="audit-table-caption" style={{ position: 'absolute', left: -9999 }}>
                        Security audit log
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Time</th>
                          <th scope="col">Actor</th>
                          <th scope="col">Action</th>
                          <th scope="col">Outcome</th>
                          <th scope="col">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAudit.map((entry) => (
                          <tr key={entry.id}>
                            <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                              {new Date(entry.created_at).toLocaleString()}
                            </td>
                            <th scope="row">
                              <code style={{ fontSize: '0.8rem' }}>{entry.actor_id}</code>{' '}
                              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-tertiary)' }}>
                                ({entry.actor_type})
                              </span>
                            </th>
                            <td>
                              <code style={{ fontSize: '0.8rem' }}>{entry.action}</code>
                            </td>
                            <td>
                              <span className={`cc-badge ${entry.outcome === 'ok' ? 'cc-badge-green' : 'cc-badge-red'}`}>
                                {entry.outcome === 'ok' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                {entry.outcome.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                              {entry.detail || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Native <dialog>: Create API Key */}
      <dialog
        ref={createDialogRef}
        className="cc-dialog cc-dialog-sm"
        aria-labelledby="create-key-title"
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="cc-dialog-header">
          <h2 id="create-key-title" className="cc-dialog-title">
            <Key size={18} style={{ color: 'var(--primary)' }} />
            Create External API Key
          </h2>
          <button
            type="button"
            className="cc-dialog-close"
            onClick={() => {
              setCreateOpen(false);
              setCreatedSecret(null);
            }}
            aria-label="Close create API key dialog"
          >
            <X size={18} />
          </button>
        </div>

        {createdSecret ? (
          <>
            <div className="cc-dialog-body">
              <div className="cc-alert cc-alert-success">
                <span>Copy your secret key now — it cannot be shown again once you close this dialog.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Client ID</label>
                <input type="text" readOnly className="form-input font-mono" value={createdSecret.client.client_id} />
              </div>

              <div className="form-group">
                <label className="form-label">Client Secret</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" readOnly className="form-input font-mono" value={createdSecret.client_secret} />
                  <button
                    type="button"
                    className="cc-btn cc-btn-secondary"
                    onClick={() => copyToClipboard(createdSecret.client_secret)}
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="cc-dialog-footer">
              <button
                type="button"
                className="cc-btn cc-btn-primary"
                onClick={() => {
                  setCreateOpen(false);
                  setCreatedSecret(null);
                }}
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCreateClient}>
            <div className="cc-dialog-body">
              <div className="form-group">
                <label htmlFor="client-name" className="form-label">
                  Application Name <span className="required">*</span>
                </label>
                <input
                  id="client-name"
                  type="text"
                  className="form-input"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g., SLT Mobile App Backend"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="client-scopes" className="form-label">
                  Permissions (space-separated)
                </label>
                <input
                  id="client-scopes"
                  type="text"
                  className="form-input font-mono"
                  value={newClientScopes}
                  onChange={(e) => setNewClientScopes(e.target.value)}
                />
              </div>
            </div>

            <div className="cc-dialog-footer">
              <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="cc-btn cc-btn-primary">
                Generate Key
              </button>
            </div>
          </form>
        )}
      </dialog>

      {/* Native <dialog>: Confirm Revoke API Key */}
      <dialog
        ref={revokeDialogRef}
        className="cc-dialog cc-dialog-sm"
        aria-labelledby="revoke-key-title"
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="cc-dialog-header">
          <h2 id="revoke-key-title" className="cc-dialog-title">
            Revoke API Key?
          </h2>
          <button
            type="button"
            className="cc-dialog-close"
            onClick={() => setRevokeTarget(null)}
            aria-label="Close confirmation"
          >
            <X size={18} />
          </button>
        </div>
        <div className="cc-dialog-body">
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Revoking <strong>{revokeTarget?.name}</strong> will immediately block any external client authenticating with its secret.
          </p>
        </div>
        <div className="cc-dialog-footer">
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            onClick={() => setRevokeTarget(null)}
            autoFocus
          >
            Keep Key
          </button>
          <button
            type="button"
            className="cc-btn cc-btn-danger-solid"
            onClick={handleConfirmRevoke}
          >
            Revoke Permanently
          </button>
        </div>
      </dialog>
    </div>
  );
}
