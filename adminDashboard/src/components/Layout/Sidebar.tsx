import {
  LayoutDashboard,
  Users,
  Phone,
  GitBranch,
  Activity,
  Settings,
  Layers,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: { count: number; label: string };
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'agents',
    label: 'Connected Agents',
    icon: Users,
    badge: { count: 142, label: 'Live' },
  },
  { id: 'trunks', label: 'Voice Trunks & SIP', icon: Phone },
  { id: 'routing', label: 'Routing Rules', icon: GitBranch },
  { id: 'telemetry', label: 'Telemetry & Logs', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
}

export default function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Layers size={20} />
        </div>
        <div className="sidebar-brand-text">
          <h1>SLT Voice Layer Portal</h1>
          <p>Mission-Critical Telephony Fabric</p>
        </div>
      </div>

      {/* Version Badge */}
      <div className="sidebar-version">
        <div className="sidebar-version-badge">
          VOICE FABRIC STACK <span>v4.8.2-r1</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeNav === item.id ? 'active' : ''}`}
            onClick={() => onNavChange(item.id)}
          >
            <item.icon size={18} />
            {item.label}
            {item.badge && (
              <div className="sidebar-nav-badge">
                <span className="count">{item.badge.count}</span>
                <span className="label">{item.badge.label}</span>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer Stats */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-stat">
          <span className="stat-label">Core SIP Cluster</span>
          <span className="stat-value">99.98% SLA</span>
        </div>
        <div className="sidebar-progress-bar">
          <div className="fill" style={{ width: '99.98%' }} />
        </div>
        <div className="sidebar-footer-stat">
          <span className="stat-label">Active Streams</span>
          <span className="stat-value teal">2,418 Ch</span>
        </div>
      </div>
    </aside>
  );
}
