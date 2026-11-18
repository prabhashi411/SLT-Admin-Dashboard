import { useEffect, useState } from 'react';
import { GitBranch, Plus, Trash2, RefreshCw, AlertCircle, Lock } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Agent, RoutingRuleItem } from '../types/api';

interface RoutingRulesPageProps {
  searchQuery: string;
  onOpenLogin: () => void;
  onToast?: (msg: string) => void;
}

export default function RoutingRulesPage({ searchQuery, onOpenLogin, onToast }: RoutingRulesPageProps) {
  const { isAuthenticated, adminUser } = useAuth();
  const [rules, setRules] = useState<RoutingRuleItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [topic, setTopic] = useState('');
  const [targetAgent, setTargetAgent] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Emergency'>('Normal');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [rList, aRes] = await Promise.all([
        api.getRoutingRules(),
        api.getAgents().catch(() => ({ agents: [], active_agent_id: null })),
      ]);
      setRules(rList);
      setAgents(aRes.agents || []);
    } catch {
      setError('Could not load routing rules for this company.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated, adminUser?.tenant_id]);

  if (!isAuthenticated) {
    return (
      <div className="cc-page">
        <div className="cc-card" style={{ padding: 28, textAlign: 'center' }}>
          <Lock size={28} style={{ color: 'var(--primary)', marginBottom: 10 }} />
          <h2 style={{ marginBottom: 6 }}>Company Sign-In Required</h2>
          <p className="cc-muted" style={{ marginBottom: 16 }}>
            Sign in to manage topic routing rules for your company chatbots.
          </p>
          <button type="button" className="cc-btn cc-btn-primary" onClick={onOpenLogin}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !topic.trim()) return;
    setSubmitting(true);
    try {
      await api.createRoutingRule({
        rule_name: ruleName.trim(),
        topic: topic.trim(),
        target_agent: targetAgent.trim(),
        priority,
      });
      setRuleName('');
      setTopic('');
      setTargetAgent('');
      setPriority('Normal');
      setShowForm(false);
      onToast?.('Routing rule created inside this company workspace.');
      await loadData();
    } catch {
      setError('Failed to create routing rule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (rule: RoutingRuleItem) => {
    try {
      const updated = await api.toggleRoutingRule(rule.id, !rule.status);
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      setError('Failed to update routing rule state.');
    }
  };

  const handleDelete = async (rule: RoutingRuleItem) => {
    try {
      await api.deleteRoutingRule(rule.id);
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
      onToast?.(`Removed routing rule "${rule.rule_name}".`);
    } catch {
      setError('Failed to remove routing rule.');
    }
  };

  const filtered = rules.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.rule_name.toLowerCase().includes(q) ||
      r.topic.toLowerCase().includes(q) ||
      (r.target_agent || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="cc-page">
      <div className="cc-page-header">
        <div>
          <h1 className="cc-page-title">Scoped Routing Rules</h1>
          <p className="cc-page-sub">
            Route incoming customer intents to isolated chatbots inside your company tenant.
          </p>
        </div>
        <div className="cc-header-actions">
          <button type="button" className="cc-btn cc-btn-secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={15} />
            <span>{showForm ? 'Cancel' : 'New Routing Rule'}</span>
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

      {showForm && (
        <form className="cc-card" onSubmit={handleCreate} style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Create Company Routing Rule</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Rule Name</label>
              <input
                className="form-input"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Billing Support Route"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Customer Topic / Keyword (* for catch-all)</label>
              <input
                className="form-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="billing, invoice, payment"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Chatbot</label>
              <input
                className="form-input"
                list="scoped-agent-names"
                value={targetAgent}
                onChange={(e) => setTargetAgent(e.target.value)}
                placeholder="Bot name"
              />
              <datalist id="scoped-agent-names">
                {agents.map((a) => (
                  <option key={a.id} value={a.name} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value as 'Normal' | 'High' | 'Emergency')}>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="submit" className="cc-btn cc-btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
        </form>
      )}

      <div className="cc-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="cc-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Topic Keywords</th>
              <th>Target Chatbot</th>
              <th>Priority</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 28 }} className="cc-muted">
                  <GitBranch size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {loading ? 'Loading routing rules...' : 'No routing rules configured for this company yet.'}
                </td>
              </tr>
            ) : (
              filtered.map((rule) => (
                <tr key={rule.id}>
                  <td><strong>{rule.rule_name}</strong></td>
                  <td><code>{rule.topic}</code></td>
                  <td>{rule.target_agent || <span className="cc-muted">Default</span>}</td>
                  <td>
                    <span className={`cc-badge ${rule.priority === 'Emergency' ? 'cc-badge-red' : rule.priority === 'High' ? 'cc-badge-amber' : ''}`}>
                      {rule.priority}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`cc-badge ${rule.status ? 'cc-badge-green' : ''}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => handleToggle(rule)}
                    >
                      {rule.status ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="cc-icon-btn"
                      onClick={() => handleDelete(rule)}
                      title="Delete routing rule"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
