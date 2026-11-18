import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  ShieldCheck,
  GitBranch,
  Building2,
  Cloud,
  Globe,
} from 'lucide-react';
import type { LiveHealthSummary } from '../../data/liveHealth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const companyNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Company Overview', icon: LayoutDashboard },
  { id: 'agents', label: 'External Chatbots', icon: Bot },
  { id: 'routing', label: 'Routing Rules', icon: GitBranch },
  { id: 'conversations', label: 'Call & Chat Logs', icon: MessageSquare },
  { id: 'gateway', label: 'Security & API Keys', icon: ShieldCheck },
];

const superNavItems: NavItem[] = [
  { id: 'sa-overview', label: 'Global Overview', icon: Globe },
  { id: 'sa-tenants', label: 'Company Onboarding', icon: Building2 },
  { id: 'sa-providers', label: 'Cloud STT & TTS Pool', icon: Cloud },
];

interface SidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
  health: LiveHealthSummary;
  portalMode: 'company' | 'super';
  onPortalModeChange?: (mode: 'company' | 'super') => void;
  isSuperAdmin?: boolean;
  companyName?: string;
}

function voicePipelineLabel(health: LiveHealthSummary): string {
  return health.voiceTier === 'gemini_live' ? 'Gemini Live (Cloud)' : 'Shared Cloud STT/TTS';
}

export default function Sidebar({
  activeNav,
  onNavChange,
  health,
  portalMode,
  onPortalModeChange,
  isSuperAdmin = false,
  companyName = 'SLT Mobitel',
}: SidebarProps) {
  const isExternalActive = health.isExternalActive;
  const items = portalMode === 'super' && isSuperAdmin ? superNavItems : companyNavItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="voice-layer-brand">
          <div className="voice-layer-title">
            <span className="word-voice">SLT</span>
            <span className="word-layer" style={{ marginLeft: 6 }}>VOICE AI</span>
          </div>
          <div className="voice-layer-sub">
            {portalMode === 'super' && isSuperAdmin ? 'SUPER ADMIN PORTAL' : `${companyName.toUpperCase()} PORTAL`}
          </div>
        </div>
      </div>

      {isSuperAdmin && onPortalModeChange && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          <button
            type="button"
            className={`cc-btn cc-btn-sm ${portalMode === 'company' ? 'cc-btn-primary' : 'cc-btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => onPortalModeChange('company')}
          >
            Company View
          </button>
          <button
            type="button"
            className={`cc-btn cc-btn-sm ${portalMode === 'super' ? 'cc-btn-primary' : 'cc-btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => onPortalModeChange('super')}
          >
            Super Admin
          </button>
        </div>
      )}

      <div className="sidebar-section-heading">
        {portalMode === 'super' && isSuperAdmin ? 'PLATFORM CONTROL' : 'COMPANY WORKSPACE'}
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {items.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon size={18} className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{item.label}</span>
              {item.id === 'agents' && isExternalActive && (
                <span className="cc-nav-live" title="External chatbot is currently answering">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer-card cc-health-card" aria-label="Voice backend status">
        <div className="sla-row">
          <span className="sla-label bold-dark">Voice Server</span>
          <span className={health.online ? 'cc-health-online' : 'cc-health-offline'}>
            {health.online ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="sla-row">
          <span className="sla-label">Answering</span>
          <span className="sla-val-dark cc-health-value" title={health.activeBrainName}>
            {health.online ? health.activeBrainName : '—'}
          </span>
        </div>
        <div className="sla-row">
          <span className="sla-label">Speech Pool</span>
          <span className="sla-val-dark cc-health-value">
            {health.online ? voicePipelineLabel(health) : '—'}
          </span>
        </div>
      </div>
    </aside>
  );
}
