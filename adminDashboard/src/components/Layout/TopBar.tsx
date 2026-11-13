import { Search, User, ExternalLink, Wrench, Lock, LogOut } from 'lucide-react';
import { ENGINEER_CONSOLE_URL, LIVE_ASSISTANT_URL } from '../../data/liveHealth';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  activeNav?: string;
  backendOnline?: boolean;
  activeBrainName?: string;
  onOpenLoginModal: () => void;
}

export default function TopBar({
  activeNav = 'dashboard',
  backendOnline = false,
  activeBrainName = 'Built-in SLT Assistant',
  onOpenLoginModal,
}: TopBarProps) {
  const { adminUser, logout } = useAuth();

  const placeholder =
    activeNav === 'conversations'
      ? 'Search conversations, session IDs, transcripts...'
      : activeNav === 'agents'
      ? 'Search external chatbots, webhooks, endpoints...'
      : 'Search operational metrics, models, sessions...';

  return (
    <header className="topbar cc-topbar">
      <div className="topbar-search">
        <Search size={16} className="topbar-search-icon" />
        <input
          id="global-topbar-search"
          type="text"
          placeholder={placeholder}
          aria-label="Search the command center"
        />
      </div>

      <div
        className={`cc-status-chip ${backendOnline ? 'is-online' : ''}`}
        role="status"
        title={backendOnline ? 'Voice backend on :8000 is reachable' : 'Voice backend on :8000 is not reachable'}
      >
        <span className="cc-dot" aria-hidden="true" />
        {backendOnline ? (
          <>
            <span className="cc-chip-label">Answering:</span>
            <span className="cc-chip-value">{activeBrainName}</span>
          </>
        ) : (
          <span className="cc-chip-value">Backend :8000 offline</span>
        )}
      </div>

      <div className="topbar-actions">
        <a
          href={LIVE_ASSISTANT_URL}
          target="_blank"
          rel="noreferrer"
          className="cc-link-btn"
          title="Open live customer voice and chat assistant (:8000/)"
        >
          <ExternalLink size={14} aria-hidden="true" />
          <span className="cc-link-text">Customer App</span>
        </a>

        <a
          href={ENGINEER_CONSOLE_URL}
          target="_blank"
          rel="noreferrer"
          className="cc-link-btn"
          title="Open the Classic Engineer Console (:8000/admin/)"
        >
          <Wrench size={14} aria-hidden="true" />
          <span className="cc-link-text">Classic Admin</span>
        </a>

        <div className="topbar-divider" />

        {adminUser ? (
          <div className="topbar-user" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="topbar-user-avatar" style={{ background: '#059669', color: '#fff' }}>
              <User size={16} />
            </div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{adminUser.username}</span>
              <span className="topbar-user-role">Administrator</span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="btn-secondary"
              style={{ padding: '4px 8px', marginLeft: 4 }}
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="btn-primary"
            style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Lock size={13} /> Sign In
          </button>
        )}
      </div>
    </header>
  );
}
