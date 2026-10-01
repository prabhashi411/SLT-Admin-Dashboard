import { Plus } from 'lucide-react';
import StatsCards from '../components/Dashboard/StatsCards';
import AgentsTable from '../components/Dashboard/AgentsTable';
import { statsData, agentsData } from '../data/mockData';

export default function Dashboard() {
  return (
    <>
      {/* Page Tag */}
      <div className="page-header-tag">
        CORE AUDIO INGRESS
        <span className="live-dot" />
        <span className="live-text">Live Synchronized</span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Registered Chat Agents</h1>
          <p>Manage voice pipelines and telephony hooks for enterprise chat agents</p>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Register Agent
        </button>
      </div>

      {/* Stats */}
      <StatsCards stats={statsData} />

      {/* Agents Table */}
      <AgentsTable agents={agentsData} />
    </>
  );
}
