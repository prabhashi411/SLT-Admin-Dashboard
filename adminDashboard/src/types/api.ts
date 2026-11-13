// API Response & Request Types

export interface Agent {
  id: number;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  auth_header_name: string | null;
  has_auth_header: boolean;
  body_template: string;
  response_path: string;
  timeout_seconds: number;
  streaming: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  last_status: string | null;
  last_latency_ms: number | null;
  last_error: string | null;
}

export interface AgentListResponse {
  agents: Agent[];
  active_agent_id: number | null;
}

export interface CreateAgentRequest {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  auth_header_name?: string | null;
  auth_header_value?: string | null;
  clear_auth_header?: boolean;
  body_template?: string;
  response_path?: string;
  timeout_seconds?: number | null;
  streaming?: boolean;
}

export interface DraftTestRequest extends CreateAgentRequest {
  id?: number;
  message?: string | null;
  language?: string;
}

export interface TestResult {
  ok: boolean;
  reply: string | null;
  latency_ms: number | null;
  error: string | null;
  raw_preview: string | null;
  suggested_path: string | null;
}

export interface McpClient {
  id: number;
  client_id: string;
  name: string;
  scopes: string[];
  created_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
  active: boolean;
}

export interface CreateMcpClientRequest {
  name: string;
  scopes: string[];
}

export interface CreateMcpClientResponse {
  client: McpClient;
  client_secret: string;
}

export interface AuditEntry {
  id: number;
  created_at: string;
  actor_type: string;
  actor_id: string;
  client_name: string | null;
  action: string;
  outcome: string;
  detail: string | null;
  duration_ms: number | null;
}

export interface HubStatus {
  gateway: {
    sessions: number;
    open_connections?: number;
    last_error: string | null;
  };
  tool_latency_classes: Array<{ tool: string; latency_class: string; avg_ms: number }> | null;
  tool_agent: {
    turns: number;
    avg_tool_ms: number;
    sessions: number;
  };
  recent_calls: Array<{ tool: string; outcome: string; duration_ms: number; timestamp: string }>;
}

export interface RatingsSummary {
  days: number;
  count: number;
  average: number | null;
  distribution: Record<string, number>;
  by_channel: {
    chat: { count: number; average: number | null };
    voice: { count: number; average: number | null };
  };
  verified_count: number;
  recent: Array<{ rating: number; channel: string; timestamp: string; verified: boolean }>;
}

export interface ConversationSessionItem {
  id: string;
  channel: 'voice' | 'chat';
  language: string;
  provider: string;
  model: string | null;
  avatar: string | null;
  started_at: string | null;
  ended_at: string | null;
  recording_consent: boolean;
}

export interface ConversationMessageItem {
  role: 'user' | 'assistant';
  text: string;
  at: string;
}

export interface ConversationDetail extends ConversationSessionItem {
  messages: ConversationMessageItem[];
  summary: {
    status: string;
    text: string | null;
    provider: string | null;
  } | null;
  recordings: Array<{
    role: 'user' | 'assistant';
    duration_ms: number;
    sample_rate: number;
  }>;
}

// Backward compatibility types for legacy components
export type Conversation = ConversationDetail;
export interface ConversationListParams {
  page?: number;
  page_size?: number;
  channel?: 'voice' | 'chat';
  language?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}
export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  cloud_llm_configured: boolean;
  cloud_llm_provider: string;
  cloud_llm_model: string;
  external_agent?: { id: number; name: string; usable: boolean } | null;
  answers?: {
    source: string;
    gateway?: { sessions: number; pending_logins: number; last_error: string | null; matrix_loaded: boolean };
    warm_connections?: { size: number; open: number; opened: number; dropped: number };
    tool_agent?: { turns: number; avg_tool_ms: number; p95_tool_ms: number; by_tool: Record<string, number> };
  };
  speech_engine?: { engine: string; last_error: string | null };
  supported_languages: Record<string, string>;
  voice_router?: {
    order: string[];
    active: string;
    tiers: Record<string, { state: string; last_error: string | null }>;
  };
  mcp_hub?: {
    configured: boolean;
    enabled: boolean;
    transport: string;
    reachable: boolean;
    breaker_open: boolean;
    breaker_seconds_left: number;
  };
}

export interface VoiceTierResponse {
  tier: 'gemini_live' | 'local';
  model: string | null;
}

export interface AdminUser {
  username: string;
  expires_at?: number;
}

export interface StatCard {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  sub: string;
}
