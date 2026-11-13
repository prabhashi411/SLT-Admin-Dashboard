import { Search, User, ExternalLink, Lock, LogOut, Sun, Moon, X } from 'lucide-react';
import { LIVE_ASSISTANT_URL } from '../../data/liveHealth';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface TopBarProps {
  activeNav?: string;
  backendOnline?: boolean;
  activeBrainName?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
  onOpenLoginModal: () => void;
}

export default function TopBar({
  activeNav = 'dashboard',
  backendOnline = false,
  activeBrainName = 'Built-in SLT Assistant',
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onOpenLoginModal,
}: TopBarProps) {
  const { adminUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const placeholder =
    activeNav === 'conversations'
      ? 'Filter calls & chats by session, model, or summary...'
      : activeNav === 'agents'
      ? 'Filter chatbots by name or endpoint URL...'
      : activeNav === 'gateway'
      ? 'Filter SLT tools, API keys, or audit events...'
      : 'Search chatbots, logs, or tools (press Enter)...';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() && onSearchSubmit) {
      onSearchSubmit(searchQuery.trim());
    }
  };

  return (
    <header className="topbar cc-topbar">
      <div className="cc-search-wrap">
        <div className="topbar-search" style={{ width: '100%' }}>
          <Search size={16} className="topbar-search-icon" />
          <input
            id="global-topbar-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Search the admin portal"
          />
        </div>
        {searchQuery && (
          <button
            type="button"
            className="cc-search-clear"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="cc-topbar-right">
        <div
          className="cc-status-pill"
          role="status"
          title={backendOnline ? 'Voice backend on port 8000 is reachable' : 'Voice backend on port 8000 is offline'}
        >
          <span className={`cc-dot ${backendOnline ? 'cc-dot-ok' : 'cc-dot-err'}`} aria-hidden="true" />
          <span>{backendOnline ? activeBrainName : 'Server Offline'}</span>
        </div>

        <a
          href={LIVE_ASSISTANT_URL}
          target="_blank"
          rel="noreferrer"
          className="cc-btn cc-btn-secondary cc-btn-sm"
          title="Open the customer-facing Voice & Chat Assistant"
        >
          <ExternalLink size={14} aria-hidden="true" />
          <span>Customer App</span>
        </a>

        <button
          type="button"
          className="cc-icon-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {adminUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="cc-badge cc-badge-green" title="Signed in as administrator">
              <User size={13} />
              {adminUser.username}
            </span>
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign out"
              className="cc-icon-btn"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLoginModal}
            className="cc-btn cc-btn-primary cc-btn-sm"
          >
            <Lock size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
