import { Plus, Activity, Globe, Cpu, ShieldCheck, ExternalLink, Wrench } from 'lucide-react';
import StatsCards from '../components/Dashboard/StatsCards';
import AgentsTable from '../components/Dashboard/AgentsTable';
import { statsData, agentsData, type Agent, type StatCard } from '../data/mockData';
import {
  ENGINEER_CONSOLE_URL,
  LIVE_ASSISTANT_URL,
  type LiveHealthSummary,
} from '../data/liveHealth';

interface DashboardProps {
  onRegisterAgent: () => void;
  health: LiveHealthSummary;
}

function buildStats(health: LiveHealthSummary): StatCard[] {
  if (!health.online) return statsData;
  const live = health.voiceTier === 'gemini_live';
  return [
    {
      id: 'active-brain',
      label: 'Answering Brain',
      value: health.isExternalActive ? 'External' : 'SLT Core',
      sub: health.activeBrainName,
    },
    {
      id: 'voice-pipeline',
      label: 'Voice Path',
      value: live ? 'Gemini Live' : 'Relay',
      sub: live ? 'Direct voice to voice' : 'Speech to text → brain → speech',
    },
    {
      id: 'hub-latency',
      label: 'Hub Tool Time',
      // No turns yet means no measurement: show a dash, never a made up number.
      value: health.hubTurns > 0 ? String(health.hubAvgToolMs) : '—',
      suffix: health.hubTurns > 0 ? 'ms' : undefined,
      sub: `${health.hubSessions} open sessions · ${health.hubTurns} turns`,
    },
    {
      id: 'languages',
      label: 'Languages',
      value: String(health.languages.length || 3),
      sub: health.languages.length ? health.languages.join(' · ') : 'English · Sinhala · Tamil',
    },
  ];
}

export default function Dashboard({ onRegisterAgent, health }: DashboardProps) {
  const stats = buildStats(health);
  const isRelay = health.voiceTier !== 'gemini_live';

  const sampleAgents: Agent[] = agentsData.map((a) => ({ ...a, source: 'sample' }));
  const agents: Agent[] =
    health.online && health.isExternalActive
      ? [
          {
            id: 'live-external-agent',
            name: health.activeBrainName,
            subtitle: 'External chatbot · connected in the Engineer Console',
            sipEndpoint: 'Web chat & browser voice',
            voicePipeline: { stt: 'Whisper', tts: 'Browser audio stream' },
            status: 'active',
            source: 'live',
          },
          ...sampleAgents,
        ]
      : sampleAgents;

  return (
    <>
      <div className={`page-header-tag ${health.online ? '' : 'is-offline'}`}>
        Business Command Center
        <span className="live-dot" />
        <span className="live-text">
          {health.online ? 'Live from backend :8000' : 'Backend offline · showing sample data'}
        </span>
      </div>

      <div className="page-header cc-page-header">
        <div>
          <h1>Voice &amp; Chatbot Overview</h1>
          <p>
            See who is answering SLT Mobitel customers right now, how calls are routed, and how the
            assistant is performing.
          </p>
        </div>
        <div className="cc-header-actions">
          <a href={ENGINEER_CONSOLE_URL} target="_blank" rel="noreferrer" className="btn-secondary">
            <Wrench size={16} aria-hidden="true" />
            Engineer Console
          </a>
          <button className="btn-primary" onClick={onRegisterAgent}>
            <Plus size={16} aria-hidden="true" />
            Assign Hotline Agent
          </button>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="cc-panels">
        <section className="cc-panel" aria-labelledby="panel-brain">
          <div className="cc-panel-head">
            <span className="cc-panel-eyebrow">Answering brain</span>
            <span className="cc-panel-icon is-blue"><Cpu size={16} /></span>
          </div>
          <h3 id="panel-brain" className="cc-panel-title">{health.activeBrainName}</h3>
          <p className="cc-panel-text">
            {health.isExternalActive
              ? 'Another company’s chatbot is answering every chat and voice turn. If it fails, the built-in SLT assistant takes over automatically.'
              : 'The built-in SLT assistant answers using the SLT knowledge hub and its tools.'}
          </p>
          <div className="cc-panel-footer">
            <a href={ENGINEER_CONSOLE_URL} target="_blank" rel="noreferrer" className="cc-panel-link">
              Change in Engineer Console <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="cc-panel" aria-labelledby="panel-voice">
          <div className="cc-panel-head">
            <span className="cc-panel-eyebrow">Voice experience</span>
            <span className="cc-panel-icon is-green"><Globe size={16} /></span>
          </div>
          <h3 id="panel-voice" className="cc-panel-title">
            {isRelay ? 'Relay: listen → think → speak' : 'Gemini Live: direct voice'}
          </h3>
          <p className="cc-panel-text">
            {isRelay
              ? 'Speech is turned into text, answered by the active brain, then spoken back in the customer’s browser. Callers can interrupt at any time.'
              : 'Google’s live model hears and speaks in one step for the fastest replies. Callers can interrupt at any time.'}
          </p>
          <div className="cc-panel-footer">
            <a href={LIVE_ASSISTANT_URL} target="_blank" rel="noreferrer" className="cc-panel-link">
              Try the live assistant <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="cc-panel" aria-labelledby="panel-security">
          <div className="cc-panel-head">
            <span className="cc-panel-eyebrow">Security</span>
            <span className="cc-panel-icon is-sky"><ShieldCheck size={16} /></span>
          </div>
          <h3 id="panel-security" className="cc-panel-title">Protected by default</h3>
          <p className="cc-panel-text">
            Chatbot passwords are stored encrypted, unsafe addresses are blocked, and only signed-in
            admins can change who answers.
          </p>
          <div className="cc-panel-footer">
            <span className="cc-panel-note">
              <Activity size={13} aria-hidden="true" /> Every admin change is logged
            </span>
          </div>
        </section>
      </div>

      <div className="cc-section-title">
        <h2>Agent directory</h2>
        <span>Live rows come from the backend · Sample rows show the planned hotline layout</span>
      </div>
      <AgentsTable agents={agents} />
    </>
  );
}
