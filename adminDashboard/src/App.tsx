import { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Dashboard from './pages/Dashboard';
import ConversationsPage from './pages/Conversations';
import ConnectedAgentsPage from './pages/ConnectedAgents';
import RegisterAgent from './pages/RegisterAgent';
import GatewayAuditPage from './pages/GatewayAudit';
import LoginModal from './components/Auth/LoginModal';
import { AuthProvider } from './context/AuthContext';
import {
  initialHealth,
  toLiveHealth,
  type LiveHealthSummary,
} from './data/liveHealth';

type View = 'dashboard' | 'conversations' | 'agents' | 'gateway' | 'register';

const POLL_MS = 8000;

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

function MainLayout() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [view, setView] = useState<View>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const health = useLiveHealth();

  const handleNavChange = (id: string) => {
    setActiveNav(id);
    if (['dashboard', 'conversations', 'agents', 'gateway'].includes(id)) {
      setView(id as View);
    }
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <Dashboard
            onRegisterAgent={() => setView('register')}
            onNavigateToConversations={() => {
              setActiveNav('conversations');
              setView('conversations');
            }}
            onNavigateToAgents={() => {
              setActiveNav('agents');
              setView('agents');
            }}
            health={health}
          />
        );
      case 'conversations':
        return <ConversationsPage />;
      case 'agents':
        return <ConnectedAgentsPage onRegisterAgent={() => setView('register')} />;
      case 'register':
        return (
          <RegisterAgent
            onBack={() => {
              setActiveNav('agents');
              setView('agents');
            }}
            onSuccess={(name) => setToastMessage(`Chatbot agent '${name}' registered successfully.`)}
          />
        );
      case 'gateway':
        return <GatewayAuditPage />;
      default:
        return (
          <Dashboard
            onRegisterAgent={() => setView('register')}
            onNavigateToConversations={() => {
              setActiveNav('conversations');
              setView('conversations');
            }}
            onNavigateToAgents={() => {
              setActiveNav('agents');
              setView('agents');
            }}
            health={health}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        health={health}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />
      <div className="main-wrapper">
        <TopBar
          activeNav={activeNav}
          backendOnline={health.online}
          activeBrainName={health.activeBrainName}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />
        <main className="main-content">
          {toastMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(5, 150, 105, 0.1)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
                borderRadius: 8,
                color: '#065f46',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              <span>{toastMessage}</span>
              <button
                onClick={() => setToastMessage(null)}
                style={{ background: 'transparent', border: 0, cursor: 'pointer', fontWeight: 600, color: '#065f46' }}
              >
                &times;
              </button>
            </div>
          )}
          {renderView()}
        </main>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => setToastMessage('Administrator session active.')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
