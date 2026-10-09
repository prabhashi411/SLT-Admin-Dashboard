import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  Mic,
  Save,
  X,
} from 'lucide-react';
import sltLogo from '../assets/slt-logo.svg';

interface RegisterAgentProps {
  onBack: () => void;
}

export default function RegisterAgent({ onBack }: RegisterAgentProps) {
  const [agentName, setAgentName] = useState('SLT Broadband Voice Assistant (Colombo North)');
  const [description, setDescription] = useState(
    'Handles fiber broadband optical power validation, automated line restarts, speed complaints, and billing triage for Colombo metropolitan loop.'
  );
  const [baseUrl] = useState('https://');
  const [urlPath, setUrlPath] = useState('api.slt.lk/orchestration/digital-lab/prod');
  const [chatEndpoint, setChatEndpoint] = useState('/v2/voice-gateway/interaction');
  const [bearerToken, setBearerToken] = useState('slt_sec_live_9941a87b3e8c704fa156bc823981');
  const [showToken, setShowToken] = useState(false);
  const [httpMethod, setHttpMethod] = useState('POST (JSON)');
  const [endpointVerified] = useState(true);
  const [pingLoading, setPingLoading] = useState(false);
  const [configValid] = useState(true);
  const descMax = 500;

  const handlePing = () => {
    setPingLoading(true);
    setTimeout(() => setPingLoading(false), 1200);
  };

  return (
    <div className="register-page">
      {/* Breadcrumb */}
      <div className="register-breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}>
          <ArrowLeft size={14} />
          Back to Agents
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">New Voice Pipeline</span>
      </div>

      {/* Page Header */}
      <div className="register-header">
        <div className="register-header-left">
          <img src={sltLogo} alt="SLT Mobitel" className="register-logo" />
          <div>
            <h1 className="register-title">Register Chat Agent &amp; Voice Pipeline</h1>
            <p className="register-subtitle">
              Attach Speech-to-Text (STT) and Text-to-Speech (TTS) layers to your chat agent API endpoint.
            </p>
          </div>
        </div>
        <div className="register-header-actions">
          <button className="btn-cancel" onClick={onBack}>
            <X size={14} />
            Cancel
          </button>
          <button className="btn-save-draft">
            <Save size={14} />
            Save Draft
          </button>
          <button className="btn-save-open">
            <CheckCircle2 size={14} />
            Save &amp; Open Tester
          </button>
        </div>
      </div>

      {/* Form Body */}
      <div className="register-form-body">

        {/* Section 1: Agent Details */}
        <div className="register-section">
          <div className="register-section-header">
            <div className="register-section-num">1</div>
            <div>
              <h2 className="register-section-title">Agent Details</h2>
              <p className="register-section-desc">Basic identification and telco routing category</p>
            </div>
          </div>

          <div className="register-section-content">
            <div className="form-group">
              <label className="form-label">
                Agent Name <span className="required">*</span>
              </label>
              <input
                id="agent-name"
                type="text"
                className="form-input"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. SLT Broadband Voice Assistant"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Description / Operational Notes
                <span className="char-count">{description.length} / {descMax}</span>
              </label>
              <textarea
                id="agent-description"
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, descMax))}
                rows={4}
                placeholder="Describe the agent's purpose, region, and operational scope..."
              />
            </div>
          </div>
        </div>

        {/* Section 2: Chatbot Webhook Endpoint */}
        <div className="register-section">
          <div className="register-section-header">
            <div className="register-section-num">2</div>
            <div>
              <h2 className="register-section-title">Chatbot Webhook Endpoint</h2>
              <p className="register-section-desc">Downstream HTTP API for conversational turns</p>
            </div>
            <div className="section-status-group">
              {endpointVerified && (
                <span className="verified-badge">
                  <CheckCircle2 size={12} />
                  Verified 200 OK
                </span>
              )}
              <button className={`btn-ping ${pingLoading ? 'loading' : ''}`} onClick={handlePing}>
                <RefreshCw size={13} className={pingLoading ? 'spin' : ''} />
                Ping
              </button>
            </div>
          </div>

          <div className="register-section-content">
            <div className="form-row">
              <div className="form-group flex-2">
                <label className="form-label">
                  Base URL <span className="required">*</span>
                </label>
                <div className="url-input-group">
                  <span className="url-prefix">{baseUrl}</span>
                  <input
                    id="base-url"
                    type="text"
                    className="form-input url-path"
                    value={urlPath}
                    onChange={(e) => setUrlPath(e.target.value)}
                    placeholder="api.slt.lk/path"
                  />
                </div>
              </div>
              <div className="form-group flex-1">
                <label className="form-label">
                  HTTP Method <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    id="http-method"
                    className="form-select"
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value)}
                  >
                    <option>POST (JSON)</option>
                    <option>POST (Form)</option>
                    <option>GET</option>
                    <option>PUT (JSON)</option>
                  </select>
                  <ChevronDown size={14} className="select-icon" />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">
                  Chat Endpoint Path <span className="required">*</span>
                </label>
                <input
                  id="chat-endpoint"
                  type="text"
                  className="form-input font-mono"
                  value={chatEndpoint}
                  onChange={(e) => setChatEndpoint(e.target.value)}
                  placeholder="/v2/voice-gateway/interaction"
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">
                  Bearer Token / API Key <span className="required">*</span>
                </label>
                <div className="token-input-group">
                  <input
                    id="bearer-token"
                    type={showToken ? 'text' : 'password'}
                    className="form-input font-mono token-input"
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                    placeholder="slt_sec_live_..."
                  />
                  <button
                    className="token-toggle"
                    onClick={() => setShowToken(!showToken)}
                    title={showToken ? 'Hide token' : 'Show token'}
                    type="button"
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button className="token-regen" title="Regenerate token" type="button">
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Action Bar */}
      <div className="register-footer">
        <div className={`config-status ${configValid ? 'valid' : 'invalid'}`}>
          <span className={`config-dot ${configValid ? 'valid' : 'invalid'}`} />
          {configValid
            ? 'Configuration valid and ready to deploy'
            : 'Configuration has errors - review required fields'}
        </div>
        <div className="register-footer-actions">
          <button className="btn-discard" onClick={onBack}>
            Discard Changes
          </button>
          <button className="btn-save-draft">
            <Save size={14} />
            Save Draft
          </button>
          <button className="btn-save-open large">
            <Mic size={14} />
            Save &amp; Open Voice Tester
          </button>
        </div>
      </div>
    </div>
  );
}
