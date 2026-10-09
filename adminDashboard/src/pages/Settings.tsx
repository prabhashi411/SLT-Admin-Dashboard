import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Phone,
  Webhook,
  Lock,
  Check,
  X,
  Server,
  Globe,
  MapPin,
  Radio,
  Timer,
  Link2,
  ShieldCheck,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';

type TabId = 'general' | 'sip' | 'webhooks' | 'security';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'sip', label: 'SIP Credentials', icon: Phone },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'security', label: 'Security', icon: Lock },
];

/* ── General Tab ── */
function GeneralTab() {
  const [latency, setLatency] = useState(850);
  const [haEnabled, setHaEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [gatewayName, setGatewayName] = useState('PROD-LK-COLOMBO-01');
  const [sipDomain, setSipDomain] = useState('sbc.voice.slt.lk:5061');
  const [region, setRegion] = useState('Colombo Tier-3 IDC (HQ-LK)');
  const [codec, setCodec] = useState('G.711u (PCMU) / Opus-NB (Adaptive)');
  const [webhookUrl, setWebhookUrl] = useState('https://api.crm.slt.lk/v2/voice-events');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="settings-tab-content">
      <div className="settings-form-card">
        {/* Gateway Name */}
        <div className="settings-field">
          <label className="settings-field-label">
            <Server size={14} />
            Gateway Name
          </label>
          <input
            className="settings-field-input"
            value={gatewayName}
            onChange={(e) => setGatewayName(e.target.value)}
          />
        </div>

        {/* SIP Domain */}
        <div className="settings-field">
          <label className="settings-field-label">
            <Globe size={14} />
            SIP Domain
          </label>
          <input
            className="settings-field-input font-mono"
            value={sipDomain}
            onChange={(e) => setSipDomain(e.target.value)}
          />
        </div>

        {/* Region */}
        <div className="settings-field">
          <label className="settings-field-label">
            <MapPin size={14} />
            Region
          </label>
          <div className="settings-select-wrapper">
            <select
              className="settings-field-select"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option>Colombo Tier-3 IDC (HQ-LK)</option>
              <option>Singapore PoP (SG-01)</option>
              <option>Mumbai Edge Node (IN-MUM)</option>
            </select>
            <ChevronRight size={14} className="settings-select-icon" />
          </div>
        </div>

        {/* Primary Codec */}
        <div className="settings-field">
          <label className="settings-field-label">
            <Radio size={14} />
            Primary Codec
          </label>
          <div className="settings-select-wrapper">
            <select
              className="settings-field-select"
              value={codec}
              onChange={(e) => setCodec(e.target.value)}
            >
              <option>G.711u (PCMU) / Opus-NB (Adaptive)</option>
              <option>G.711a (PCMA)</option>
              <option>G.722 (HD Voice)</option>
              <option>Opus (Full Band)</option>
            </select>
            <ChevronRight size={14} className="settings-select-icon" />
          </div>
        </div>

        {/* Latency Threshold */}
        <div className="settings-field">
          <label className="settings-field-label">
            <Timer size={14} />
            Latency Threshold
            <span className="settings-field-value-badge">
              {latency} <span className="unit">ms</span>
            </span>
          </label>
          <div className="settings-range-wrapper">
            <input
              type="range"
              min={100}
              max={2000}
              step={50}
              value={latency}
              onChange={(e) => setLatency(Number(e.target.value))}
              className="settings-range"
              style={{
                background: `linear-gradient(to right, var(--color-accent-primary) 0%, var(--color-accent-primary) ${((latency - 100) / 1900) * 100}%, var(--color-border) ${((latency - 100) / 1900) * 100}%, var(--color-border) 100%)`,
              }}
            />
            <div className="settings-range-labels">
              <span>100ms</span>
              <span>2000ms</span>
            </div>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="settings-field">
          <label className="settings-field-label">
            <Link2 size={14} />
            Webhook URL
          </label>
          <input
            className="settings-field-input font-mono"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
        </div>

        {/* High Availability */}
        <div className="settings-field settings-toggle-field">
          <div className="settings-toggle-info">
            <div className="settings-toggle-title">
              <Zap size={15} style={{ color: 'var(--color-accent-primary)' }} />
              High Availability
            </div>
            <div className="settings-toggle-desc">Active-Standby with state replication</div>
          </div>
          <button
            className={`settings-toggle ${haEnabled ? 'on' : ''}`}
            onClick={() => setHaEnabled(!haEnabled)}
            id="ha-toggle"
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>

        {/* Form Actions */}
        <div className="settings-form-actions">
          <button className="btn-settings-cancel">Cancel</button>
          <button className="btn-settings-save" onClick={handleSave} id="save-general">
            {saved ? (
              <>
                <CheckCircle2 size={15} />
                Saved!
              </>
            ) : (
              <>
                <Check size={15} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── SIP Credentials Tab ── */
function SipCredentialsTab() {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="settings-tab-content">
      <div className="settings-form-card">
        {/* SIP Username */}
        <div className="settings-field">
          <label className="settings-field-label">
            <KeyRound size={14} />
            SIP Username
          </label>
          <div className="settings-copy-group">
            <input
              className="settings-field-input font-mono"
              defaultValue="slt_gw_prod01@sbc.voice.slt.lk"
              readOnly
            />
            <button
              className={`settings-copy-btn ${copied ? 'copied' : ''}`}
              onClick={() => handleCopy('slt_gw_prod01@sbc.voice.slt.lk')}
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* SIP Password */}
        <div className="settings-field">
          <label className="settings-field-label">
            <Lock size={14} />
            SIP Password
          </label>
          <div className="settings-copy-group">
            <input
              className="settings-field-input font-mono"
              type={showSecret ? 'text' : 'password'}
              defaultValue="Xk9$mP2vQrT8nLwZ"
              readOnly
            />
            <button className="settings-copy-btn" onClick={() => setShowSecret(!showSecret)}>
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button className="settings-copy-btn" title="Regenerate">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* SIP Port */}
        <div className="settings-field">
          <label className="settings-field-label">
            <Activity size={14} />
            SIP Signaling Port
          </label>
          <input className="settings-field-input font-mono" defaultValue="5061 (TLS)" readOnly />
        </div>

        {/* Transport */}
        <div className="settings-field">
          <label className="settings-field-label">
            <ShieldCheck size={14} />
            Transport Protocol
          </label>
          <div className="settings-transport-badges">
            {['TLS/SRTP', 'WebSocket (WSS)', 'UDP (Fallback)'].map((p, i) => (
              <span key={p} className={`settings-transport-badge ${i === 0 ? 'primary' : ''}`}>
                {i === 0 && <Check size={11} />}
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* SIP Registration Status */}
        <div className="settings-status-card">
          <div className="settings-status-header">
            <span className="settings-status-dot active" />
            <span className="settings-status-title">SIP Registration Active</span>
            <span className="settings-status-time">Last renewed 47s ago</span>
          </div>
          <div className="settings-status-grid">
            {[
              { label: 'Registrar', value: 'sbc.voice.slt.lk' },
              { label: 'Expires', value: '3600s' },
              { label: 'Contact', value: '10.10.1.54:5061' },
              { label: 'RTT', value: '12ms', accent: true },
            ].map((item) => (
              <div key={item.label} className="settings-status-item">
                <span className="label">{item.label}</span>
                <span className={`value font-mono${item.accent ? ' accent' : ''}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-form-actions">
          <button className="btn-settings-cancel">Cancel</button>
          <button className="btn-settings-save" id="save-sip">
            <Check size={15} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Webhooks Tab ── */
interface WebhookEntry {
  id: string;
  url: string;
  events: string[];
  active: boolean;
}

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([
    {
      id: 'wh-001',
      url: 'https://api.crm.slt.lk/v2/voice-events',
      events: ['call.started', 'call.ended', 'agent.connected'],
      active: true,
    },
    {
      id: 'wh-002',
      url: 'https://monitor.slt.lk/hooks/gateway',
      events: ['trunk.failed', 'sip.error'],
      active: false,
    },
  ]);

  const toggleWebhook = (id: string) => {
    setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w)));
  };

  const deleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="settings-tab-content">
      <div className="settings-webhooks-header">
        <p className="settings-webhooks-desc">
          Configure HTTP endpoints to receive real-time event notifications from the gateway.
        </p>
        <button className="btn-settings-add" id="add-webhook">
          <Plus size={14} />
          Add Endpoint
        </button>
      </div>

      <div className="settings-webhooks-list">
        {webhooks.map((wh) => (
          <div key={wh.id} className={`settings-webhook-card ${!wh.active ? 'inactive' : ''}`}>
            <div className="settings-webhook-top">
              <div className="settings-webhook-url">
                <Link2 size={13} />
                <span className="font-mono">{wh.url}</span>
              </div>
              <div className="settings-webhook-controls">
                <button
                  className={`settings-toggle sm ${wh.active ? 'on' : ''}`}
                  onClick={() => toggleWebhook(wh.id)}
                >
                  <span className="settings-toggle-knob" />
                </button>
                <button className="settings-webhook-delete" onClick={() => deleteWebhook(wh.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="settings-webhook-events">
              {wh.events.map((ev) => (
                <span key={ev} className="settings-event-tag">
                  {ev}
                </span>
              ))}
            </div>
            <div className="settings-webhook-status">
              {wh.active ? (
                <span className="settings-wh-status active">
                  <CheckCircle2 size={12} /> Receiving events
                </span>
              ) : (
                <span className="settings-wh-status inactive">
                  <AlertCircle size={12} /> Disabled
                </span>
              )}
              <span className="settings-wh-id">ID: {wh.id}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="settings-form-actions" style={{ marginTop: '8px' }}>
        <button className="btn-settings-cancel">Cancel</button>
        <button className="btn-settings-save" id="save-webhooks">
          <Check size={15} />
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* ── Security Tab ── */
function SecurityTab() {
  const [tlsVersion, setTlsVersion] = useState('TLS 1.3 (Enforced)');
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState(true);
  const [auditLog, setAuditLog] = useState(true);

  const toggles = [
    {
      id: 'mfa',
      label: 'Multi-Factor Authentication',
      desc: 'Require TOTP/SMS for admin logins',
      icon: Shield,
      value: mfaEnabled,
      set: setMfaEnabled,
    },
    {
      id: 'ip-whitelist',
      label: 'IP Whitelist Enforcement',
      desc: 'Restrict management access by source IP',
      icon: Globe,
      value: ipWhitelist,
      set: setIpWhitelist,
    },
    {
      id: 'audit-log',
      label: 'Audit Logging',
      desc: 'Full audit trail of all config changes',
      icon: Activity,
      value: auditLog,
      set: setAuditLog,
    },
  ];

  return (
    <div className="settings-tab-content">
      <div className="settings-form-card">
        {/* TLS Version */}
        <div className="settings-field">
          <label className="settings-field-label">
            <Lock size={14} />
            TLS Version
          </label>
          <div className="settings-select-wrapper">
            <select
              className="settings-field-select"
              value={tlsVersion}
              onChange={(e) => setTlsVersion(e.target.value)}
            >
              <option>TLS 1.3 (Enforced)</option>
              <option>TLS 1.2 (Compatible)</option>
            </select>
            <ChevronRight size={14} className="settings-select-icon" />
          </div>
        </div>

        {/* Certificate Info */}
        <div className="settings-cert-card">
          <div className="settings-cert-icon">
            <ShieldCheck size={18} />
          </div>
          <div className="settings-cert-info">
            <div className="settings-cert-name">SLT-GW-PROD-CERT-2025</div>
            <div className="settings-cert-detail">
              Issued by <strong>DigiCert Inc.</strong> · Expires <strong>2026-12-31</strong>
            </div>
          </div>
          <span className="settings-cert-badge">Valid</span>
        </div>

        {/* Toggles */}
        {toggles.map((t) => (
          <div key={t.id} className="settings-field settings-toggle-field">
            <div className="settings-toggle-info">
              <div className="settings-toggle-title">
                <t.icon size={15} style={{ color: 'var(--color-accent-primary)' }} />
                {t.label}
              </div>
              <div className="settings-toggle-desc">{t.desc}</div>
            </div>
            <button
              className={`settings-toggle ${t.value ? 'on' : ''}`}
              onClick={() => t.set(!t.value)}
              id={t.id}
            >
              <span className="settings-toggle-knob" />
            </button>
          </div>
        ))}

        <div className="settings-form-actions">
          <button className="btn-settings-cancel">Cancel</button>
          <button className="btn-settings-save" id="save-security">
            <Check size={15} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Settings Page ── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const renderTab = () => {
    switch (activeTab) {
      case 'general':   return <GeneralTab />;
      case 'sip':       return <SipCredentialsTab />;
      case 'webhooks':  return <WebhooksTab />;
      case 'security':  return <SecurityTab />;
    }
  };

  return (
    <div className="settings-page">
      {/* Page Header */}
      <div className="settings-page-header">
        <div className="settings-page-header-left">
          <h1 className="settings-page-title">Settings</h1>
          <p className="settings-page-subtitle">
            Manage core gateway and voice interaction preferences
          </p>
        </div>
        <div className="settings-page-header-actions">
          <button className="btn-settings-cancel">
            <X size={14} />
            Cancel
          </button>
          <button className="btn-settings-save" id="save-top">
            <Check size={14} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="settings-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            id={`tab-${tab.id}`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="settings-content-area">{renderTab()}</div>
    </div>
  );
}
