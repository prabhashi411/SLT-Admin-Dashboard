import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  RotateCw,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Volume2,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import type { ConversationSessionItem, ConversationDetail } from '../types/api';
import { useAuth } from '../context/AuthContext';

export default function ConversationsPage() {
  const { adminUser } = useAuth();
  const [conversations, setConversations] = useState<ConversationSessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState<'all' | 'voice' | 'chat'>('all');
  const [langFilter, setLangFilter] = useState<'all' | 'en' | 'si' | 'ta'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected for inspection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getConversations(100);
      setConversations(data);
    } catch {
      setError('Unable to load conversations. Ensure you are signed in as an administrator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [adminUser]);

  const handleSelectSession = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await api.getConversation(id);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = conversations.filter((c) => {
    if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
    if (langFilter !== 'all' && c.language !== langFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        (c.model && c.model.toLowerCase().includes(q)) ||
        c.language.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' (' + d.toLocaleDateString() + ')';
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header cc-page-header">
        <div>
          <h1>Conversations &amp; Quality Assurance</h1>
          <p>
            Audit live visitor interactions, inspect message transcripts, read AI-generated call summaries, and review consented audio recordings.
          </p>
        </div>
        <div className="cc-header-actions">
          <button className="btn-secondary" onClick={fetchConversations} disabled={loading}>
            <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '14px 18px',
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 10,
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Channel:</span>
          {(['all', 'voice', 'chat'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                border: channelFilter === ch ? '1px solid #0f52ba' : '1px solid var(--border-color, #e2e8f0)',
                background: channelFilter === ch ? '#0f52ba' : 'transparent',
                color: channelFilter === ch ? '#fff' : 'inherit'
              }}
            >
              {ch === 'all' ? 'All Channels' : ch === 'voice' ? '🎙️ Voice Only' : '💬 Chat Only'}
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: 'var(--border-color, #e2e8f0)', margin: '0 6px' }} />

          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Language:</span>
          {(['all', 'en', 'si', 'ta'] as const).map((lg) => (
            <button
              key={lg}
              onClick={() => setLangFilter(lg)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                border: langFilter === lg ? '1px solid #0f52ba' : '1px solid var(--border-color, #e2e8f0)',
                background: langFilter === lg ? '#0f52ba' : 'transparent',
                color: langFilter === lg ? '#fff' : 'inherit'
              }}
            >
              {lg === 'all' ? 'All Languages' : lg.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', minWidth: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search session ID or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                borderRadius: 6,
                border: '1px solid var(--border-color, #e2e8f0)',
                fontSize: 13,
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div style={{
          padding: 30,
          textAlign: 'center',
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 10
        }}>
          <p style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Sign in via the top-right button to view customer session transcripts.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 60,
          textAlign: 'center',
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 10
        }}>
          <MessageSquare size={48} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: 12 }} />
          <h3>No conversations found</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 450, margin: '8px auto 0' }}>
            {conversations.length === 0
              ? 'No live calls or chats have been recorded yet. Start a session at http://127.0.0.1:8000/ to see it here.'
              : 'No sessions match your selected filter criteria.'}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 10,
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--table-header, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Channel &amp; Session</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Started</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Language</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>AI Provider</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Audio Consent</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((session) => {
                const isVoice = session.channel === 'voice';
                return (
                  <tr
                    key={session.id}
                    style={{
                      borderBottom: '1px solid var(--border-color, #e2e8f0)',
                      cursor: 'pointer',
                      background: selectedId === session.id ? 'rgba(15,82,186,0.04)' : 'transparent'
                    }}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          padding: 7,
                          borderRadius: 8,
                          background: isVoice ? 'rgba(5, 150, 105, 0.1)' : 'rgba(15, 82, 186, 0.1)',
                          color: isVoice ? '#059669' : '#0f52ba'
                        }}>
                          {isVoice ? <Phone size={16} /> : <MessageSquare size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>
                            {session.id.slice(0, 8)}...
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {isVoice ? 'Live Voice Call' : 'Web Chat Interaction'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {formatTime(session.started_at)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: session.language === 'si' ? '#fef3c7' : session.language === 'ta' ? '#e0e7ff' : '#f1f5f9',
                        color: session.language === 'si' ? '#92400e' : session.language === 'ta' ? '#3730a3' : '#334155'
                      }}>
                        {session.language === 'si' ? 'Sinhala' : session.language === 'ta' ? 'Tamil' : 'English'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        {session.model || session.provider || 'Gemini'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {session.recording_consent ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#059669', fontSize: 12 }}>
                          <CheckCircle2 size={14} /> Recorded
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 12 }}>
                          <XCircle size={14} /> No consent
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSession(session.id);
                        }}
                      >
                        Inspect <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Conversation Detail Inspector Modal */}
      {selectedId && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setSelectedId(null)}>
          <div
            className="modal-container"
            style={{ maxWidth: 750, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: 8, background: 'rgba(15,82,186,0.1)', borderRadius: 8, color: '#0f52ba' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Conversation Transcript &amp; Audit</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    Session ID: {selectedId}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedId(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Loading session data...
                </div>
              ) : !detail ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#b91c1c' }}>
                  Failed to load session details.
                </div>
              ) : (
                <>
                  {/* Meta strip */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12,
                    padding: 14,
                    background: 'var(--table-header, #f8fafc)',
                    borderRadius: 8,
                    marginBottom: 20,
                    fontSize: 12
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Channel</span>
                      <strong style={{ textTransform: 'capitalize' }}>{detail.channel}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Language</span>
                      <strong>{detail.language.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Started</span>
                      <strong>{formatTime(detail.started_at)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Audio Consent</span>
                      <strong>{detail.recording_consent ? 'Consented' : 'None'}</strong>
                    </div>
                  </div>

                  {/* AI Summary Card */}
                  {detail.summary && detail.summary.text && (
                    <div style={{
                      padding: 16,
                      background: 'rgba(15, 82, 186, 0.05)',
                      border: '1px solid rgba(15, 82, 186, 0.2)',
                      borderRadius: 8,
                      marginBottom: 20
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#0f52ba', fontWeight: 600, fontSize: 13 }}>
                        <Sparkles size={16} />
                        <span>AI Conversation Summary</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-dark, #1e293b)' }}>
                        {detail.summary.text}
                      </p>
                    </div>
                  )}

                  {/* Consented Audio Player */}
                  {detail.recording_consent && (
                    <div style={{
                      padding: 16,
                      background: 'var(--card-bg, #ffffff)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: 8,
                      marginBottom: 20
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontWeight: 600, fontSize: 13 }}>
                        <Volume2 size={16} color="#059669" />
                        <span>Recorded Audio Playback (Consented Call)</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                            SLT Assistant Voice
                          </span>
                          <audio
                            controls
                            style={{ width: '100%', height: 38 }}
                            src={`/conversations/${detail.id}/audio/assistant`}
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                            Customer Caller Voice
                          </span>
                          <audio
                            controls
                            style={{ width: '100%', height: 38 }}
                            src={`/conversations/${detail.id}/audio/user`}
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message Bubbles */}
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Transcripts &amp; Turns</h4>
                  {!detail.messages || detail.messages.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No utterances were captured for this session.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {detail.messages.map((m, i) => {
                        const isUser = m.role === 'user';
                        return (
                          <div
                            key={i}
                            style={{
                              alignSelf: isUser ? 'flex-end' : 'flex-start',
                              maxWidth: '82%',
                              padding: '10px 14px',
                              borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                              background: isUser ? '#0f52ba' : 'var(--table-header, #f1f5f9)',
                              color: isUser ? '#ffffff' : 'inherit',
                              fontSize: 13,
                              lineHeight: 1.5
                            }}
                          >
                            <div style={{
                              fontSize: 11,
                              fontWeight: 600,
                              marginBottom: 4,
                              opacity: 0.8,
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 10
                            }}>
                              <span>{isUser ? 'Customer' : 'SLT Assistant'}</span>
                              <span>{m.at ? new Date(m.at).toLocaleTimeString() : ''}</span>
                            </div>
                            <div>{m.text}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setSelectedId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
