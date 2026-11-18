import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type {
  Agent,
  AgentListResponse,
  CreateAgentRequest,
  DraftTestRequest,
  TestResult,
  McpClient,
  CreateMcpClientRequest,
  CreateMcpClientResponse,
  AuditEntry,
  HubStatus,
  RatingsSummary,
  ConversationSessionItem,
  ConversationDetail,
  HealthResponse,
  VoiceTierResponse,
  AdminUser,
  RoutingRuleItem,
  SuperAdminOverview,
  TenantSummary,
  CreateTenantRequest,
  TenantAdminSummary,
  GlobalProvidersStatus,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE || '/admin/api';
const SCOPED_TENANT_KEY = 'slt_scoped_tenant_id';

class ApiClient {
  private client: AxiosInstance;
  private scopedTenantId: number | null = null;

  constructor() {
    try {
      const saved = typeof window !== 'undefined' ? sessionStorage.getItem(SCOPED_TENANT_KEY) : null;
      if (saved && /^\d+$/.test(saved)) this.scopedTenantId = Number(saved);
    } catch {
      this.scopedTenantId = null;
    }

    this.client = axios.create({
      baseURL: API_BASE,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.scopedTenantId !== null) {
          config.headers.set('X-Tenant-Id', String(this.scopedTenantId));
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          }
        }
        return Promise.reject(error);
      }
    );
  }

  getScopedTenantId(): number | null {
    return this.scopedTenantId;
  }

  setScopedTenantId(id: number | null): void {
    this.scopedTenantId = id;
    try {
      if (typeof window !== 'undefined') {
        if (id === null) sessionStorage.removeItem(SCOPED_TENANT_KEY);
        else sessionStorage.setItem(SCOPED_TENANT_KEY, String(id));
      }
    } catch {
      // ignore storage errors
    }
  }

  private tenantHeaders(): Record<string, string> {
    return this.scopedTenantId !== null ? { 'X-Tenant-Id': String(this.scopedTenantId) } : {};
  }

  // Admin Auth
  async login(username: string, password: string): Promise<AdminUser> {
    const { data } = await axios.post<AdminUser>(
      '/auth/admin/login',
      { username, password },
      { withCredentials: true }
    );
    return data;
  }

  async logout(): Promise<void> {
    await axios.post('/auth/admin/logout', {}, { withCredentials: true });
  }

  async getMe(): Promise<AdminUser | null> {
    try {
      const { data } = await axios.get<AdminUser>('/auth/admin/me', { withCredentials: true });
      return data;
    } catch {
      return null;
    }
  }

  // External Chat Agents
  async getAgents(): Promise<AgentListResponse> {
    const { data } = await this.client.get<AgentListResponse>('/agents');
    return data;
  }

  async getAgent(id: number): Promise<Agent> {
    const { data } = await this.client.get<Agent>(`/agents/${id}`);
    return data;
  }

  async createAgent(agent: CreateAgentRequest): Promise<Agent> {
    const { data } = await this.client.post<Agent>('/agents', agent);
    return data;
  }

  async updateAgent(id: number, agent: Partial<CreateAgentRequest>): Promise<Agent> {
    const { data } = await this.client.put<Agent>(`/agents/${id}`, agent);
    return data;
  }

  async deleteAgent(id: number): Promise<void> {
    await this.client.delete(`/agents/${id}`);
  }

  async activateAgent(id: number): Promise<Agent> {
    const { data } = await this.client.post<Agent>(`/agents/${id}/activate`);
    return data;
  }

  async deactivateAgent(): Promise<void> {
    await this.client.post('/agents/deactivate');
  }

  async testAgent(draft: DraftTestRequest): Promise<TestResult> {
    const { data } = await this.client.post<TestResult>('/agents/test', draft);
    return data;
  }

  // MCP Machine Clients
  async getMcpClients(): Promise<McpClient[]> {
    const { data } = await this.client.get<McpClient[]>('/mcp-clients');
    return data;
  }

  async createMcpClient(client: CreateMcpClientRequest): Promise<CreateMcpClientResponse> {
    const { data } = await this.client.post<CreateMcpClientResponse>('/mcp-clients', client);
    return data;
  }

  async revokeMcpClient(id: number): Promise<void> {
    await this.client.delete(`/mcp-clients/${id}`);
  }

  // Security Audit Log
  async getAuditLog(limit = 100): Promise<AuditEntry[]> {
    const { data } = await this.client.get<AuditEntry[]>(`/audit?limit=${limit}`);
    return data;
  }

  // Gateway & Central Hub Status
  async getHubStatus(): Promise<HubStatus> {
    try {
      const { data } = await this.client.get<HubStatus>('/hub');
      return data;
    } catch {
      const health = await this.getHealth().catch(() => null);
      const gw = health?.answers?.gateway;
      const ta = health?.answers?.tool_agent;
      return {
        gateway: {
          sessions: gw?.sessions ?? 0,
          open_connections: gw?.sessions ?? 0,
          last_error: gw?.last_error ?? null,
        },
        tool_latency_classes: null,
        tool_agent: {
          turns: ta?.turns ?? 0,
          avg_tool_ms: ta?.avg_tool_ms ?? 0,
          sessions: gw?.sessions ?? 0,
        },
        recent_calls: [],
      };
    }
  }

  // Ratings
  async getRatings(days = 30): Promise<RatingsSummary> {
    const { data } = await this.client.get<RatingsSummary>(`/ratings?days=${days}`);
    return data;
  }

  // Conversations (Root level endpoint /conversations)
  async getConversations(limit = 50): Promise<ConversationSessionItem[]> {
    const { data } = await axios.get<{ conversations: ConversationSessionItem[] }>('/conversations', {
      params: { limit },
      headers: this.tenantHeaders(),
      withCredentials: true,
    });
    return data.conversations || [];
  }

  async getConversation(id: string): Promise<ConversationDetail> {
    const { data } = await axios.get<ConversationDetail>(`/conversations/${id}`, {
      headers: this.tenantHeaders(),
      withCredentials: true,
    });
    return data;
  }

  // Public Telemetry & Health
  async getHealth(): Promise<HealthResponse> {
    const { data } = await axios.get<HealthResponse>('/health', {
      headers: this.tenantHeaders(),
      withCredentials: true,
    });
    return data;
  }

  async getVoiceTier(): Promise<VoiceTierResponse> {
    const { data } = await axios.get<VoiceTierResponse>('/api/voice/tier', {
      headers: this.tenantHeaders(),
      withCredentials: true,
    });
    return data;
  }

  // Scoped Routing Rules
  async getRoutingRules(): Promise<RoutingRuleItem[]> {
    const { data } = await this.client.get<{ rules: RoutingRuleItem[] }>('/routing-rules');
    return data.rules || [];
  }

  async createRoutingRule(rule: Partial<RoutingRuleItem>): Promise<RoutingRuleItem> {
    const { data } = await this.client.post<RoutingRuleItem>('/routing-rules', rule);
    return data;
  }

  async toggleRoutingRule(id: number, status: boolean): Promise<RoutingRuleItem> {
    const { data } = await this.client.post<RoutingRuleItem>(`/routing-rules/${id}/enabled`, { status });
    return data;
  }

  async deleteRoutingRule(id: number): Promise<void> {
    await this.client.delete(`/routing-rules/${id}`);
  }

  // Super Admin Portal (/super-admin/api)
  async getSuperOverview(): Promise<SuperAdminOverview> {
    const { data } = await axios.get<SuperAdminOverview>('/super-admin/api/overview', { withCredentials: true });
    return data;
  }

  async getTenants(): Promise<TenantSummary[]> {
    const { data } = await axios.get<{ tenants: TenantSummary[] }>('/super-admin/api/tenants', { withCredentials: true });
    return data.tenants || [];
  }

  async createTenant(body: CreateTenantRequest): Promise<TenantSummary> {
    const { data } = await axios.post<TenantSummary>('/super-admin/api/tenants', body, { withCredentials: true });
    return data;
  }

  async updateTenant(id: number, body: Partial<CreateTenantRequest>): Promise<TenantSummary> {
    const { data } = await axios.put<TenantSummary>(`/super-admin/api/tenants/${id}`, body, { withCredentials: true });
    return data;
  }

  async deleteTenant(id: number): Promise<void> {
    await axios.delete(`/super-admin/api/tenants/${id}`, { withCredentials: true });
  }

  async getTenantAdmins(tenantId: number): Promise<TenantAdminSummary[]> {
    const { data } = await axios.get<{ admins: TenantAdminSummary[] }>(`/super-admin/api/tenants/${tenantId}/admins`, { withCredentials: true });
    return data.admins || [];
  }

  async createTenantAdmin(tenantId: number, body: { username: string; password: string; role?: string }): Promise<TenantAdminSummary> {
    const { data } = await axios.post<TenantAdminSummary>(`/super-admin/api/tenants/${tenantId}/admins`, body, { withCredentials: true });
    return data;
  }

  async getGlobalProviders(): Promise<GlobalProvidersStatus> {
    const { data } = await axios.get<GlobalProvidersStatus>('/super-admin/api/providers', { withCredentials: true });
    return data;
  }

  async updateGlobalProviders(body: {
    stt_strategy?: string;
    tts_strategy?: string;
    max_concurrent_cloud_stt?: number;
    max_concurrent_cloud_tts?: number;
    max_local_cpu_stt?: number;
  }): Promise<GlobalProvidersStatus> {
    const { data } = await axios.put<GlobalProvidersStatus>('/super-admin/api/providers', body, { withCredentials: true });
    return data;
  }
}

export const api = new ApiClient();
