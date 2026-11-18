import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Dashboard from './pages/Dashboard';
import ConversationsPage from './pages/Conversations';
import ConnectedAgentsPage from './pages/ConnectedAgents';
import RegisterAgent from './pages/RegisterAgent';
import RoutingRulesPage from './pages/RoutingRules';
import GatewayAuditPage from './pages/GatewayAudit';
import SuperAdminPortal from './pages/SuperAdminPortal';
import LoginModal from './components/Auth/LoginModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { api } from './api/client';
import {
  initialHealth,
  toLiveHealth,
  type LiveHealthSummary,
} from './data/liveHealth';
import type { Agent, TenantSummary } from './types/api';

type View =
  | 'dashboard'
  | 'conversations'
  | 'agents'
  | 'routing'
  | 'gateway'
  | 'register'
  | 'sa-overview'
  | 'sa-tenants'
  | 'sa-providers';

const POLL_MS = 8000;

function useLiveHealth() {
  const [health, setHealth] = useState<LiveHealthSummary>(initialHealth);

  const poll = useCallback(async () => {
    try {
      const [body, tier] = await Promise.all([
        api.getHealth(),
        api.getVoiceTier().catch(() => null),
      ]);
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
  const { adminUser } = useAuth();
  const isSuperAdmin = adminUser?.role === 'super_admin';
  const [portalMode, setPortalMode] = useState<'company' | 'super'>('company');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [view, setView] = useState<View>('dashboard');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [scopedTenantId, setScopedTenantId] = useState<number>(() => api.getScopedTenantId() || 1);
  const { health, refreshHealth } = useLiveHealth();

  useEffect(() => {
    if (!adminUser) {
      setPortalMode('company');
      api.setScopedTenantId(null);
      return;
    }
    if (adminUser.role === 'company_admin') {
      const ownTid = adminUser.tenant_id || 1;
      setPortalMode('company');
      setScopedTenantId(ownTid);
      api.setScopedTenantId(ownTid);
      setTenants([]);
      if (view.startsWith('sa-')) {
        setView('dashboard');
        setActiveNav('dashboard');
      }
    } else if (adminUser.role === 'super_admin') {
      const saved = api.getScopedTenantId() || adminUser.tenant_id || 1;
      setScopedTenantId(saved);
      api.setScopedTenantId(saved);
      api.getTenants().then(setTenants).catch(() => setTenants([]));
    }
  }, [adminUser]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const navigateTo = (target: View, navId?: string) => {
    setView(target);
    setActiveNav(navId || (target === 'register' ? 'agents' : target));
  };

  const handlePortalModeChange = (mode: 'company' | 'super') => {
    if (!isSuperAdmin) return;
    setPortalMode(mode);
    setGlobalSearch('');
    if (mode === 'super') {
      navigateTo('sa-overview');
    } else {
      navigateTo('dashboard');
    }
  };

  const handleSwitchTenant = (tid: number) => {
    if (!isSuperAdmin) return;
    setScopedTenantId(tid);
    api.setScopedTenantId(tid);
    refreshHealth();
    setPortalMode('company');
    navigateTo('dashboard');
    const match = tenants.find((t) => t.id === tid);
    if (match) setToastMessage(`Switched scoped workspace to ${match.name}.`);
  };

  const handleNavChange = (id: string) => {
    setActiveNav(id);
    setEditingAgent(null);
    if (id.startsWith('sa-') && isSuperAdmin) {
      setPortalMode('super');
      setView(id as View);
      return;
    }
    if (['dashboard', 'conversations', 'agents', 'routing', 'gateway'].includes(id)) {
      setPortalMode('company');
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
            key={`dash-${scopedTenantId}`}
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
            key={`conv-${scopedTenantId}`}
            searchQuery={globalSearch}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        );
      case 'agents':
        return (
          <ConnectedAgentsPage
            key={`agents-${scopedTenantId}`}
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
      case 'routing':
        return (
          <RoutingRulesPage
            key={`routing-${scopedTenantId}`}
            searchQuery={globalSearch}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onToast={(msg) => setToastMessage(msg)}
          />
        );
      case 'gateway':
        return (
          <GatewayAuditPage
            key={`gateway-${scopedTenantId}`}
            searchQuery={globalSearch}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        );
      case 'sa-overview':
      case 'sa-tenants':
      case 'sa-providers':
        return isSuperAdmin ? (
          <SuperAdminPortal
            activeTab={
              view === 'sa-tenants'
                ? 'tenants'
                : view === 'sa-providers'
                ? 'providers'
                : 'overview'
            }
            searchQuery={globalSearch}
            onInspectCompany={(tenant) => handleSwitchTenant(tenant.id)}
            onToast={(msg) => setToastMessage(msg)}
          />
        ) : null;
      default:
        return null;
    }
  };

  const activeCompanyName =
    tenants.find((t) => t.id === scopedTenantId)?.name ||
    adminUser?.tenant_name ||
    'SLT Mobitel';

  return (
    <div className="app-layout">
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        health={health}
        portalMode={portalMode}
        onPortalModeChange={isSuperAdmin ? handlePortalModeChange : undefined}
        isSuperAdmin={isSuperAdmin}
        companyName={activeCompanyName}
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
          portalMode={portalMode}
          scopedTenantId={scopedTenantId}
          tenants={tenants}
          onSwitchTenant={isSuperAdmin ? handleSwitchTenant : undefined}
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
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
