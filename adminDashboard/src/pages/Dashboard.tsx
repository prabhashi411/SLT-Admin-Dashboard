import { useEffect, useState } from 'react';
import {
  Bot,
  Mic,
  Volume2,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Plus,
  KeyRound,
  Star,
  RotateCcw,
} from 'lucide-react';
import StatsCards from '../components/Dashboard/StatsCards';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LIVE_ASSISTANT_URL, type LiveHealthSummary } from '../data/liveHealth';
import type { RatingsSummary, StatCard } from '../types/api';

interface DashboardProps {
  onRegisterAgent: () => void;
  onNavigateToConversations: () => void;
  onNavigateToAgents: () => void;
  onNavigateToGateway: () => void;
  onRefreshHealth: () => Promise<void> | void;
  onToast?: (message: string) => void;
  health: LiveHealthSummary;
}

export default function Dashboard({
  onRegisterAgent,
  onNavigateToConversations,
  onNavigateToAgents,
  onNavigateToGateway,
  onRefreshHealth,
  onToast,
  health,
}: DashboardProps) {
  const { isAuthenticated } = useAuth();
  const [ratings, setRatings] = useState<RatingsSummary | null>(null);
  const [agentCount, setAgentCount] = useState<number | null>(null);
  const [switchingBack, setSwitchingBack] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSummaryData = async () => {
    try {
      const r = await api.getRatings(30).catch(() => null);
      if (r) setRatings(r);
      if (isAuthenticated) {
        const res = await api.getAgents().catch(() => null);
        if (res) setAgentCount(res.agents.length);
      } else {
        setAgentCount(null);
      }
    } catch {
      // Ignore partial telemetry failures
    }
  };

  useEffect(() => {
    loadSummaryData();
  }, [isAuthenticated]);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([onRefreshHealth(), loadSummaryData()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSwitchToBuiltIn = async () => {
    setSwitchingBack(true);
    try {
      await api.deactivateAgent();
      await onRefreshHealth();
      onToast?.('Switched customer replies back to the Built-in SLT AI Assistant.');
    } catch {
      onToast?.('Please sign in as an administrator to switch the active brain.');
    } finally {
      setSwitchingBack(false);
    }
  };

  const voiceModeLabel = health.voiceTier === 'gemini_live' ? 'Gemini Live' : 'Whisper + TTS';
  const voiceModeSub =
    health.voiceTier === 'gemini_live'
      ? 'Real-time cloud voice (EN · SI · TA)'
      : 'Local Whisper speech + Edge/Piper voice';

  const avgRating = ratings?.average !== null && ratings?.average !== undefined ? ratings.average.toFixed(1) : '—';
  const totalReviews = ratings?.count ?? 0;

  const gatewayStatus = !health.online
    ? 'Offline'
    : health.mcpHub?.breaker_open
    ? 'Paused'
    : health.mcpHub?.reachable
    ? 'Ready'
    : 'Direct Mode';

  const stats: StatCard[] = [
    {
      id: 'brain',
      label: 'Active AI Brain',
      value: health.isExternalActive ? 'External Bot' : 'SLT Built-in AI',
      sub: health.isExternalActive
        ? `Answering as "${health.activeBrainName}"`
        : agentCount !== null
        ? `${agentCount} external chatbot${agentCount === 1 ? '' : 's'} on standby`
        : 'Hybrid cloud + automatic local backup',
    },
    {
      id: 'voice',
      label: 'Voice Mode',
      value: voiceModeLabel,
      sub: voiceModeSub,
    },
    {
      id: 'csat',
      label: 'Customer Satisfaction',
      value: avgRating === '—' ? 'No ratings' : `${avgRating} / 5`,
      trend: totalReviews > 0 ? { value: `${totalReviews} reviews`, direction: 'up' } : undefined,
      sub: 'Based on customer ratings over the last 30 days',
    },
    {
      id: 'tools',
      label: 'SLT Account Tools',
      value: gatewayStatus,
      sub: health.online
        ? `${health.hubSessions} active session${health.hubSessions === 1 ? '' : 's'} · ${health.hubAvgToolMs || 0} ms avg`
        : 'Waiting for backend on port 8000',
    },
  ];

  const totalDistCount = ratings
    ? Object.values(ratings.distribution || {}).reduce((acc, n) => acc + Number(n || 0), 0)
    : 0;

  return (
    <div className="cc-page">
      {/* Header */}
      <div className="cc-page-header">
        <div>
          <h1 className="cc-page-title">System Overview</h1>
          <p className="cc-page-sub">
            A quick look at which AI is answering your customers, voice system health, and recent feedback.
          </p>
        </div>
        <div className="cc-header-actions">
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            onClick={handleRefreshAll}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            onClick={onRegisterAgent}
          >
            <Plus size={15} />
            <span>Connect External Chatbot</span>
          </button>
        </div>
      </div>

      {/* Hero Banner: Who is answering right now? */}
      <section className="cc-hero-banner" aria-label="Active answering assistant">
        <div>
          <div className="cc-hero-eyebrow">
            <Sparkles size={14} />
            <span>{health.online ? 'Live Routing Status' : 'Backend Offline'}</span>
          </div>
          <h2 className="cc-hero-title">
            {!health.online
              ? 'Voice Server Not Reachable'
              : health.isExternalActive
              ? `External Chatbot Active: ${health.activeBrainName}`
              : 'Built-in SLT AI Assistant is Answering Calls & Chats'}
          </h2>
          <p className="cc-hero-desc">
            {!health.online
              ? 'Make sure the Python backend is running on port 8000 to accept customer voice calls and text chats.'
              : health.isExternalActive
              ? 'All incoming customer questions are currently forwarded to your connected external chatbot, while our local voice engine speaks replies back in English, Sinhala, or Tamil.'
              : 'The built-in SLT AI handles billing, data balance, broadband, and support questions natively in English, Sinhala, and Tamil with automatic backup failover.'}
          </p>
        </div>

        <div className="cc-hero-actions">
          {health.isExternalActive && isAuthenticated && (
            <button
              type="button"
              className="cc-hero-btn-light"
              onClick={handleSwitchToBuiltIn}
              disabled={switchingBack}
            >
              <RotateCcw size={15} />
              <span>{switchingBack ? 'Switching...' : 'Switch to Built-in AI'}</span>
            </button>
          )}
          <button
            type="button"
            className={health.isExternalActive && isAuthenticated ? 'cc-hero-btn-ghost' : 'cc-hero-btn-light'}
            onClick={onNavigateToAgents}
          >
            <Bot size={15} />
            <span>{health.isExternalActive ? 'Manage Chatbots' : 'Switch / Connect Chatbot'}</span>
          </button>
          <a
            href={LIVE_ASSISTANT_URL}
            target="_blank"
            rel="noreferrer"
            className="cc-hero-btn-ghost"
          >
            <ExternalLink size={15} />
            <span>Test Voice App</span>
          </a>
        </div>
      </section>

      {/* 4 KPI Cards */}
      <StatsCards stats={stats} />

      {/* 2-Column Plain-English Health & CSAT */}
      <div className="cc-two-col">
        {/* Left: Plain-English System Checklist */}
        <section className="cc-card">
          <div className="cc-card-header">
            <div>
              <h2 className="cc-card-title">How Everything Is Running</h2>
              <p className="cc-card-sub">Live check of speech, voice output, AI brain, and account security</p>
            </div>
            <span className={`cc-badge ${health.online ? 'cc-badge-green' : 'cc-badge-red'}`}>
              {health.online ? 'All Systems Ready' : 'Server Offline'}
            </span>
          </div>

          <div className="cc-card-body">
            <div className="cc-checklist">
              <div className="cc-check-item">
                <div className="cc-check-icon">
                  <Mic size={16} />
                </div>
                <div>
                  <div className="cc-check-title">1. Speech Recognition (Hearing Customers)</div>
                  <div className="cc-check-desc">
                    {health.voiceTier === 'gemini_live'
                      ? 'Using Gemini Live real-time audio understanding for English, Sinhala, and Tamil.'
                      : 'Using local Whisper speech-to-text across English, Sinhala, and Tamil with automatic language detection.'}
                  </div>
                </div>
              </div>

              <div className="cc-check-item">
                <div className="cc-check-icon green">
                  <Volume2 size={16} />
                </div>
                <div>
                  <div className="cc-check-title">2. Voice Replies (Speaking Back)</div>
                  <div className="cc-check-desc">
                    {health.speechEngine?.engine
                      ? `Active voice engine: ${health.speechEngine.engine}. Common greetings are pre-cached for instant playback.`
                      : 'Speaks replies naturally sentence-by-sentence in English, Sinhala, and Tamil.'}
                  </div>
                </div>
              </div>

              <div className="cc-check-item">
                <div className="cc-check-icon">
                  <Bot size={16} />
                </div>
                <div>
                  <div className="cc-check-title">3. AI Brain & Backup Safety Net</div>
                  <div className="cc-check-desc">
                    {health.isExternalActive
                      ? `Routing questions to external chatbot "${health.activeBrainName}".`
                      : `Using ${health.cloudModel || 'Cloud AI'} with automatic backup failover if quota or internet drops.`}
                  </div>
                </div>
              </div>

              <div className="cc-check-item">
                <div className="cc-check-icon amber">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="cc-check-title">4. Customer Account Security</div>
                  <div className="cc-check-desc">
                    General FAQ & packages are public; account balances, bills, and add-ons require customer SMS OTP verification.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Customer Satisfaction + Quick Actions */}
        <section className="cc-card">
          <div className="cc-card-header">
            <div>
              <h2 className="cc-card-title">
                <Star size={17} style={{ color: '#f59e0b' }} />
                Customer Satisfaction (30 Days)
              </h2>
              <p className="cc-card-sub">Ratings collected after voice calls and web chats</p>
            </div>
            {ratings && ratings.count > 0 && (
              <span className="cc-badge cc-badge-amber">{ratings.average?.toFixed(1)} ★ Average</span>
            )}
          </div>

          <div className="cc-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <div className="cc-check-item" style={{ flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Voice Calls
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {ratings?.by_channel?.voice?.average !== null && ratings?.by_channel?.voice?.average !== undefined
                    ? `${ratings.by_channel.voice.average.toFixed(1)} ★`
                    : '—'}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)' }}>
                  {ratings?.by_channel?.voice?.count ?? 0} call ratings
                </span>
              </div>

              <div className="cc-check-item" style={{ flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Web Chat
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {ratings?.by_channel?.chat?.average !== null && ratings?.by_channel?.chat?.average !== undefined
                    ? `${ratings.by_channel.chat.average.toFixed(1)} ★`
                    : '—'}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)' }}>
                  {ratings?.by_channel?.chat?.count ?? 0} chat ratings
                </span>
              </div>
            </div>

            <div className="cc-csat-bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = Number(ratings?.distribution?.[String(star)] || 0);
                const pct = totalDistCount > 0 ? Math.round((count / totalDistCount) * 100) : 0;
                return (
                  <div key={star} className="cc-csat-row">
                    <span style={{ fontWeight: 600 }}>{star} ★</span>
                    <div className="cc-csat-track" aria-label={`${star} star ratings: ${pct}%`}>
                      <div className="cc-csat-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{count}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="cc-btn cc-btn-secondary"
                onClick={onNavigateToConversations}
              >
                <MessageSquare size={15} />
                <span>Review Call & Chat Logs</span>
              </button>
              <button
                type="button"
                className="cc-btn cc-btn-secondary"
                onClick={onNavigateToGateway}
              >
                <KeyRound size={15} />
                <span>API Keys & Audit Log</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
