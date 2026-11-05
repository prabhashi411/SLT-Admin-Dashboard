import { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Dashboard from './pages/Dashboard';
import RegisterAgent, { type NewAgentFormData } from './pages/RegisterAgent';
import ConnectedAgents, { type ConnectedAgentItem, initialAgents } from './pages/ConnectedAgents';
import VoiceTrunks from './pages/VoiceTrunks';
import VoiceRoutingRules from './pages/VoiceRoutingRules';
import TelemetryLogs from './pages/TelemetryLogs';
import SettingsPage from './pages/Settings';
import {
  ENGINEER_CONSOLE_URL,
  initialHealth,
  toLiveHealth,
  type LiveHealthSummary,
} from './data/liveHealth';

type View = 'dashboard' | 'agents' | 'trunks' | 'routing' | 'telemetry' | 'register' | 'settings';

const POLL_MS = 8000;

// Polls the voice backend's public status endpoints. Never throws; an
// unreachable backend just marks the dashboard offline.
function useLiveHealth(): LiveHealthSummary {
  const [health, setHealth] = useState<LiveHealthSummary>(initialHealth);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const [healthRes, tierRes] = await Promise.all([
          fetch('/health'),
          fetch('/api/voice/tier').catch(() => null),
        ]);
        if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
        const body = await healthRes.json();
        const tier = tierRes && tierRes.ok ? await tierRes.json() : null;
        if (!cancelled) setHealth(toLiveHealth(body, tier));
      } catch {
        if (!cancelled) setHealth((prev) => ({ ...prev, online: false }));
      }
    }

    poll();
    const timer = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return health;
}

function PreviewBanner() {
  return (
    <div className="cc-preview-banner" role="note">
      <span>
        <strong>Preview page.</strong> This screen shows sample data for the planned call center
        features. Live chatbot connections are managed in the Engineer Console.
      </span>
      <a href={ENGINEER_CONSOLE_URL} target="_blank" rel="noreferrer">
        Open Engineer Console
      </a>
    </div>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [view, setView] = useState<View>('dashboard');
  const [agents, setAgents] = useState<ConnectedAgentItem[]>(initialAgents);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newAgentId, setNewAgentId] = useState<string | null>(null);
  const health = useLiveHealth();

  const handleRegisterAgent = () => setView('register');

  const handleBackToAgents = () => {
    setActiveNav('agents');
    setView('agents');
  };

  const handleSaveAgent = (formData: NewAgentFormData) => {
    const cleaned = formData.name.replace(/^(SLT|Mobitel)\s+/i, '').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    const initials =
      words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : formData.name.slice(0, 2).toUpperCase();

    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 7);
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const agentId = `agt-${slug || 'bot'}-${randomSuffix}`;

    const newAgent: ConnectedAgentItem = {
      id: String(Date.now()),
      initials: initials || 'VA',
      badgeBg: '#0f52ba',
      name: formData.name,
      agentId,
      phoneTrunk: formData.phoneTrunk ?? '',
      status: 'Live',
      activeCalls: 0,
      category: formData.category,
      sttEngine: 'Whisper v3 SLT-Sinhala/Eng',
      ttsEngine: 'ElevenLabs Neural LK',
    };

    setAgents((prev) => [newAgent, ...prev]);
    setNewAgentId(newAgent.id);
    setToastMessage(`Agent '${formData.name}' registered successfully.`);
    setActiveNav('agents');
    setView('agents');
  };

  const handleDismissToast = () => setToastMessage(null);

  const handleNavChange = (id: string) => {
    setActiveNav(id);
    if (['settings', 'agents', 'trunks', 'routing', 'telemetry', 'dashboard'].includes(id)) {
      setView(id as View);
    }
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard onRegisterAgent={handleRegisterAgent} health={health} />;
      case 'settings':
        return <SettingsPage />;
      case 'register':
        return <RegisterAgent onBack={handleBackToAgents} onSave={handleSaveAgent} />;
      case 'trunks':
        return <VoiceTrunks />;
      case 'routing':
        return <VoiceRoutingRules />;
      case 'telemetry':
        return <TelemetryLogs />;
      default:
        return (
          <ConnectedAgents
            agents={agents}
            onDeployAgent={handleRegisterAgent}
            toastMessage={toastMessage}
            onDismissToast={handleDismissToast}
            newAgentId={newAgentId}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeNav={activeNav} onNavChange={handleNavChange} health={health} />
      <div className="main-wrapper">
        <TopBar
          activeNav={activeNav}
          backendOnline={health.online}
          activeBrainName={health.activeBrainName}
        />
        <main className="main-content">
          {view !== 'dashboard' && <PreviewBanner />}
          {renderView()}
        </main>
      </div>
    </div>
  );
}
