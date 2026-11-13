import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { api } from '../api/client';
import type { McpClient, AuditEntry, HubStatus, HealthResponse, CreateMcpClientResponse } from '../types/api';
import { useAuth } from '../context/AuthContext';

export default function GatewayAuditPage() {
  const { adminUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'hub' | 'clients' | 'audit'>('hub');

  // Hub & Gateway State
  const [hubStatus, setHubStatus] = useState<HubStatus | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  // MCP Clients State
  const [clients, setClients] = useState<McpClient[]>([]);
  const [newClientName, setNewClientName] = useState('');
  const [newClientScopes, setNewClientScopes] = useState('knowledge:read assistant:ask');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<CreateMcpClientResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchHub = async () => {
    try {
      const [hStatus, hData] = await Promise.all([
        api.getHubStatus().catch(() => null),
        api.getHealth().catch(() => null),
      ]);
      if (hStatus) setHubStatus(hStatus);
      if (hData) setHealthData(hData);
    } catch {
      // Handled inside client.ts fallback
    }
  };

  const fetchClients = async () => {
    try {
      const data = await api.getMcpClients();
      setClients(data);
    } catch {
      // Needs admin session
    }
  };

  const fetchAudit = async () => {
    try {
      const data = await api.getAuditLog(100);
      setAuditLogs(data);
    } catch {
      // Needs admin session
    }
  };

  useEffect(() => {
    fetchHub();
    if (adminUser) {
      fetchClients();
      fetchAudit();
    }
  }, [adminUser]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    try {
      const scopes = newClientScopes.split(/\s+/).filter(Boolean);
      const res = await api.createMcpClient({ name: newClientName.trim(), scopes });
      setCreatedSecret(res);
      setNewClientName('');
      fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create MCP client');
    }
  };

  const handleRevokeClient = async (id: number) => {
    if (!confirm('Revoke this client key permanently? Machine calls using this secret will fail.')) return;
    try {
      await api.revokeMcpClient(id);
      fetchClients();
    } catch (err: any) {
      setError('Failed to revoke client');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header cc-page-header">
        <div>
          <h1>Enterprise Gateway &amp; Audit Trail</h1>
          <p>
            Monitor live SLT MCP Hub connectivity, issue machine-to-machine integration credentials, and inspect security audit logs.
          </p>
        </div>
        <div className="cc-header-actions">
          <button className="btn-secondary" onClick={() => { fetchHub(); fetchClients(); fetchAudit(); }}>
            <RotateCw size={15} /> Refresh All
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Clean Sub-navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        marginBottom: 24
      }}>
        <button
          onClick={() => setActiveTab('hub')}
          style={{
            padding: '10px 18px',
            borderBottom: activeTab === 'hub' ? '2px solid #0f52ba' : '2px solid transparent',
            fontWeight: 600,
            fontSize: 14,
            color: activeTab === 'hub' ? '#0f52ba' : 'var(--text-muted)',
            background: 'transparent',
            borderTop: 0,
            borderLeft: 0,
            borderRight: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Server size={16} /> Central MCP Hub Status
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          style={{
            padding: '10px 18px',
            borderBottom: activeTab === 'clients' ? '2px solid #0f52ba' : '2px solid transparent',
            fontWeight: 600,
            fontSize: 14,
            color: activeTab === 'clients' ? '#0f52ba' : 'var(--text-muted)',
            background: 'transparent',
            borderTop: 0,
            borderLeft: 0,
            borderRight: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Key size={16} /> MCP Client Credentials ({clients.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '10px 18px',
            borderBottom: activeTab === 'audit' ? '2px solid #0f52ba' : '2px solid transparent',
            fontWeight: 600,
            fontSize: 14,
            color: activeTab === 'audit' ? '#0f52ba' : 'var(--text-muted)',
            background: 'transparent',
            borderTop: 0,
            borderLeft: 0,
            borderRight: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Shield size={16} /> Security Audit Log ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: Central MCP Hub */}
      {activeTab === 'hub' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{
              background: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: 10,
              padding: 20
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Central MCP Hub</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: 20, fontWeight: 700 }}>mcphub.sltdigitallab.lk</h3>
              {healthData?.mcp_hub?.breaker_open || healthData?.mcp_hub?.reachable === false ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#dc2626', marginTop: 8 }}>
                  <AlertCircle size={14} /> Circuit Breaker Open ({healthData?.mcp_hub?.breaker_seconds_left ?? 0}s pause)
                </div>
              ) : healthData?.mcp_hub?.reachable ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', marginTop: 8 }}>
                  <CheckCircle2 size={14} /> Hub Gateway Connected
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Gateway Status Pending
                </div>
              )}
            </div>

            <div style={{
              background: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: 10,
              padding: 20
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Gateway Sessions</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: 24, fontWeight: 700 }}>
                {hubStatus?.gateway.sessions ?? 0}
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Active authenticated customer sessions
              </span>
            </div>

            <div style={{
              background: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: 10,
              padding: 20
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Tool Execution Speed</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: 24, fontWeight: 700 }}>
                {hubStatus?.tool_agent.turns ? `${hubStatus.tool_agent.avg_tool_ms} ms` : '—'}
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {hubStatus?.tool_agent.turns ?? 0} tool turns executed
              </span>
            </div>
          </div>

          <div style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 10,
            padding: 24
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Tool Access Policy Matrix</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
              Server-enforced access controls loaded from <code>config/tool_access.yaml</code>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div style={{ padding: 14, background: 'var(--table-header, #f8fafc)', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#0f52ba' }}>Public / Guest Access</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.8 }}>
                  <li><code>search_knowledgebase_tool</code> (Broadband, PeoTV, 5G packages)</li>
                </ul>
              </div>
              <div style={{ padding: 14, background: 'var(--table-header, #f8fafc)', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#059669' }}>OTP-Verified Customer Access</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.8 }}>
                  <li><code>show_gb_balance</code> &amp; <code>show_daily_usage</code></li>
                  <li><code>show_bill_history</code> &amp; <code>show_last_payment</code></li>
                  <li><code>show_lte_wallet_detail</code> &amp; <code>show_fault_list</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MCP Clients */}
      {activeTab === 'clients' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Registered machine clients authorized to call this server's <code>/mcp</code> endpoint over Streamable HTTP.
            </p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={15} /> Create MCP Client Key
            </button>
          </div>

          <div style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 10,
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--table-header, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Client Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Client ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Authorized Scopes</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Created</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No MCP machine clients created yet.
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12 }}>{c.client_id}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {c.scopes.map((s, i) => (
                          <span key={i} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 11, marginRight: 4 }}>
                            {s}
                          </span>
                        ))}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', color: '#dc2626' }}
                          onClick={() => handleRevokeClient(c.id)}
                          title="Revoke Secret"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Security Audit Log */}
      {activeTab === 'audit' && (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 10,
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--table-header, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actor</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Outcome</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit events recorded yet or sign-in required.
                  </td>
                </tr>
              ) : (
                auditLogs.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{entry.actor_id}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>({entry.actor_type})</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                        {entry.action}
                      </code>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: entry.outcome === 'ok' ? '#dcfce7' : '#fee2e2',
                        color: entry.outcome === 'ok' ? '#15803d' : '#b91c1c'
                      }}>
                        {entry.outcome.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                      {entry.detail || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create Client Key */}
      {showCreateModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-container" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Create MCP Machine Client</h3>
              <button className="modal-close" onClick={() => { setShowCreateModal(false); setCreatedSecret(null); }}>
                &times;
              </button>
            </div>

            {createdSecret ? (
              <div style={{ padding: '20px 24px' }}>
                <div style={{
                  padding: 14,
                  background: 'rgba(5, 150, 105, 0.08)',
                  border: '1px solid rgba(5, 150, 105, 0.3)',
                  borderRadius: 8,
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                    <CheckCircle2 size={16} /> Client Created Successfully!
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Copy the client secret now. It is hashed in the database and cannot be recovered later.
                  </span>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Client ID</label>
                  <input
                    type="text"
                    readOnly
                    value={createdSecret.client.client_id}
                    style={{ width: '100%', padding: 8, fontFamily: 'monospace', fontSize: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Client Secret (One-Time View)</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      readOnly
                      value={createdSecret.client_secret}
                      style={{ flex: 1, padding: 8, fontFamily: 'monospace', fontSize: 12, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 4, boxSizing: 'border-box' }}
                    />
                    <button
                      className="btn-secondary"
                      onClick={() => copyToClipboard(createdSecret.client_secret)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <button className="btn-primary" style={{ width: '100%' }} onClick={() => { setShowCreateModal(false); setCreatedSecret(null); }}>
                  I Have Safely Saved the Secret
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateClient} style={{ padding: '20px 24px' }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Application / Client Name</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. SLT Enterprise Billing Service"
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Scopes (Space Separated)</label>
                  <input
                    type="text"
                    value={newClientScopes}
                    onChange={(e) => setNewClientScopes(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Generate Credentials</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
