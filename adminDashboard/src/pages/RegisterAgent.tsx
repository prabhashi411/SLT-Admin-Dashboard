import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Save,
  Play,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Agent, CreateAgentRequest, TestResult } from '../types/api';

interface RegisterAgentProps {
  editingAgent?: Agent | null;
  onBack: () => void;
  onOpenLogin?: () => void;
  onSuccess: (name: string, isEdit: boolean) => void;
}

interface PresetTemplate {
  id: string;
  title: string;
  desc: string;
  url?: string;
  method: 'POST' | 'GET';
  bodyTemplate: string;
  responsePath: string;
}

const PRESETS: PresetTemplate[] = [
  {
    id: 'standard',
    title: 'Standard Webhook',
    desc: 'Best for custom Python/Node bots expecting {message, language, session_id}.',
    method: 'POST',
    bodyTemplate: JSON.stringify(
      {
        message: '{text}',
        language: '{language}',
        session_id: '{session_id}',
      },
      null,
      2
    ),
    responsePath: 'reply',
  },
  {
    id: 'openai',
    title: 'OpenAI / Compatible API',
    desc: 'Works with OpenAI, Groq, vLLM, LM Studio, or Ollama /v1/chat/completions.',
    method: 'POST',
    bodyTemplate: JSON.stringify(
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: '{text}' }],
      },
      null,
      2
    ),
    responsePath: 'choices.0.message.content',
  },
  {
    id: 'rasa',
    title: 'Rasa Webhook',
    desc: 'Standard REST channel format for Rasa Open Source chatbots.',
    method: 'POST',
    bodyTemplate: JSON.stringify(
      {
        sender: '{session_id}',
        message: '{text}',
      },
      null,
      2
    ),
    responsePath: '0.text',
  },
  {
    id: 'echo',
    title: 'Quick Echo Test',
    desc: 'Uses httpbin.org to test the voice pipeline right now without a server.',
    url: 'https://httpbin.org/post',
    method: 'POST',
    bodyTemplate: JSON.stringify(
      {
        message: '{text}',
      },
      null,
      2
    ),
    responsePath: 'json.message',
  },
];

const PLACEHOLDERS = [
  { token: '{text}', hint: "Customer's question" },
  { token: '{language}', hint: 'en / si / ta' },
  { token: '{session_id}', hint: 'Call or chat ID' },
  { token: '{history}', hint: 'Recent conversation array' },
];

export default function RegisterAgent({
  editingAgent = null,
  onBack,
  onOpenLogin,
  onSuccess,
}: RegisterAgentProps) {
  const { isAuthenticated } = useAuth();
  const isEditMode = Boolean(editingAgent);

  const [selectedPreset, setSelectedPreset] = useState<string>(isEditMode ? '' : 'standard');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<'POST' | 'GET'>('POST');
  const [bodyTemplate, setBodyTemplate] = useState(PRESETS[0].bodyTemplate);
  const [responsePath, setResponsePath] = useState(PRESETS[0].responsePath);
  const [authHeaderName, setAuthHeaderName] = useState('Authorization');
  const [authHeaderValue, setAuthHeaderValue] = useState('');
  const [clearAuthHeader, setClearAuthHeader] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(15);
  const [streaming, setStreaming] = useState(false);
  const [activateOnSave, setActivateOnSave] = useState(true);

  const [testMessage, setTestMessage] = useState('Hello! What fiber packages do you offer?');
  const [testLanguage, setTestLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingAgent) {
      setSelectedPreset('');
      setName(editingAgent.name);
      setUrl(editingAgent.url);
      setMethod(editingAgent.method || 'POST');
      setBodyTemplate(editingAgent.body_template || '{}');
      setResponsePath(editingAgent.response_path || '');
      setAuthHeaderName(editingAgent.auth_header_name || 'Authorization');
      setAuthHeaderValue('');
      setClearAuthHeader(false);
      setTimeoutSeconds(editingAgent.timeout_seconds || 15);
      setStreaming(Boolean(editingAgent.streaming));
      setActivateOnSave(Boolean(editingAgent.is_active));
      setTestResult(null);
    } else {
      setSelectedPreset('standard');
      setName('');
      setUrl('');
      setMethod('POST');
      setBodyTemplate(PRESETS[0].bodyTemplate);
      setResponsePath(PRESETS[0].responsePath);
      setAuthHeaderName('Authorization');
      setAuthHeaderValue('');
      setClearAuthHeader(false);
      setTimeoutSeconds(15);
      setStreaming(false);
      setActivateOnSave(true);
      setTestResult(null);
    }
    setError(null);
  }, [editingAgent]);

  const applyPreset = (preset: PresetTemplate) => {
    setSelectedPreset(preset.id);
    setMethod(preset.method);
    setBodyTemplate(preset.bodyTemplate);
    setResponsePath(preset.responsePath);
    if (preset.url && !url.trim()) {
      setUrl(preset.url);
    } else if (preset.id === 'echo') {
      setUrl(preset.url || '');
      if (!name.trim()) setName('Echo Test Bot');
    }
  };

  const insertPlaceholder = (token: string) => {
    setBodyTemplate((prev) => `${prev}${prev.endsWith('\n') || !prev ? '' : ' '}${token}`);
  };

  const validateUrl = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Please enter the chatbot endpoint URL.';
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      return 'URL must start with http:// or https://';
    }
    return null;
  };

  const buildPayload = (): CreateAgentRequest => {
    const payload: CreateAgentRequest = {
      name: name.trim(),
      url: url.trim(),
      method,
      body_template: bodyTemplate,
      response_path: responsePath.trim(),
      timeout_seconds: timeoutSeconds,
      streaming,
    };

    if (clearAuthHeader) {
      payload.clear_auth_header = true;
    } else if (authHeaderValue.trim()) {
      payload.auth_header_name = authHeaderName.trim() || 'Authorization';
      payload.auth_header_value = authHeaderValue.trim();
    } else if (isEditMode && editingAgent?.auth_header_name) {
      payload.auth_header_name = authHeaderName.trim() || editingAgent.auth_header_name;
    }

    return payload;
  };

  const handleTest = async () => {
    const urlErr = validateUrl(url);
    if (urlErr) {
      setError(urlErr);
      return;
    }
    setError(null);
    setTesting(true);
    setTestResult(null);

    try {
      const result = await api.testAgent({
        ...buildPayload(),
        name: name.trim() || 'Draft Chatbot',
        id: editingAgent?.id,
        message: testMessage.trim() || undefined,
        language: testLanguage,
      });
      setTestResult(result);
    } catch {
      setTestResult({
        ok: false,
        reply: null,
        latency_ms: null,
        error: 'Could not reach the backend test endpoint.',
        raw_preview: null,
        suggested_path: null,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please give this chatbot a name.');
      return;
    }
    const urlErr = validateUrl(url);
    if (urlErr) {
      setError(urlErr);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const payload = buildPayload();
      let saved: Agent;

      if (isEditMode && editingAgent) {
        saved = await api.updateAgent(editingAgent.id, payload);
        if (activateOnSave && !saved.is_active) {
          await api.activateAgent(saved.id);
        } else if (!activateOnSave && saved.is_active) {
          await api.deactivateAgent();
        }
      } else {
        saved = await api.createAgent(payload);
        if (activateOnSave) {
          await api.activateAgent(saved.id);
        }
      }

      onSuccess(saved.name, isEditMode);
    } catch {
      setError('Failed to save chatbot settings. Please verify the URL and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="cc-page">
        <button type="button" className="cc-btn cc-btn-secondary cc-btn-sm" onClick={onBack} style={{ width: 'fit-content' }}>
          <ArrowLeft size={14} />
          <span>Back to External Chatbots</span>
        </button>

        <div className="cc-auth-prompt">
          <div className="cc-empty-icon">
            <Lock size={22} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Administrator Sign-In Required</h2>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)', maxWidth: 440 }}>
            Please sign in before connecting or editing an external chatbot.
          </p>
          {onOpenLogin && (
            <button type="button" className="cc-btn cc-btn-primary" onClick={onOpenLogin}>
              <Lock size={15} />
              <span>Sign In as Administrator</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="cc-page">
      {/* Breadcrumb & Header */}
      <div className="cc-page-header">
        <div>
          <button
            type="button"
            className="breadcrumb-back"
            onClick={onBack}
            style={{ marginBottom: 8 }}
          >
            <ArrowLeft size={15} />
            <span>Back to External Chatbots</span>
          </button>
          <h1 className="cc-page-title">
            {isEditMode ? `Edit Chatbot: ${editingAgent?.name}` : 'Connect External Chatbot'}
          </h1>
          <p className="cc-page-sub">
            {isEditMode
              ? 'Update this chatbot’s endpoint, message template, or authentication settings and test it before saving.'
              : 'Pick a preset template below, paste your webhook URL, test a sample reply, and save.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="cc-alert cc-alert-error">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            {error}
          </span>
          <button type="button" className="cc-btn cc-btn-secondary cc-btn-sm" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* 1-Click Preset Templates (shown prominently for new connections, also usable in edit) */}
      <section className="cc-card">
        <div className="cc-card-header">
          <div>
            <h2 className="cc-card-title">
              <Sparkles size={16} style={{ color: 'var(--color-accent-primary)' }} />
              Quick-Fill Templates
            </h2>
            <p className="cc-card-sub">
              Click any format to automatically fill the JSON request body and reply path
            </p>
          </div>
        </div>
        <div className="cc-card-body">
          <div className="cc-preset-grid">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`cc-preset-card ${selectedPreset === preset.id ? 'selected' : ''}`}
                onClick={() => applyPreset(preset)}
              >
                <span className="cc-preset-title">{preset.title}</span>
                <span className="cc-preset-desc">{preset.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Step 1: Name & Endpoint */}
        <section className="cc-card">
          <div className="cc-card-header">
            <div>
              <h2 className="cc-card-title">1. Chatbot Name & Endpoint URL</h2>
              <p className="cc-card-sub">Where customer questions should be sent</p>
            </div>
          </div>

          <div className="cc-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-row" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 240px' }}>
                <label htmlFor="agent-name" className="form-label">
                  Chatbot Name <span className="required">*</span>
                </label>
                <input
                  id="agent-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Billing Support Bot"
                  required
                />
              </div>

              <div className="form-group" style={{ flex: '0 0 140px' }}>
                <label htmlFor="agent-method" className="form-label">
                  HTTP Method
                </label>
                <select
                  id="agent-method"
                  className="form-select"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as 'POST' | 'GET')}
                >
                  <option value="POST">POST (JSON)</option>
                  <option value="GET">GET</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="agent-url" className="form-label">
                Full Webhook URL <span className="required">*</span>
              </label>
              <input
                id="agent-url"
                type="url"
                className="form-input font-mono"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/v1/chat"
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                Include http:// or https:// (for local testing, e.g. http://localhost:8005/chat)
              </span>
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={activateOnSave}
                onChange={(e) => setActivateOnSave(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span>Make this the active answering brain as soon as I save</span>
            </label>
          </div>
        </section>

        {/* Step 2: Message Format & Optional Advanced Settings */}
        <section className="cc-card">
          <div className="cc-card-header">
            <div>
              <h2 className="cc-card-title">2. Message Format</h2>
              <p className="cc-card-sub">What JSON we send to your bot and which field holds its reply</p>
            </div>
          </div>

          <div className="cc-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {method === 'POST' && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <label htmlFor="agent-body" className="form-label" style={{ margin: 0 }}>
                    Request JSON Body Template
                  </label>
                  <div className="cc-chip-row">
                    {PLACEHOLDERS.map((p) => (
                      <button
                        key={p.token}
                        type="button"
                        className="cc-chip"
                        onClick={() => insertPlaceholder(p.token)}
                        title={`Insert ${p.token}: ${p.hint}`}
                      >
                        + {p.token}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  id="agent-body"
                  className="form-textarea font-mono"
                  rows={5}
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                  {'Placeholders: {text} = customer message, {language} = en/si/ta, {session_id} = conversation ID, {history} = recent turns.'}
                </span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="agent-response-path" className="form-label">
                Reply JSON Path (Optional — leave blank for auto-detection)
              </label>
              <input
                id="agent-response-path"
                type="text"
                className="form-input font-mono"
                value={responsePath}
                onChange={(e) => setResponsePath(e.target.value)}
                placeholder="e.g., reply, data.answer, choices.0.message.content"
              />
            </div>

            <details className="cc-advanced-details" open={Boolean(editingAgent?.has_auth_header || editingAgent?.streaming)}>
              <summary>Advanced Settings (API Key Header, Timeout, SSE Streaming)</summary>
              <div className="cc-advanced-body">
                <div className="form-row" style={{ flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: '1 1 200px' }}>
                    <label htmlFor="agent-auth-name" className="form-label">
                      Auth Header Name
                    </label>
                    <input
                      id="agent-auth-name"
                      type="text"
                      className="form-input font-mono"
                      value={authHeaderName}
                      onChange={(e) => setAuthHeaderName(e.target.value)}
                      placeholder="Authorization"
                    />
                  </div>

                  <div className="form-group" style={{ flex: '2 1 260px' }}>
                    <label htmlFor="agent-auth-value" className="form-label">
                      Auth Header Value / Secret
                      {isEditMode && editingAgent?.has_auth_header && (
                        <span style={{ fontWeight: 400, color: 'var(--color-accent-green)' }}>
                          (Stored securely — leave blank to keep)
                        </span>
                      )}
                    </label>
                    <div className="token-input-group">
                      <input
                        id="agent-auth-value"
                        type={showSecret ? 'text' : 'password'}
                        className="form-input token-input font-mono"
                        value={authHeaderValue}
                        onChange={(e) => setAuthHeaderValue(e.target.value)}
                        placeholder={editingAgent?.has_auth_header ? '•••••••• (unchanged)' : 'Bearer sk-...'}
                        disabled={clearAuthHeader}
                      />
                      <button
                        type="button"
                        className="token-toggle"
                        onClick={() => setShowSecret((s) => !s)}
                        aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                      >
                        {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {isEditMode && editingAgent?.has_auth_header && (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={clearAuthHeader}
                      onChange={(e) => setClearAuthHeader(e.target.checked)}
                    />
                    <span>Remove stored auth header</span>
                  </label>
                )}

                <div className="form-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                  <div className="form-group" style={{ flex: '1 1 220px' }}>
                    <label htmlFor="agent-timeout" className="form-label">
                      Response Timeout: {timeoutSeconds} seconds
                    </label>
                    <input
                      id="agent-timeout"
                      type="range"
                      min={2}
                      max={60}
                      value={timeoutSeconds}
                      onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                      className="form-range"
                    />
                  </div>

                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={streaming}
                      onChange={(e) => setStreaming(e.target.checked)}
                    />
                    <span>Use Server-Sent Events (SSE Streaming)</span>
                  </label>
                </div>
              </div>
            </details>
          </div>
        </section>

        {/* Step 3: Live Test Sandbox */}
        <section className="cc-card">
          <div className="cc-card-header">
            <div>
              <h2 className="cc-card-title">3. Test Connection Before Saving</h2>
              <p className="cc-card-sub">Verify your chatbot replies cleanly and check its response time</p>
            </div>
          </div>

          <div className="cc-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: '1 1 280px' }}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Type a sample customer message..."
                aria-label="Test message"
              />
              <select
                className="form-select"
                style={{ width: 130 }}
                value={testLanguage}
                onChange={(e) => setTestLanguage(e.target.value as 'en' | 'si' | 'ta')}
                aria-label="Test language"
              >
                <option value="en">English</option>
                <option value="si">Sinhala</option>
                <option value="ta">Tamil</option>
              </select>
              <button
                type="button"
                className="cc-btn cc-btn-secondary"
                onClick={handleTest}
                disabled={testing}
              >
                <Play size={14} />
                <span>{testing ? 'Testing...' : 'Send Test Message'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`cc-alert ${testResult.ok ? 'cc-alert-success' : 'cc-alert-error'}`}
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  {testResult.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>
                    {testResult.ok
                      ? `Success! Replied in ${testResult.latency_ms ?? 0} ms`
                      : testResult.error || 'Connection test failed'}
                  </span>
                </div>

                {testResult.reply && (
                  <div style={{ fontSize: '0.88rem' }}>
                    <strong>Extracted Reply:</strong> "{testResult.reply}"
                  </div>
                )}

                {testResult.suggested_path && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem' }}>
                      Found reply at JSON path: <code>{testResult.suggested_path}</code>
                    </span>
                    <button
                      type="button"
                      className="cc-btn cc-btn-primary cc-btn-sm"
                      onClick={() => setResponsePath(testResult.suggested_path || '')}
                    >
                      Apply Path
                    </button>
                  </div>
                )}

                {testResult.raw_preview && (
                  <details style={{ width: '100%' }}>
                    <summary style={{ fontSize: '0.78rem', cursor: 'pointer' }}>View Raw Response Preview</summary>
                    <pre
                      style={{
                        marginTop: 8,
                        padding: 10,
                        borderRadius: 8,
                        background: 'rgba(15, 23, 42, 0.08)',
                        fontSize: '0.75rem',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {testResult.raw_preview}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Bottom Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onBack} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="cc-btn cc-btn-primary" disabled={submitting}>
            <Save size={15} />
            <span>{submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save Chatbot'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
