import { useState, useEffect } from 'react';
import {
  Plus,
  RotateCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Bot,
  Zap,
  Power,
  PowerOff,
  Cpu,
} from 'lucide-react';
import { api } from '../api/client';
import type { Agent, TestResult } from '../types/api';
import { useAuth } from '../context/AuthContext';

interface ConnectedAgentsProps {
  onRegisterAgent: () => void;
}

export default function ConnectedAgentsPage({ onRegisterAgent }: ConnectedAgentsProps) {
  const { adminUser } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Testing modal / state
  const [testingAgent, setTestingAgent] = useState<Agent | null>(null);
  const [testQuestion, setTestQuestion] = useState('What broadband packages are available?');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAgents();
      setAgents(res.agents);
      setActiveId(res.active_agent_id);
    } catch {
      setError('Unable to load external agents. Please ensure you are signed in as an administrator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [adminUser]);

  const handleActivate = async (id: number, name: string) => {
    setActionMessage(null);
    try {
      await api.activateAgent(id);
      setActiveId(id);
      setActionMessage(`'${name}' is now active and answering all customer queries.`);
      fetchAgents();
    } catch {
      setError(`Failed to activate agent '${name}'.`);
    }
  };

  const handleDeactivate = async () => {
    setActionMessage(null);
    try {
      await api.deactivateAgent();
      setActiveId(null);
      setActionMessage('Switched back to Built-in SLT Core Assistant.');
      fetchAgents();
    } catch {
      setError('Failed to deactivate agents.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete external chatbot '${name}'?`)) return;
    try {
      await api.deleteAgent(id);
      setActionMessage(`Deleted agent '${name}'.`);
      fetchAgents();
    } catch {
      setError(`Failed to delete agent '${name}'.`);
    }
  };

  const runTest = async (agent: Agent) => {
    setTestRunning(true);
    setTestResult(null);
    try {
      const res = await api.testAgent({
        name: agent.name,
        url: agent.url,
        method: agent.method,
        auth_header_name: agent.auth_header_name,
        body_template: agent.body_template,
        response_path: agent.response_path,
        timeout_seconds: agent.timeout_seconds,
        message: testQuestion,
        language: 'en',
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        ok: false,
        reply: null,
        latency_ms: null,
        error: err.message || 'Network request failed',
        raw_preview: null,
        suggested_path: null,
      });
    } finally {
      setTestRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header cc-page-header">
        <div>
          <h1>External Chatbot Integrations</h1>
          <p>
            Connect partner and enterprise chatbots via HTTP/JSON. When active, all incoming voice and text queries are forwarded to the selected agent with automatic fallback.
          </p>
        </div>
        <div className="cc-header-actions">
          <button className="btn-secondary" onClick={fetchAgents} disabled={loading}>
            <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={onRegisterAgent}>
            <Plus size={15} />
            Connect New Agent
          </button>
        </div>
      </div>

      {/* Active Brain Status Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: activeId ? 'rgba(5, 150, 105, 0.08)' : 'rgba(15, 82, 186, 0.08)',
        border: `1px solid ${activeId ? 'rgba(5, 150, 105, 0.25)' : 'rgba(15, 82, 186, 0.25)'}`,
        borderRadius: 10,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            padding: 10,
            borderRadius: 8,
            background: activeId ? '#059669' : '#0f52ba',
            color: '#fff'
          }}>
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: activeId ? '#059669' : '#0f52ba' }}>
              Current Answering Brain
            </div>
            <h3 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 700 }}>
              {activeId
                ? agents.find((a) => a.id === activeId)?.name || 'External Agent Active'
                : 'Built-in SLT Core Assistant (Default)'}
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {activeId
                ? 'External agent answers incoming questions. If it fails or times out, SLT Core takes over.'
                : 'Queries are answered by SLT local knowledge RAG + Google Vertex AI / Ollama.'}
            </span>
          </div>
        </div>

        {activeId && (
          <button
            className="btn-secondary"
            onClick={handleDeactivate}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <PowerOff size={14} color="#b91c1c" />
            Switch to Built-in SLT
          </button>
        )}
      </div>

      {actionMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          background: 'rgba(5, 150, 105, 0.1)',
          border: '1px solid rgba(5, 150, 105, 0.2)',
          borderRadius: 8,
          color: '#065f46',
          fontSize: 13,
          marginBottom: 20
        }}>
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {error ? (
        <div style={{
          padding: 30,
          textAlign: 'center',
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 10
        }}>
          <AlertCircle size={32} style={{ color: '#b91c1c', marginBottom: 8 }} />
          <p style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Sign in as an administrator to configure external chatbot endpoints.
          </p>
        </div>
      ) : agents.length === 0 ? (
        <div style={{
          padding: 60,
          textAlign: 'center',
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 10
        }}>
          <Bot size={48} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: 12 }} />
          <h3>No External Chatbots Registered</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 450, margin: '8px auto 20px' }}>
            Register your first partner webhook to test external conversational models.
          </p>
          <button className="btn-primary" onClick={onRegisterAgent}>
            <Plus size={15} />
            Connect New Agent
          </button>
        </div>
      ) : (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 10,
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--table-header, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Agent Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Endpoint URL</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Method &amp; Path</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Timeout</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const isActive = agent.id === activeId;
                return (
                  <tr
                    key={agent.id}
                    style={{
                      borderBottom: '1px solid var(--border-color, #e2e8f0)',
                      background: isActive ? 'rgba(5, 150, 105, 0.04)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      {isActive ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 8px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#dcfce7',
                          color: '#15803d'
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                          ACTIVE
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 8px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#f1f5f9',
                          color: '#64748b'
                        }}>
                          Standby
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Bot size={16} color={isActive ? '#059669' : '#0f52ba'} />
                        <span>{agent.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                      {agent.url}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 600, fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>
                        {agent.method}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {agent.response_path}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {agent.timeout_seconds}s
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => {
                            setTestingAgent(agent);
                            setTestResult(null);
                          }}
                          title="Send a sample question to test this endpoint"
                        >
                          <Zap size={13} color="#f59e0b" /> Test
                        </button>

                        {isActive ? (
                          <button
                            className="btn-secondary"
                            style={{ padding: '5px 10px', fontSize: 12, color: '#dc2626' }}
                            onClick={handleDeactivate}
                          >
                            <PowerOff size={13} /> Deactivate
                          </button>
                        ) : (
                          <button
                            className="btn-primary"
                            style={{ padding: '5px 10px', fontSize: 12, background: '#059669', borderColor: '#059669' }}
                            onClick={() => handleActivate(agent.id, agent.name)}
                          >
                            <Power size={13} /> Activate
                          </button>
                        )}

                        <button
                          className="btn-secondary"
                          style={{ padding: '5px 8px', color: '#dc2626' }}
                          onClick={() => handleDelete(agent.id, agent.name)}
                          title="Delete Agent"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Live Sandbox Test Modal */}
      {testingAgent && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-container" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: 8, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, color: '#f59e0b' }}>
                  <Zap size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Test Chatbot Endpoint</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{testingAgent.name} · {testingAgent.url}</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setTestingAgent(null)}>
                &times;
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Test User Prompt</label>
                <input
                  type="text"
                  value={testQuestion}
                  onChange={(e) => setTestQuestion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color, #e2e8f0)',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                className="btn-primary"
                onClick={() => runTest(testingAgent)}
                disabled={testRunning}
                style={{ marginBottom: 20 }}
              >
                {testRunning ? 'Sending to Webhook...' : 'Send Test Request'}
              </button>

              {testResult && (
                <div style={{
                  padding: 16,
                  borderRadius: 8,
                  background: testResult.ok ? 'rgba(5, 150, 105, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                  border: `1px solid ${testResult.ok ? 'rgba(5, 150, 105, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: testResult.ok ? '#059669' : '#dc2626' }}>
                      {testResult.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{testResult.ok ? '200 OK — Success' : 'Endpoint Error'}</span>
                    </div>
                    {testResult.latency_ms != null && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        ⏱️ {testResult.latency_ms} ms
                      </span>
                    )}
                  </div>

                  {testResult.reply && (
                    <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
                      <strong>Extracted Reply:</strong>
                      <div style={{ padding: 10, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 6, marginTop: 4 }}>
                        {testResult.reply}
                      </div>
                    </div>
                  )}

                  {testResult.error && (
                    <div style={{ fontSize: 13, color: '#dc2626' }}>
                      <strong>Error:</strong> {testResult.error}
                    </div>
                  )}

                  {testResult.raw_preview && (
                    <div style={{ marginTop: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Raw Server Response Preview:</span>
                      <pre style={{
                        margin: '4px 0 0',
                        padding: 8,
                        background: '#f8fafc',
                        borderRadius: 6,
                        fontSize: 11,
                        overflowX: 'auto',
                        maxHeight: 120
                      }}>
                        {testResult.raw_preview}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setTestingAgent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
