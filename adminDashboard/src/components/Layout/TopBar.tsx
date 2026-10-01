import { Search, Bell, User } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="topbar">
      {/* Search */}
      <div className="topbar-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Query channels, SIP URIs, interaction nodes, or call IDs (Press / )"
        />
      </div>

      {/* Environment Badge */}
      <div className="topbar-env-badge">
        PROD-LK-COLOMBO-01
      </div>

      {/* Gateway Status */}
      <div className="topbar-gateway online">
        <span className="dot" />
        Voice Gateway Online
      </div>

      {/* Right Actions */}
      <div className="topbar-actions">
        <button className="topbar-action-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <div className="topbar-divider" />

        <div className="topbar-user">
          <div className="topbar-user-avatar">
            <User size={16} />
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">Eng. Perera (Admin)</span>
            <span className="topbar-user-role">SecOps / Telecom L3</span>
          </div>
        </div>
      </div>
    </header>
  );
}
