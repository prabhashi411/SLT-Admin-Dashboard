import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Dashboard from './pages/Dashboard';
import ConversationsPage from './pages/Conversations';
import ConnectedAgentsPage from './pages/ConnectedAgents';
import RegisterAgent from './pages/RegisterAgent';
import GatewayAuditPage from './pages/GatewayAudit';
import LoginModal from './components/Auth/LoginModal';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { QueryProvider } from './context/QueryProvider';
import {
  initialHealth,
  toLiveHealth,
  type LiveHealthSummary,
} from './data/liveHealth';
import type { Agent } from './types/api';

type View = 'dashboard' | 'conversations' | 'agents' | 'gateway' | 'register';

const POLL_MS = 8000;

function useLiveHealth() {
  const [health, setHealth] = useState<LiveHealthSummary>(initialHealth);

  const poll = useCallback(async () => {
    try {
      const [healthRes, tierRes] = await Promise.all([
        fetch('/health'),
        fetch('/api/voice/tier').catch(() => null),
      ]);
      if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
      const body = await healthRes.json();
      const tier = tierRes && tierRes.ok ? await tierRes.json() : null;
      setHealth(toLiveHealth(body, tier));
    } catch {
      setHealth((prev) => ({ ...prev, online: false }));
    }
  }, []);

  useEffect(() => {
    poll();
    const timer = window.setInterval(poll, POLL_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [poll]);

  return { health, refreshHealth: poll };
}

function MainLayout() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [view, setView] = useState<View>('dashboard');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { health, refreshHealth } = useLiveHealth();

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const navigateTo = (target: View, navId?: string) => {
    setView(target);
    setActiveNav(navId || (target === 'register' ? 'agents' : target));
  };

  const handleNavChange = (id: string) => {
    setActiveNav(id);
    setEditingAgent(null);
    if (['dashboard', 'conversations', 'agents', 'gateway'].includes(id)) {
      setView(id as View);
    }
  };

  const handleOpenCreateAgent = () => {
    setEditingAgent(null);
    navigateTo('register', 'agents');
  };

  const handleOpenEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    navigateTo('register', 'agents');
  };

  const handleSearchSubmit = (q: string) => {
    const lower = q.toLowerCase();
    if (view === 'dashboard') {
      if (lower.includes('bot') || lower.includes('agent') || lower.includes('http')) {
        navigateTo('agents');
      } else if (lower.includes('key') || lower.includes('tool') || lower.includes('audit') || lower.includes('otp')) {
        navigateTo('gateway');
      } else {
        navigateTo('conversations');
      }
    }
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <Dashboard
            onRegisterAgent={handleOpenCreateAgent}
            onNavigateToConversations={() => navigateTo('conversations')}
            onNavigateToAgents={() => navigateTo('agents')}
            onNavigateToGateway={() => navigateTo('gateway')}
            onRefreshHealth={refreshHealth}
            onToast={(msg) => setToastMessage(msg)}
            health={health}
          />
        );
      case 'conversations':
        return (
          <ConversationsPage
            searchQuery={globalSearch}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        );
      case 'agents':
        return (
          <ConnectedAgentsPage
            onRegisterAgent={handleOpenCreateAgent}
            onEditAgent={handleOpenEditAgent}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onBrainChanged={refreshHealth}
            searchQuery={globalSearch}
          />
        );
      case 'register':
        return (
          <RegisterAgent
            editingAgent={editingAgent}
            onBack={() => {
              setEditingAgent(null);
              navigateTo('agents');
            }}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onSuccess={(name, isEdit) => {
              setEditingAgent(null);
              refreshHealth();
              setToastMessage(
                isEdit
                  ? `External chatbot '${name}' updated successfully.`
                  : `External chatbot '${name}' connected successfully.`
              );
              navigateTo('agents');
            }}
          />
        );
      case 'gateway':
        return (
          <GatewayAuditPage
            searchQuery={globalSearch}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        health={health}
      />
      <div className="main-wrapper">
        <TopBar
          activeNav={activeNav}
          backendOnline={health.online}
          activeBrainName={health.activeBrainName}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onSearchSubmit={handleSearchSubmit}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />
        <main className="main-content">
          {toastMessage && (
            <div className="cc-alert cc-alert-success" style={{ marginBottom: 18 }}>
              <span>{toastMessage}</span>
              <button
                type="button"
                className="cc-btn cc-btn-sm cc-btn-secondary"
                onClick={() => setToastMessage(null)}
                aria-label="Dismiss notification"
              >
                Dismiss
              </button>
            </div>
          )}
          {renderView()}
        </main>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => setToastMessage('Signed in as administrator.')}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
