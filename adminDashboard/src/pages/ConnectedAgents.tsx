import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Plus,
  Play,
  Pencil,
  Trash2,
  Power,
  RotateCcw,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Search,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Agent, TestResult } from '../types/api';

interface ConnectedAgentsProps {
  onRegisterAgent: () => void;
  onEditAgent: (agent: Agent) => void;
  onOpenLogin: () => void;
  onBrainChanged?: () => void;
  searchQuery?: string;
}

export default function ConnectedAgents({
  onRegisterAgent,
  onEditAgent,
  onOpenLogin,
  onBrainChanged,
  searchQuery = '',
}: ConnectedAgentsProps) {
  const { isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'standby'>('all');
  const [busyId, setBusyId] = useState<number | 'deactivate' | null>(null);

  // Inline test drawer state
  const [testingAgent, setTestingAgent] = useState<Agent | null>(null);
  const [testMessage, setTestMessage] = useState('Hello, can you check my broadband data balance?');
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Native <dialog> delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const loadAgents = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAgents();
      setAgents(res.agents || []);
      setActiveAgentId(res.active_agent_id);
    } catch {
      setError('Could not load connected chatbots. Please check your session and backend status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, [isAuthenticated]);

  // Sync deleteTarget with native <dialog>
  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;

    if (deleteTarget && !dialog.open) {
      dialog.showModal();
    } else if (!deleteTarget && dialog.open) {
      dialog.close();
    }
  }, [deleteTarget]);

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;

    const handleClose = () => setDeleteTarget(null);
    dialog.addEventListener('close', handleClose);

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = outside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && outside(e)) dialog.close();
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      return () => {
        dialog.removeEventListener('close', handleClose);
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => dialog.removeEventListener('close', handleClose);
  }, []);

  const effectiveSearch = (localSearch || searchQuery).trim().toLowerCase();

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      if (statusFilter === 'active' && !agent.is_active) return false;
      if (statusFilter === 'standby' && agent.is_active) return false;
      if (!effectiveSearch) return true;
      return (
        agent.name.toLowerCase().includes(effectiveSearch) ||
        agent.url.toLowerCase().includes(effectiveSearch)
      );
    });
  }, [agents, statusFilter, effectiveSearch]);

  const activeAgent = agents.find((a) => a.id === activeAgentId || a.is_active) || null;

  const handleToggleActive = async (agent: Agent) => {
    setBusyId(agent.id);
    setError(null);
    try {
      if (agent.is_active) {
        await api.deactivateAgent();
      } else {
        await api.activateAgent(agent.id);
      }
      await loadAgents();
      onBrainChanged?.();
    } catch {
      setError(`Failed to update routing for "${agent.name}".`);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeactivateAll = async () => {
    setBusyId('deactivate');
    setError(null);
    try {
      await api.deactivateAgent();
      await loadAgents();
      onBrainChanged?.();
    } catch {
      setError('Failed to switch back to the Built-in SLT AI Assistant.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setBusyId(id);
    try {
      await api.deleteAgent(id);
      if (testingAgent?.id === id) {
        setTestingAgent(null);
        setTestResult(null);
      }
      setDeleteTarget(null);
      await loadAgents();
      onBrainChanged?.();
    } catch {
      setError(`Could not delete "${deleteTarget.name}".`);
    } finally {
      setBusyId(null);
    }
  };

  const handleRunTest = async (agent: Agent) => {
    setTestingAgent(agent);
    setTestRunning(true);
    setTestResult(null);
    try {
      const res = await api.testAgent({
        id: agent.id,
        name: agent.name,
        url: agent.url,
        method: agent.method,
        auth_header_name: agent.auth_header_name,
        body_template: agent.body_template,
        response_path: agent.response_path,
        timeout_seconds: agent.timeout_seconds,
        streaming: agent.streaming,
        message: testMessage,
        language: 'en',
      });
      setTestResult(res);
      await loadAgents();
    } catch {
      setTestResult({
        ok: false,
        reply: null,
        latency_ms: null,
        error: 'Request failed before reaching the chatbot endpoint.',
        raw_preview: null,
        suggested_path: null,
      });
    } finally {
      setTestRunning(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="cc-page">
        <div className="cc-page-header">
          <div>
            <h1 className="cc-page-title">External Chatbots</h1>
            <p className="cc-page-sub">
              Connect your own AI chatbot or webhook so the voice system speaks its answers to customers.
            </p>
          </div>
        </div>

        <div className="cc-auth-prompt">
          <div className="cc-empty-icon">
            <Lock size={22} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Administrator Sign-In Required</h2>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)', maxWidth: 440 }}>
            Sign in to view your connected chatbot endpoints, test live responses, edit configurations, or switch the active answering brain.
          </p>
          <button type="button" className="cc-btn cc-btn-primary" onClick={onOpenLogin} style={{ marginTop: 6 }}>
            <Lock size={15} />
            <span>Sign In as Administrator</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-page">
      {/* Page Header */}
      <div className="cc-page-header">
        <div>
          <h1 className="cc-page-title">External Chatbots</h1>
          <p className="cc-page-sub">
            Switch between the Built-in SLT AI and any external chatbot webhook. Only one brain answers customers at a time.
          </p>
        </div>
        <div className="cc-header-actions">
          {activeAgent && (
            <button
              type="button"
              className="cc-btn cc-btn-secondary"
              onClick={handleDeactivateAll}
              disabled={busyId === 'deactivate'}
            >
              <RotateCcw size={15} />
              <span>{busyId === 'deactivate' ? 'Switching...' : 'Use Built-in SLT AI'}</span>
            </button>
          )}
          <button type="button" className="cc-btn cc-btn-primary" onClick={onRegisterAgent}>
            <Plus size={15} />
            <span>Connect Chatbot</span>
          </button>
        </div>
      </div>

      {/* Routing Banner */}
      <div className={`cc-alert ${activeAgent ? 'cc-alert-success' : 'cc-alert-info'}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bot size={18} />
          <div>
            <strong>
              {activeAgent
                ? `Currently Answering: ${activeAgent.name}`
                : 'Currently Answering: Built-in SLT AI Assistant'}
            </strong>
            <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
              {activeAgent
                ? `Incoming voice calls and chats are routed to ${activeAgent.url}`
                : 'No external chatbot is active. Activate one below to route customer questions to it.'}
            </div>
          </div>
        </div>
        {activeAgent && (
          <button
            type="button"
            className="cc-btn cc-btn-secondary cc-btn-sm"
            onClick={() => handleRunTest(activeAgent)}
          >
            <Play size={13} />
            <span>Quick Test</span>
          </button>
        )}
      </div>

      {error && (
        <div className="cc-alert cc-alert-error">
          <span>{error}</span>
          <button type="button" className="cc-btn cc-btn-secondary cc-btn-sm" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="cc-toolbar">
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
          <div className="topbar-search" style={{ width: '100%' }}>
            <Search size={15} className="topbar-search-icon" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter chatbots by name or URL..."
              aria-label="Filter chatbots"
            />
          </div>
        </div>

        <div className="cc-segmented" role="group" aria-label="Filter chatbots by status">
          {(['all', 'active', 'standby'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={statusFilter === tab ? 'active' : ''}
              onClick={() => setStatusFilter(tab)}
            >
              {tab === 'all' ? `All (${agents.length})` : tab === 'active' ? 'Active' : 'Standby'}
            </button>
          ))}
        </div>
      </div>

      {/* Table or Empty State */}
      {loading ? (
        <div className="cc-empty-state">
          <Clock size={24} className="spin" style={{ color: 'var(--color-accent-primary)' }} />
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Loading external chatbots...</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="cc-empty-state">
          <div className="cc-empty-icon">
            <Bot size={22} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
            {agents.length === 0 ? 'No External Chatbots Connected Yet' : 'No Matching Chatbots'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: 440 }}>
            {agents.length === 0
              ? 'Connect an OpenAI-compatible API, Rasa bot, or any HTTP webhook in under a minute using our 1-click templates.'
              : 'Try clearing your search filter or switching status tabs.'}
          </p>
          {agents.length === 0 && (
            <button type="button" className="cc-btn cc-btn-primary" onClick={onRegisterAgent} style={{ marginTop: 6 }}>
              <Plus size={15} />
              <span>Connect Your First Chatbot</span>
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper" tabIndex={0} role="region" aria-labelledby="agents-table-caption">
          <table>
            <caption id="agents-table-caption" style={{ position: 'absolute', left: -9999 }}>
              Connected external chatbots
            </caption>
            <thead>
              <tr>
                <th scope="col">Chatbot</th>
                <th scope="col">Endpoint</th>
                <th scope="col">Last Health Check</th>
                <th scope="col">Routing</th>
                <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent) => (
                <tr key={agent.id}>
                  <th scope="row">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span>{agent.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span className="cc-badge cc-badge-blue">
                          {agent.streaming ? 'SSE Stream' : 'Standard JSON'}
                        </span>
                        {agent.has_auth_header && (
                          <span className="cc-badge cc-badge-neutral">Auth Header Set</span>
                        )}
                      </div>
                    </div>
                  </th>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <code style={{ fontSize: '0.78rem', fontFamily: 'var(--font-family-mono, monospace)', wordBreak: 'break-all' }}>
                        {agent.method} {agent.url}
                      </code>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)' }}>
                        Timeout: {agent.timeout_seconds}s
                        {agent.response_path ? ` · Reply path: ${agent.response_path}` : ' · Auto-detect reply'}
                      </span>
                    </div>
                  </td>

                  <td>
                    {agent.last_status === 'ok' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span className="cc-badge cc-badge-green" style={{ width: 'fit-content' }}>
                          <CheckCircle2 size={12} />
                          Healthy {agent.last_latency_ms ? `(${agent.last_latency_ms} ms)` : ''}
                        </span>
                      </div>
                    ) : agent.last_status ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span className="cc-badge cc-badge-red" style={{ width: 'fit-content' }}>
                          <AlertCircle size={12} />
                          Error
                        </span>
                        {agent.last_error && (
                          <span
                            style={{ fontSize: '0.73rem', color: 'var(--color-accent-red)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={agent.last_error}
                          >
                            {agent.last_error}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="cc-badge cc-badge-neutral">Not tested yet</span>
                    )}
                  </td>

                  <td>
                    {agent.is_active ? (
                      <span className="cc-badge cc-badge-green">
                        <span className="cc-dot cc-dot-ok" />
                        Active Brain
                      </span>
                    ) : (
                      <span className="cc-badge cc-badge-neutral">Standby</span>
                    )}
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={`cc-btn cc-btn-sm ${agent.is_active ? 'cc-btn-secondary' : 'cc-btn-success'}`}
                        onClick={() => handleToggleActive(agent)}
                        disabled={busyId === agent.id}
                        title={agent.is_active ? 'Pause and revert to Built-in SLT AI' : 'Make this the active answering brain'}
                      >
                        <Power size={13} />
                        <span>{agent.is_active ? 'Deactivate' : 'Activate'}</span>
                      </button>

                      <button
                        type="button"
                        className="cc-btn cc-btn-sm cc-btn-secondary"
                        onClick={() => handleRunTest(agent)}
                        title="Send a live test message"
                      >
                        <Play size={13} />
                        <span>Test</span>
                      </button>

                      <button
                        type="button"
                        className="cc-btn cc-btn-sm cc-btn-secondary"
                        onClick={() => onEditAgent(agent)}
                        title="Edit chatbot settings"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        className="cc-btn cc-btn-sm cc-btn-danger"
                        onClick={() => setDeleteTarget(agent)}
                        aria-label={`Delete ${agent.name}`}
                        title="Delete chatbot"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline Test Sandbox */}
      {testingAgent && (
        <section className="cc-card" aria-label="Live chatbot test sandbox">
          <div className="cc-card-header">
            <div>
              <h2 className="cc-card-title">Live Test: {testingAgent.name}</h2>
              <p className="cc-card-sub">Send a sample customer message to verify the reply before activating</p>
            </div>
            <button
              type="button"
              className="cc-dialog-close"
              onClick={() => setTestingAgent(null)}
              aria-label="Close test panel"
            >
              <X size={16} />
            </button>
          </div>
          <div className="cc-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: '1 1 280px' }}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Type a sample customer question..."
              />
              <button
                type="button"
                className="cc-btn cc-btn-primary"
                onClick={() => handleRunTest(testingAgent)}
                disabled={testRunning}
              >
                <Play size={14} />
                <span>{testRunning ? 'Sending...' : 'Send Test'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`cc-alert ${testResult.ok ? 'cc-alert-success' : 'cc-alert-error'}`} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  {testResult.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>
                    {testResult.ok
                      ? `Reply received in ${testResult.latency_ms ?? 0} ms`
                      : testResult.error || 'Test failed'}
                  </span>
                </div>
                {testResult.reply && (
                  <div style={{ marginTop: 4, fontSize: '0.88rem', lineHeight: 1.5 }}>
                    <strong>Bot replied:</strong> "{testResult.reply}"
                  </div>
                )}
                {testResult.suggested_path && (
                  <div style={{ fontSize: '0.78rem' }}>
                    Suggested response path detected: <code>{testResult.suggested_path}</code> (Click Edit to apply it.)
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Native <dialog> Delete Confirmation (safe action autofocused per modern-web-guidance) */}
      <dialog
        ref={deleteDialogRef}
        className="cc-dialog cc-dialog-sm"
        aria-labelledby="delete-agent-title"
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="cc-dialog-header">
          <h2 id="delete-agent-title" className="cc-dialog-title">
            Delete External Chatbot?
          </h2>
          <button
            type="button"
            className="cc-dialog-close"
            onClick={() => setDeleteTarget(null)}
            aria-label="Close confirmation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="cc-dialog-body">
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Are you sure you want to remove <strong>{deleteTarget?.name}</strong>?
            {deleteTarget?.is_active &&
              ' Since it is currently active, customer replies will switch back to the Built-in SLT AI Assistant.'}
          </p>
        </div>

        <div className="cc-dialog-footer">
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            onClick={() => setDeleteTarget(null)}
            autoFocus
          >
            Keep Chatbot
          </button>
          <button
            type="button"
            className="cc-btn cc-btn-danger-solid"
            onClick={handleConfirmDelete}
            disabled={busyId === deleteTarget?.id}
          >
            {busyId === deleteTarget?.id ? 'Deleting...' : 'Delete Chatbot'}
          </button>
        </div>
      </dialog>
    </div>
  );
}
