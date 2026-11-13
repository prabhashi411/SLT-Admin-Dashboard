import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import type { LiveHealthSummary } from '../../data/liveHealth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'agents', label: 'External Chatbots', icon: Bot },
  { id: 'conversations', label: 'Call & Chat Logs', icon: MessageSquare },
  { id: 'gateway', label: 'Security & API Keys', icon: ShieldCheck },
];

interface SidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
  health: LiveHealthSummary;
}

function voicePipelineLabel(health: LiveHealthSummary): string {
  return health.voiceTier === 'gemini_live' ? 'Gemini Live' : 'Whisper + TTS';
}

export default function Sidebar({
  activeNav,
  onNavChange,
  health,
}: SidebarProps) {
  const isExternalActive = health.isExternalActive;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="voice-layer-brand">
          <div className="voice-layer-title">
            <span className="word-voice">SLT</span>
            <span className="word-layer" style={{ marginLeft: 6 }}>VOICE AI</span>
          </div>
          <div className="voice-layer-sub">ADMIN PORTAL</div>
        </div>
      </div>

      <div className="sidebar-section-heading">WORKSPACE</div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
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
          <span className="sla-label">Voice Engine</span>
          <span className="sla-val-dark cc-health-value">
            {health.online ? voicePipelineLabel(health) : '—'}
          </span>
        </div>
      </div>
    </aside>
  );
}
