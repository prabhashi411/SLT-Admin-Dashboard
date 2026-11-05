import {
  LayoutDashboard,
  Headphones,
  Sliders,
  GitBranch,
  Activity,
  Settings,
} from 'lucide-react';
import type { LiveHealthSummary } from '../../data/liveHealth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  // true: the page reads live data from the backend. false: sample data only.
  live: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, live: true },
  { id: 'agents', label: 'Connected Agents', icon: Headphones, live: false },
  { id: 'trunks', label: 'Voice Trunks & SIP', icon: Sliders, live: false },
  { id: 'routing', label: 'Routing Rules', icon: GitBranch, live: false },
  { id: 'telemetry', label: 'Telemetry & Logs', icon: Activity, live: false },
  { id: 'settings', label: 'Settings', icon: Settings, live: false },
];

interface SidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
  health: LiveHealthSummary;
}

function voicePipelineLabel(health: LiveHealthSummary): string {
  return health.voiceTier === 'gemini_live' ? 'Gemini Live' : 'Whisper + TTS';
}

export default function Sidebar({ activeNav, onNavChange, health }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="voice-layer-brand">
          <div className="voice-layer-title">
            <span className="word-voice">VOICE</span>
            <span className="word-layer">LAYER</span>
          </div>
          <div className="voice-layer-sub">COMMAND CENTER</div>
        </div>
      </div>

      <div className="sidebar-section-heading">BUSINESS OVERVIEW</div>

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
              {item.live ? (
                health.online && <span className="cc-nav-live">Live</span>
              ) : (
                <span className="cc-nav-preview" title="This page shows sample data">
                  Preview
                </span>
              )}
            </button>
          );
        })}
      </nav>

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
