import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Phone,
  MessageSquare,
  Sparkles,
  Volume2,
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Lock,
  Search,
  FileText,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ConversationSessionItem, ConversationDetail } from '../types/api';

interface ConversationsProps {
  searchQuery?: string;
  onOpenLogin: () => void;
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '—';
  if (!end) return 'Active / Open';
  const diffSec = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins}m ${secs}s`;
}

function formatLanguage(lang: string): string {
  if (lang === 'si') return 'Sinhala';
  if (lang === 'ta') return 'Tamil';
  return 'English';
}

export default function Conversations({ searchQuery = '', onOpenLogin }: ConversationsProps) {
  const { isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<ConversationSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [channelFilter, setChannelFilter] = useState<'all' | 'voice' | 'chat'>('all');
  const [langFilter, setLangFilter] = useState<'all' | 'en' | 'si' | 'ta'>('all');
  const [localSearch, setLocalSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);

  const loadConversations = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await api.getConversations(60);
      setConversations(list);
    } catch {
      setError('Could not load conversation logs. Please verify your session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [isAuthenticated]);

  // Sync native <dialog> with selectedId
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selectedId && !dialog.open) {
      dialog.showModal();
    } else if (!selectedId && dialog.open) {
      dialog.close();
    }
  }, [selectedId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => setSelectedId(null);
    dialog.addEventListener('close', handleClose);

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = outside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && outside(e)) dialog.close();
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      return () => {
        dialog.removeEventListener('close', handleClose);
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => dialog.removeEventListener('close', handleClose);
  }, []);

  const handleSelectSession = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const full = await api.getConversation(id);
      setDetail(full);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const effectiveSearch = (localSearch || searchQuery).trim().toLowerCase();

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
      if (langFilter !== 'all' && c.language !== langFilter) return false;
      if (!effectiveSearch) return true;
      return (
        c.id.toLowerCase().includes(effectiveSearch) ||
        (c.model || '').toLowerCase().includes(effectiveSearch) ||
        (c.provider || '').toLowerCase().includes(effectiveSearch)
      );
    });
  }, [conversations, channelFilter, langFilter, effectiveSearch]);

  if (!isAuthenticated) {
    return (
      <div className="cc-page">
        <div className="cc-page-header">
          <div>
            <h1 className="cc-page-title">Call & Chat Logs</h1>
            <p className="cc-page-sub">
              Review transcripts, AI conversation summaries, and recorded voice playback.
            </p>
          </div>
        </div>

        <div className="cc-auth-prompt">
          <div className="cc-empty-icon">
            <Lock size={22} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Administrator Sign-In Required</h2>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)', maxWidth: 440 }}>
            Customer transcripts and call recordings are protected. Sign in to review past voice calls and web chats.
          </p>
          <button type="button" className="cc-btn cc-btn-primary" onClick={onOpenLogin} style={{ marginTop: 6 }}>
            <Lock size={15} />
            <span>Sign In as Administrator</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-page">
      <div className="cc-page-header">
        <div>
          <h1 className="cc-page-title">Call & Chat Logs</h1>
          <p className="cc-page-sub">
            Click any session to read the full customer transcript, AI summary, and consented audio playback.
          </p>
        </div>
        <button
          type="button"
          className="cc-btn cc-btn-secondary"
          onClick={loadConversations}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Loading...' : 'Refresh Logs'}</span>
        </button>
      </div>

      {error && (
        <div className="cc-alert cc-alert-error">
          <span>{error}</span>
          <button type="button" className="cc-btn cc-btn-secondary cc-btn-sm" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="cc-toolbar">
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <div className="topbar-search" style={{ width: '100%' }}>
            <Search size={15} className="topbar-search-icon" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter by session ID or AI model..."
              aria-label="Filter conversations"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="cc-segmented" role="group" aria-label="Filter by channel">
            {([
              { id: 'all', label: 'All Channels' },
              { id: 'voice', label: 'Voice Calls' },
              { id: 'chat', label: 'Web Chat' },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                className={channelFilter === item.id ? 'active' : ''}
                onClick={() => setChannelFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="cc-segmented" role="group" aria-label="Filter by language">
            {([
              { id: 'all', label: 'All Languages' },
              { id: 'en', label: 'English' },
              { id: 'si', label: 'Sinhala' },
              { id: 'ta', label: 'Tamil' },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                className={langFilter === item.id ? 'active' : ''}
                onClick={() => setLangFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table or Empty State */}
      {loading ? (
        <div className="cc-empty-state">
          <Clock size={24} className="spin" style={{ color: 'var(--color-accent-primary)' }} />
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Loading conversation history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cc-empty-state">
          <div className="cc-empty-icon">
            <MessageSquare size={22} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>No Conversations Found</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: 440 }}>
            {conversations.length === 0
              ? 'No voice calls or web chats have been logged yet. Start a test conversation in the Customer App to see it appear here.'
              : 'No sessions match the selected channel, language, or search filter.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper" tabIndex={0} role="region" aria-labelledby="conversations-table-caption">
          <table>
            <caption id="conversations-table-caption" style={{ position: 'absolute', left: -9999 }}>
              Customer voice calls and web chat sessions
            </caption>
            <thead>
              <tr>
                <th scope="col">Session</th>
                <th scope="col">Started</th>
                <th scope="col">Duration</th>
                <th scope="col">Language</th>
                <th scope="col">AI Brain</th>
                <th scope="col">Recording</th>
                <th scope="col" style={{ textAlign: 'right' }}>Transcript</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((session) => {
                const isVoice = session.channel === 'voice';
                return (
                  <tr
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <th scope="row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`cc-badge ${isVoice ? 'cc-badge-green' : 'cc-badge-blue'}`}>
                          {isVoice ? <Phone size={12} /> : <MessageSquare size={12} />}
                          {isVoice ? 'Voice' : 'Chat'}
                        </span>
                        <code style={{ fontSize: '0.8rem', fontFamily: 'var(--font-family-mono, monospace)' }}>
                          {session.id.slice(0, 8)}…
                        </code>
                      </div>
                    </th>
                    <td>{formatDateTime(session.started_at)}</td>
                    <td>{formatDuration(session.started_at, session.ended_at)}</td>
                    <td>
                      <span className="cc-badge cc-badge-neutral">{formatLanguage(session.language)}</span>
                    </td>
                    <td>{session.model || session.provider || 'SLT AI'}</td>
                    <td>
                      {session.recording_consent ? (
                        <span className="cc-badge cc-badge-green">
                          <CheckCircle2 size={12} /> Recorded
                        </span>
                      ) : (
                        <span className="cc-badge cc-badge-neutral">
                          <XCircle size={12} /> No audio
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="cc-btn cc-btn-secondary cc-btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSession(session.id);
                        }}
                      >
                        <span>Inspect</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Native <dialog> Transcript & Audio Inspector */}
      <dialog
        ref={dialogRef}
        className="cc-dialog cc-dialog-lg"
        aria-labelledby="conv-dialog-title"
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="cc-dialog-header">
          <div>
            <h2 id="conv-dialog-title" className="cc-dialog-title">
              <FileText size={18} style={{ color: 'var(--primary)' }} />
              Conversation Transcript
            </h2>
            {selectedId && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>
                Session ID: {selectedId}
              </span>
            )}
          </div>
          <button
            type="button"
            className="cc-dialog-close"
            onClick={() => setSelectedId(null)}
            aria-label="Close transcript dialog"
            autoFocus
          >
            <X size={18} />
          </button>
        </div>

        <div className="cc-dialog-body">
          {detailLoading ? (
            <div className="cc-empty-state" style={{ border: 'none', padding: 28 }}>
              <Clock size={22} className="spin" />
              <span>Loading transcript...</span>
            </div>
          ) : !detail ? (
            <div className="cc-alert cc-alert-error">Failed to load conversation details.</div>
          ) : (
            <>
              {/* Quick Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                <div className="cc-check-item" style={{ flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>Channel</span>
                  <strong style={{ textTransform: 'capitalize', fontSize: '0.86rem' }}>{detail.channel}</strong>
                </div>
                <div className="cc-check-item" style={{ flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>Language</span>
                  <strong style={{ fontSize: '0.86rem' }}>{formatLanguage(detail.language)}</strong>
                </div>
                <div className="cc-check-item" style={{ flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>Duration</span>
                  <strong style={{ fontSize: '0.86rem' }}>{formatDuration(detail.started_at, detail.ended_at)}</strong>
                </div>
                <div className="cc-check-item" style={{ flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>AI Brain</span>
                  <strong style={{ fontSize: '0.86rem' }}>{detail.model || detail.provider || 'SLT AI'}</strong>
                </div>
              </div>

              {/* AI Summary */}
              {detail.summary?.text && (
                <div className="cc-alert cc-alert-info" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    <Sparkles size={15} />
                    <span>AI Conversation Summary</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>{detail.summary.text}</p>
                </div>
              )}

              {/* Consented Audio Players */}
              {detail.recording_consent && (
                <div className="cc-card">
                  <div className="cc-card-header" style={{ padding: '12px 16px' }}>
                    <h3 className="cc-card-title" style={{ fontSize: '0.88rem' }}>
                      <Volume2 size={16} style={{ color: 'var(--color-accent-green)' }} />
                      Recorded Audio Playback
                    </h3>
                  </div>
                  <div className="cc-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
                        Assistant Voice
                      </div>
                      <audio controls style={{ width: '100%', height: 36 }} src={`/conversations/${detail.id}/audio/assistant`} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
                        Customer Voice
                      </div>
                      <audio controls style={{ width: '100%', height: 36 }} src={`/conversations/${detail.id}/audio/user`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Transcript Bubbles */}
              <div>
                <h3 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 700 }}>
                  Messages ({detail.messages?.length ?? 0})
                </h3>
                {!detail.messages || detail.messages.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                    No messages recorded in this session.
                  </p>
                ) : (
                  <div className="cc-transcript-list">
                    {detail.messages.map((m, idx) => {
                      const isUser = m.role === 'user';
                      return (
                        <div key={idx} className={`cc-msg ${isUser ? 'cc-msg-user' : 'cc-msg-assistant'}`}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.85, marginBottom: 3 }}>
                            {isUser ? 'Customer' : 'Assistant'}
                          </div>
                          <div>{m.text}</div>
                          {m.at && (
                            <div className="cc-msg-meta">{new Date(m.at).toLocaleTimeString()}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="cc-dialog-footer">
          <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setSelectedId(null)}>
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}
