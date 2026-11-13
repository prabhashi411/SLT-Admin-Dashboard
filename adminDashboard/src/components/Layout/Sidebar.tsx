import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Server,
  Lock,
  LogOut,
} from 'lucide-react';
import type { LiveHealthSummary } from '../../data/liveHealth';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { id: 'conversations', label: 'Conversations & QA', icon: MessageSquare },
  { id: 'agents', label: 'Chatbot Agents', icon: Bot },
  { id: 'gateway', label: 'Gateway & Audit', icon: Server },
];

interface SidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
  health: LiveHealthSummary;
  onOpenLoginModal: () => void;
}

function voicePipelineLabel(health: LiveHealthSummary): string {
  return health.voiceTier === 'gemini_live' ? 'Gemini Live' : 'Whisper + TTS';
}

export default function Sidebar({
  activeNav,
  onNavChange,
  health,
  onOpenLoginModal,
}: SidebarProps) {
  const { adminUser, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="voice-layer-brand">
          <div className="voice-layer-title">
            <span className="word-voice">SLT</span>
            <span className="word-layer" style={{ marginLeft: 6 }}>VOICE AI</span>
          </div>
          <div className="voice-layer-sub">COMMAND CENTER</div>
        </div>
      </div>

      <div className="sidebar-section-heading">OPERATIONAL LAYERS</div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon size={18} className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{item.label}</span>
              <span className="cc-nav-live">Live</span>
            </button>
          );
        })}
      </nav>

      {/* Admin Session Badge */}
      <div style={{ padding: '0 16px', marginTop: 12 }}>
        {adminUser ? (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(5, 150, 105, 0.08)',
            border: '1px solid rgba(5, 150, 105, 0.2)',
            borderRadius: 8,
            fontSize: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={12} /> {adminUser.username}
              </span>
              <button
                onClick={logout}
                title="Sign Out"
                style={{ background: 'transparent', border: 0, padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <LogOut size={13} />
              </button>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Administrator Access</span>
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="btn-secondary"
            style={{ width: '100%', fontSize: 12, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Lock size={13} /> Admin Sign-In
          </button>
        )}
      </div>

      <div className="sidebar-footer-card cc-health-card" aria-label="Voice backend status">
        <div className="sla-row">
          <span className="sla-label bold-dark">Voice Backend</span>
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
          <span className="sla-label">Voice path</span>
          <span className="sla-val-dark cc-health-value">
            {health.online ? voicePipelineLabel(health) : '—'}
          </span>
        </div>
      </div>
    </aside>
  );
}
