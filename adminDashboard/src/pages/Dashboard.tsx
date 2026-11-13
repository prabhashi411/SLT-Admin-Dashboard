import { useState, useEffect } from 'react';
import {
  Plus,
  Activity,
  Globe,
  Cpu,
  ShieldCheck,
  ExternalLink,
  Star,
  MessageSquare,
  Phone,
  ArrowRight,
  Radio,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import StatsCards from '../components/Dashboard/StatsCards';
import {
  LIVE_ASSISTANT_URL,
  type LiveHealthSummary,
} from '../data/liveHealth';
import { api } from '../api/client';
import type { RatingsSummary, StatCard } from '../types/api';

interface DashboardProps {
  onRegisterAgent: () => void;
  onNavigateToConversations: () => void;
  onNavigateToAgents: () => void;
  health: LiveHealthSummary;
}

export default function Dashboard({
  onRegisterAgent,
  onNavigateToConversations,
  onNavigateToAgents,
  health,
}: DashboardProps) {
  const [ratings, setRatings] = useState<RatingsSummary | null>(null);

  useEffect(() => {
    if (health.online) {
      api.getRatings(30).then(setRatings).catch(() => null);
    }
  }, [health.online]);

  const isRelay = health.voiceTier !== 'gemini_live';

  const stats: StatCard[] = [
    {
      id: 'active-brain',
      label: 'Answering Brain',
      value: health.isExternalActive ? 'External' : 'SLT Core',
      sub: health.activeBrainName,
    },
    {
      id: 'voice-pipeline',
      label: 'Voice Path',
      value: isRelay ? 'Relay (Whisper)' : 'Gemini Live',
      sub: isRelay ? 'STT → Brain → TTS' : 'Direct voice to voice (Vertex AI)',
    },
    {
      id: 'hub-latency',
      label: 'Hub Tool Time',
      value: health.hubTurns > 0 ? String(health.hubAvgToolMs) : '—',
      suffix: health.hubTurns > 0 ? 'ms' : undefined,
      sub: `${health.hubSessions} open sessions · ${health.hubTurns} turns`,
    },
    {
      id: 'customer-rating',
      label: 'Customer CSAT',
      value: ratings?.average != null ? `${ratings.average.toFixed(1)}/5` : '—',
      sub: ratings?.count ? `${ratings.count} ratings (last 30d)` : 'No ratings yet',
    },
  ];

  return (
    <>
      <div className={`page-header-tag ${health.online ? '' : 'is-offline'}`}>
        Voice Agent Operations
        <span className="live-dot" />
        <span className="live-text">
          {health.online ? 'Live from backend :8000' : 'Backend offline'}
        </span>
      </div>

      <div className="page-header cc-page-header">
        <div>
          <h1>Operations Command Center</h1>
          <p>
            Monitor live customer service interactions, manage the active AI answering brain, and inspect multi-tier voice health.
          </p>
        </div>
        <div className="cc-header-actions">
          <button className="btn-secondary" onClick={onNavigateToConversations}>
            <MessageSquare size={16} aria-hidden="true" />
            Audit Conversations
          </button>
          <button className="btn-primary" onClick={onRegisterAgent}>
            <Plus size={16} aria-hidden="true" />
            Connect External Chatbot
          </button>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="cc-panels">
        {/* Panel 1: Answering Brain */}
        <section className="cc-panel" aria-labelledby="panel-brain">
          <div className="cc-panel-head">
            <span className="cc-panel-eyebrow">Answering Brain</span>
            <span className="cc-panel-icon is-blue"><Cpu size={16} /></span>
          </div>
          <h3 id="panel-brain" className="cc-panel-title">{health.activeBrainName}</h3>
          <p className="cc-panel-text">
            {health.isExternalActive
              ? 'A partner enterprise chatbot webhook is currently answering incoming customer conversations. Automatic fallback to SLT Core is armed.'
              : 'The built-in SLT Core Assistant answers queries using SLT RAG knowledge base + Google Vertex AI / Ollama.'}
          </p>
          <div className="cc-panel-footer">
            <button
              onClick={onNavigateToAgents}
              className="cc-panel-link"
              style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Manage &amp; Switch Brains <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* Panel 2: Voice Experience */}
        <section className="cc-panel" aria-labelledby="panel-voice">
          <div className="cc-panel-head">
            <span className="cc-panel-eyebrow">Voice Experience</span>
            <span className="cc-panel-icon is-green"><Globe size={16} /></span>
          </div>
          <h3 id="panel-voice" className="cc-panel-title">
            {isRelay ? 'Relay Pipeline: Listen → Think → Speak' : 'Gemini Live: Direct Speech-to-Speech'}
          </h3>
          <p className="cc-panel-text">
            {isRelay
              ? 'Local Whisper speech recognition + Ollama LLM + Neural TTS. 100% offline-capable safety net with barge-in cancellation.'
              : 'Ultra-low latency cloud model running on Vertex AI (us-central1). Answers in Sinhala, Tamil, and English with 3D avatar lip-sync.'}
          </p>
          <div className="cc-panel-footer">
            <a href={LIVE_ASSISTANT_URL} target="_blank" rel="noreferrer" className="cc-panel-link">
              Launch Customer Assistant <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* Panel 3: Security & Verification */}
        <section className="cc-panel" aria-labelledby="panel-security">
          <div className="cc-panel-head">
            <span className="cc-panel-eyebrow">Security &amp; Gatekeeper</span>
            <span className="cc-panel-icon is-sky"><ShieldCheck size={16} /></span>
          </div>
          <h3 id="panel-security" className="cc-panel-title">Zero-Trust Account Access</h3>
          <p className="cc-panel-text">
            Private account inquiries (bills, GB balance) are strictly protected by 3-step OTP verification. The AI cannot access customer balances for unverified guests.
          </p>
          <div className="cc-panel-footer">
            <span className="cc-panel-note">
              <Activity size={13} aria-hidden="true" /> Anti-hallucination scrubber active
            </span>
          </div>
        </section>
      </div>

      {/* System Fabric & Multi-Tier Failover Engine */}
      <div style={{
        marginTop: 24,
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 10,
        padding: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color="#0f52ba" />
              Runtime Telephony Fabric &amp; Failover Circuit
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Real-time multi-tier voice failover, cloud LLM breaker, and MCP hub tool connectivity
            </span>
          </div>
          <span style={{
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 20,
            fontWeight: 600,
            background: health.online ? '#ecfdf5' : '#fef2f2',
            color: health.online ? '#059669' : '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: health.online ? '#10b981' : '#ef4444'
            }} />
            {health.online ? 'Cluster Nominal' : 'Backend Unreachable'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {/* Column 1: Voice Router Tiers */}
          <div style={{ padding: 16, background: 'var(--table-header, #f8fafc)', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dark)' }}>
                <Radio size={15} color="#0f52ba" />
                Voice Router
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 4,
                background: health.voiceTier === 'gemini_live' ? '#dbeafe' : '#fef3c7',
                color: health.voiceTier === 'gemini_live' ? '#1e40af' : '#92400e'
              }}>
                Active: {health.voiceTier === 'gemini_live' ? 'Gemini Live' : 'Local Relay'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--card-bg)', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Tier 1: Gemini Live</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Direct Speech-to-Speech (Vertex AI)</div>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: health.voiceRouter?.tiers?.gemini_live?.state === 'ready' ? '#059669' : '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {health.voiceRouter?.tiers?.gemini_live?.state === 'ready' ? (
                    <><CheckCircle2 size={13} /> Ready</>
                  ) : (
                    <><AlertTriangle size={13} /> Standby</>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--card-bg)', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Tier 2: Local Relay</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Whisper STT + Neural TTS</div>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: health.voiceRouter?.tiers?.local?.state === 'ready' ? '#059669' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {health.voiceRouter?.tiers?.local?.state === 'ready' ? (
                    <><CheckCircle2 size={13} /> Ready</>
                  ) : (
                    <span>Standby</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: LLM Answering Chain */}
          <div style={{ padding: 16, background: 'var(--table-header, #f8fafc)', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dark)' }}>
                <Cpu size={15} color="#0f52ba" />
                LLM Answering Chain
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 4,
                background: '#ecfdf5',
                color: '#065f46'
              }}>
                Primary: Cloud Gemini
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--card-bg)', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Cloud: {health.cloudModel || 'gemini-3.5-flash-lite'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Location: global (Vertex AI)</div>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: health.llmChain?.tiers?.gemini?.state === 'ready' ? '#059669' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <CheckCircle2 size={13} /> Ready
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--card-bg)', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Offline Fallback: Local Llama</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {health.llmChain?.tiers?.local?.last_error ? 'Ollama daemon not running' : 'Ready on localhost:11434'}
                  </div>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: health.llmChain?.tiers?.local?.last_error ? '#94a3b8' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {health.llmChain?.tiers?.local?.last_error ? 'Disarmed' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: MCP Hub & Tools Breaker */}
          <div style={{ padding: 16, background: 'var(--table-header, #f8fafc)', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dark)' }}>
                <Server size={15} color="#0f52ba" />
                MCP Hub &amp; Tool Gateway
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 4,
                background: health.mcpHub?.breaker_open ? '#fef2f2' : '#ecfdf5',
                color: health.mcpHub?.breaker_open ? '#dc2626' : '#065f46'
              }}>
                {health.mcpHub?.breaker_open
                  ? `Breaker Open (${health.mcpHub.breaker_seconds_left}s)`
                  : 'Circuit Closed (Nominal)'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--card-bg)', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Transport &amp; Auth</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Protocol: {health.mcpHub?.transport?.toUpperCase() || 'SSE'} · Auth: {health.mcpHub?.auth || 'Accepted'}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: health.mcpHub?.reachable ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> {health.mcpHub?.reachable ? 'Reachable' : 'Unreachable'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--card-bg)', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Warm Connection Pool</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Speech Engine: {health.speechEngine?.engine || 'Neural TTS'}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0f52ba' }}>
                  {health.mcpHub?.warmPoolSize ?? 3} Reserved
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Satisfaction & Quality Bar */}
      <div style={{
        marginTop: 24,
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 10,
        padding: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={18} color="#f59e0b" fill="#f59e0b" />
              Customer Feedback &amp; CSAT Ratings
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              1-to-5 star ratings submitted by customers at the conclusion of live sessions
            </span>
          </div>
          <button className="btn-secondary" onClick={onNavigateToConversations} style={{ fontSize: 12 }}>
            Inspect Transcripts
          </button>
        </div>

        {ratings && ratings.count > 0 ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              <div style={{ padding: 16, background: 'var(--table-header, #f8fafc)', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall CSAT</span>
                <div style={{ fontSize: 26, fontWeight: 700, margin: '6px 0', color: '#f59e0b' }}>
                  {ratings.average != null ? `${ratings.average.toFixed(1)} / 5.0` : '—'}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {ratings.count} verified reviews ({ratings.verified_count} authenticated)
                </span>
              </div>

              <div style={{ padding: 16, background: 'var(--table-header, #f8fafc)', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Voice Channel CSAT</span>
                <div style={{ fontSize: 26, fontWeight: 700, margin: '6px 0', color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={20} />
                  {ratings.by_channel?.voice?.average != null ? `${ratings.by_channel.voice.average.toFixed(1)} / 5.0` : '—'}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {ratings.by_channel?.voice?.count ?? 0} voice ratings recorded
                </span>
              </div>

              <div style={{ padding: 16, background: 'var(--table-header, #f8fafc)', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chat Channel CSAT</span>
                <div style={{ fontSize: 26, fontWeight: 700, margin: '6px 0', color: '#0f52ba', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={20} />
                  {ratings.by_channel?.chat?.average != null ? `${ratings.by_channel.chat.average.toFixed(1)} / 5.0` : '—'}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {ratings.by_channel?.chat?.count ?? 0} chat ratings recorded
                </span>
              </div>
            </div>

            {/* Rating distribution histogram */}
            <div style={{ padding: '12px 16px', background: 'var(--table-header, #f8fafc)', borderRadius: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                Rating Distribution (1 to 5 Stars)
              </span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratings.distribution?.[String(stars)] ?? 0;
                  const pct = ratings.count > 0 ? Math.round((count / ratings.count) * 100) : 0;
                  return (
                    <div key={stars} style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>
                        <span>{stars}</span>
                        <Star size={12} fill="#f59e0b" />
                      </div>
                      <div style={{ height: 6, background: 'var(--border-color, #e2e8f0)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '30px 20px',
            textAlign: 'center',
            background: 'var(--table-header, #f8fafc)',
            borderRadius: 8,
            color: 'var(--text-muted)'
          }}>
            <Star size={32} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-dark, #0f172a)' }}>
              No customer ratings submitted yet
            </div>
            <p style={{ margin: '4px auto 0', fontSize: 12, maxWidth: 450, lineHeight: 1.5 }}>
              When customers complete calls or web chats at <a href={LIVE_ASSISTANT_URL} target="_blank" rel="noreferrer" style={{ color: '#0f52ba' }}>http://127.0.0.1:8000/</a>, their 1-to-5 star ratings will be verified and analyzed here.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
