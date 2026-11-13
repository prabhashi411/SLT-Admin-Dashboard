import { useState } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  Zap,
  Save,
} from 'lucide-react';
import { api } from '../api/client';
import type { TestResult } from '../types/api';

interface RegisterAgentProps {
  onBack: () => void;
  onSuccess?: (name: string) => void;
}

export default function RegisterAgent({ onBack, onSuccess }: RegisterAgentProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('https://httpbin.org/post');
  const [method, setMethod] = useState<'POST' | 'GET'>('POST');
  const [authHeaderName, setAuthHeaderName] = useState('');
  const [authHeaderValue, setAuthHeaderValue] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('{"message": "{text}"}');
  const [responsePath, setResponsePath] = useState('json.message');
  const [timeoutSeconds, setTimeoutSeconds] = useState(15);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Test state
  const [testing, setTesting] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Hello, tell me about your broadband plans');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setSaveError(null);
    try {
      const res = await api.testAgent({
        name: name || 'Test Agent',
        url,
        method,
        auth_header_name: authHeaderName || null,
        auth_header_value: authHeaderValue || null,
        body_template: bodyTemplate,
        response_path: responsePath,
        timeout_seconds: timeoutSeconds,
        message: testPrompt,
        language: 'en',
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        ok: false,
        reply: null,
        latency_ms: null,
        error: err.message || 'Connection test failed',
        raw_preview: null,
        suggested_path: null,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setSaveError('Agent name and Webhook URL are required.');
      return;
    }
    setSaving(true);
    setSaveError(null);

    try {
      await api.createAgent({
        name: name.trim(),
        url: url.trim(),
        method,
        auth_header_name: authHeaderName.trim() || null,
        auth_header_value: authHeaderValue.trim() || null,
        body_template: bodyTemplate,
        response_path: responsePath,
        timeout_seconds: timeoutSeconds,
      });
      onSuccess?.(name.trim());
      onBack();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to save agent to backend';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>
      <button
        onClick={onBack}
        className="btn-secondary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> Back to Chatbot List
      </button>

      <div className="page-header cc-page-header">
        <div>
          <h1>Connect External Chatbot</h1>
          <p>
            Configure an HTTP webhook endpoint for a partner company chatbot (e.g. Rasa, Dialogflow, or custom AI).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 10,
          padding: 24,
          marginBottom: 20
        }}>
          {saveError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              color: '#b91c1c',
              fontSize: 13,
              marginBottom: 16
            }}>
              <AlertCircle size={16} />
              <span>{saveError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Chatbot Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Enterprise Billing Bot"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color, #e2e8f0)',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                HTTP Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as 'POST' | 'GET')}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color, #e2e8f0)',
                  fontSize: 13,
                  background: '#fff',
                  boxSizing: 'border-box'
                }}
              >
                <option value="POST">POST (Recommended)</option>
                <option value="GET">GET</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Webhook Endpoint URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://partner-company.com/api/chat"
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-color, #e2e8f0)',
                fontSize: 13,
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Loopback and private IPs are blocked for SSRF security unless explicitly enabled in configuration.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Auth Header Name (Optional)
              </label>
              <input
                type="text"
                value={authHeaderName}
                onChange={(e) => setAuthHeaderName(e.target.value)}
                placeholder="e.g. Authorization or X-API-Key"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color, #e2e8f0)',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Auth Header Value (Encrypted in DB)
              </label>
              <input
                type="password"
                value={authHeaderValue}
                onChange={(e) => setAuthHeaderValue(e.target.value)}
                placeholder="Secret key or Bearer token"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color, #e2e8f0)',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                JSON Body Template
              </label>
              <input
                type="text"
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color, #e2e8f0)',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Use <code>{'{text}'}</code> for visitor's message and <code>{'{language}'}</code> for language code.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Response JSON Extraction Path
              </label>
              <input
                type="text"
                value={responsePath}
                onChange={(e) => setResponsePath(e.target.value)}
                placeholder="e.g. reply or json.message"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color, #e2e8f0)',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Dotted path to reply string (e.g. <code>json.message</code> or <code>reply</code>).
              </span>
            </div>
          </div>

          <div style={{ width: 220 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Timeout (Seconds)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={timeoutSeconds}
              onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-color, #e2e8f0)',
                fontSize: 13,
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Live Test Sandbox Card */}
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 10,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={16} color="#f59e0b" />
                Pre-Save Endpoint Verification
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Send a sample question to verify that your URL answers and that your response path parses the reply correctly.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleTest}
              disabled={testing || !url.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Zap size={14} color="#f59e0b" />
              {testing ? 'Testing...' : 'Test Endpoint'}
            </button>
          </div>

          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Sample test question..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--border-color, #e2e8f0)',
              fontSize: 13,
              boxSizing: 'border-box'
            }}
          />

          {testResult && (
            <div style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 8,
              background: testResult.ok ? 'rgba(5, 150, 105, 0.05)' : 'rgba(239, 68, 68, 0.05)',
              border: `1px solid ${testResult.ok ? 'rgba(5, 150, 105, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: testResult.ok ? '#059669' : '#dc2626' }}>
                  {testResult.ok ? '✓ Endpoint Answered Successfully' : '✗ Test Failed'}
                </span>
                {testResult.latency_ms != null && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Latency: {testResult.latency_ms} ms</span>
                )}
              </div>

              {testResult.reply && (
                <div style={{ fontSize: 13 }}>
                  <strong>Extracted Reply:</strong>
                  <div style={{ padding: 8, background: '#fff', borderRadius: 4, border: '1px solid #e2e8f0', marginTop: 4 }}>
                    {testResult.reply}
                  </div>
                </div>
              )}

              {testResult.error && (
                <div style={{ fontSize: 13, color: '#dc2626' }}>{testResult.error}</div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn-secondary" onClick={onBack} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={15} />
            {saving ? 'Saving to Database...' : 'Save & Register Agent'}
          </button>
        </div>
      </form>
    </div>
  );
}
