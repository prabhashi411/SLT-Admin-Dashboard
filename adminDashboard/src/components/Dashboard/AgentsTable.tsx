import { useState } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import type { Agent } from '../../data/mockData';

interface AgentsTableProps {
  agents: Agent[];
}

type FilterType = 'all' | 'active' | 'standby';

export default function AgentsTable({ agents }: AgentsTableProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = agents.filter((agent) => {
    const matchesFilter = filter === 'all' || agent.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.sipEndpoint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeCount = agents.filter((a) => a.status === 'active').length;
  const standbyCount = agents.filter((a) => a.status === 'standby').length;

  return (
    <div className="table-section">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search agents by name or SIP endpoint..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="table-filters">
          <button
            className={`table-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({agents.length})
          </button>
          <button
            className={`table-filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            className={`table-filter-btn ${filter === 'standby' ? 'active' : ''}`}
            onClick={() => setFilter('standby')}
          >
            Standby ({standbyCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <table className="agents-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th>SIP Endpoint</th>
            <th>Voice Pipeline</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAgents.map((agent) => (
            <tr key={agent.id}>
              <td>
                <div className="agent-info">
                  <span className="agent-name">{agent.name}</span>
                  <span className="agent-sub">{agent.subtitle}</span>
                </div>
              </td>
              <td>
                <span className="sip-endpoint">{agent.sipEndpoint}</span>
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
                  {agent.channels && (
                    <span className="channel-count">
                      {agent.channels} Ch
                    </span>
                  )}
                </span>
              </td>
              <td>
                <div className="actions-cell">
                  <button className="btn-test-voice">Test Voice</button>
                  <button className="btn-more">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="table-footer">
        <span>Showing {filteredAgents.length} registered voice agents</span>
        <span className="gateway-info">Gateway: LK-COLOMBO-PRI</span>
      </div>
    </div>
  );
}
