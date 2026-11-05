import { Search, Bell, User, ExternalLink, Wrench } from 'lucide-react';
import { ENGINEER_CONSOLE_URL, LIVE_ASSISTANT_URL } from '../../data/liveHealth';

interface TopBarProps {
  activeNav?: string;
  backendOnline?: boolean;
  activeBrainName?: string;
}

export default function TopBar({
  activeNav = 'dashboard',
  backendOnline = false,
  activeBrainName = 'Built-in SLT Assistant',
}: TopBarProps) {
  const placeholder =
    activeNav === 'routing'
      ? 'Search rules, agents, hotline numbers...'
      : activeNav === 'telemetry'
      ? 'Search sessions, call IDs, agents...'
      : 'Search hotlines, agents, call IDs...';

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
          href={ENGINEER_CONSOLE_URL}
          target="_blank"
          rel="noreferrer"
          className="cc-link-btn"
          title="Open the Engineer Console (:8000/admin/) to connect and test chatbots"
        >
          <Wrench size={14} aria-hidden="true" />
          <span className="cc-link-text">Engineer Console</span>
        </a>
        <a
          href={LIVE_ASSISTANT_URL}
          target="_blank"
          rel="noreferrer"
          className="cc-link-btn"
          title="Open the live customer voice and chat assistant (:8000/)"
        >
          <ExternalLink size={14} aria-hidden="true" />
          <span className="cc-link-text">Live Assistant</span>
        </a>

        <div className="topbar-divider" />

        <button className="topbar-action-btn" title="Notifications" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className="topbar-user">
          <div className="topbar-user-avatar">
            <User size={16} />
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">Eng. Perera</span>
            <span className="topbar-user-role">Supervisor</span>
          </div>
        </div>
      </div>
    </header>
  );
}
