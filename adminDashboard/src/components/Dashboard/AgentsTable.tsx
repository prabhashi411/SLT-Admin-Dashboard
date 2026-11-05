import { useState } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import type { Agent } from '../../data/mockData';
import { LIVE_ASSISTANT_URL } from '../../data/liveHealth';

interface AgentsTableProps {
  agents: Agent[];
}

type FilterType = 'all' | 'active' | 'standby';

export default function AgentsTable({ agents }: AgentsTableProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const query = searchQuery.trim().toLowerCase();
  const filteredAgents = agents.filter((agent) => {
    const matchesFilter = filter === 'all' || agent.status === filter;
    const matchesSearch =
      query === '' ||
      agent.name.toLowerCase().includes(query) ||
      agent.subtitle.toLowerCase().includes(query) ||
      agent.sipEndpoint.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const activeCount = agents.filter((a) => a.status === 'active').length;
  const standbyCount = agents.filter((a) => a.status === 'standby').length;
  const sampleCount = agents.filter((a) => a.source !== 'live').length;

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: `All (${agents.length})` },
    { id: 'active', label: `Active (${activeCount})` },
    { id: 'standby', label: `Standby (${standbyCount})` },
  ];

  return (
    <div className="table-section">
      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by agent, role, or hotline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search agents"
          />
        </div>
        <div className="table-filters" role="group" aria-label="Filter agents by status">
          {filters.map((f) => (
            <button
              key={f.id}
              className={`table-filter-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <table className="agents-table">
        <thead>
          <tr>
            <th scope="col">Agent &amp; Role</th>
            <th scope="col">Hotline / Endpoint</th>
            <th scope="col">Voice Pipeline</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAgents.length === 0 && (
            <tr>
              <td colSpan={5} className="cc-empty-cell">
                No agents match your search.
              </td>
            </tr>
          )}
          {filteredAgents.map((agent) => {
            const isLive = agent.source === 'live';
            return (
              <tr key={agent.id} className={isLive ? 'cc-row-live' : undefined}>
                <td>
                  <div className="agent-info">
                    <span className="agent-name">
                      {agent.name}
                      <span className={`cc-tag ${isLive ? 'is-live' : 'is-sample'}`}>
                        {isLive ? 'Live' : 'Sample'}
                      </span>
                    </span>
                    <span className="agent-sub">{agent.subtitle}</span>
                  </div>
                </td>
                <td>
                  <span className="sip-endpoint" title={agent.sipEndpoint}>
                    {agent.sipEndpoint}
                  </span>
                </td>
                <td>
                  <span className="voice-pipeline">
                    {agent.voicePipeline.stt}
                    <span className="separator">→</span>
                    {agent.voicePipeline.tts}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${agent.status}`}>
                    <span className="dot" />
                    {agent.status === 'active' ? 'Active' : 'Standby'}
                    {agent.channels ? <span className="channel-count">{agent.channels} Ch</span> : null}
                  </span>
                </td>
                <td>
                  <div className="actions-cell">
                    <a
                      href={LIVE_ASSISTANT_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-test-voice"
                    >
                      Test Voice
                    </a>
                    <button className="btn-more" title="More actions" aria-label={`More actions for ${agent.name}`}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="table-footer">
        <span>
          Showing {filteredAgents.length} of {agents.length} agents
          {sampleCount > 0 ? ` · ${sampleCount} sample` : ''}
        </span>
        <span className="gateway-info">Live rows sync from the Engineer Console</span>
      </div>
    </div>
  );
}
