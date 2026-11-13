// Live status read from the voice backend (:8000) through the Vite proxy.
// Only GET /health and GET /api/voice/tier are used; both need no sign in
// and return no secrets.

export interface LiveHealthSummary {
  online: boolean;
  checkedAt: number | null;
  activeBrainName: string;
  isExternalActive: boolean;
  voiceTier: string;
  cloudModel: string;
  avatarRenderer: string;
  languages: string[];
  hubSessions: number;
  hubTurns: number;
  hubAvgToolMs: number;
  voiceRouter?: {
    active: string;
    tiers: Record<string, { state: string; last_error: string | null; retry_in?: number }>;
  };
  llmChain?: {
    order: string[];
    last_mode: string;
    tiers: Record<string, { label: string; state: string; last_error: string | null; retry_in?: number }>;
  };
  mcpHub?: {
    configured: boolean;
    reachable: boolean;
    breaker_open: boolean;
    breaker_seconds_left: number;
    transport: string;
    auth: string;
    warmPoolSize: number;
  };
  speechEngine?: {
    engine: string;
    last_error: string | null;
  };
}

export const BUILT_IN_BRAIN = 'Built-in SLT Assistant';

export const ENGINEER_CONSOLE_URL = 'http://127.0.0.1:8000/admin/';
export const LIVE_ASSISTANT_URL = 'http://127.0.0.1:8000/';

export const initialHealth: LiveHealthSummary = {
  online: false,
  checkedAt: null,
  activeBrainName: BUILT_IN_BRAIN,
  isExternalActive: false,
  voiceTier: 'local',
  cloudModel: '',
  avatarRenderer: 'talkinghead',
  languages: [],
  hubSessions: 0,
  hubTurns: 0,
  hubAvgToolMs: 0,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toLiveHealth(health: any, tier: any): LiveHealthSummary {
  const external = health?.external_agent;
  const answers = health?.answers ?? {};
  const gateway = answers.gateway ?? {};
  const toolAgent = answers.tool_agent ?? {};
  const warmConns = answers.warm_connections ?? {};
  const mcpHub = health?.mcp_hub;
  const langs = health?.supported_languages;
  const languages = Array.isArray(langs)
    ? langs.map(String)
    : langs && typeof langs === 'object'
    ? Object.values(langs).map(String)
    : [];

  return {
    online: true,
    checkedAt: Date.now(),
    activeBrainName: external?.name ? String(external.name) : BUILT_IN_BRAIN,
    isExternalActive: Boolean(external?.name),
    voiceTier: tier?.tier ? String(tier.tier) : 'local',
    cloudModel: health?.cloud_llm_model ? String(health.cloud_llm_model) : '',
    avatarRenderer: health?.avatar_renderer ? String(health.avatar_renderer) : 'talkinghead',
    languages,
    hubSessions: Number(gateway.sessions || 0),
    hubTurns: Number(toolAgent.turns || 0),
    hubAvgToolMs: Number(toolAgent.avg_tool_ms || 0),
    voiceRouter: health?.voice_router ? {
      active: String(health.voice_router.active || 'local'),
      tiers: health.voice_router.tiers || {},
    } : undefined,
    llmChain: health?.llm_chain ? {
      order: Array.isArray(health.llm_chain.order) ? health.llm_chain.order : [],
      last_mode: String(health.llm_chain.last_mode || 'unknown'),
      tiers: health.llm_chain.tiers || {},
    } : undefined,
    mcpHub: mcpHub ? {
      configured: Boolean(mcpHub.configured),
      reachable: Boolean(mcpHub.reachable),
      breaker_open: Boolean(mcpHub.breaker_open),
      breaker_seconds_left: Number(mcpHub.breaker_seconds_left || 0),
      transport: String(mcpHub.transport || 'sse'),
      auth: String(mcpHub.auth || 'none'),
      warmPoolSize: Number(warmConns.size || 0),
    } : undefined,
    speechEngine: health?.speech_engine ? {
      engine: String(health.speech_engine.engine || 'unknown'),
      last_error: health.speech_engine.last_error ? String(health.speech_engine.last_error) : null,
    } : undefined,
  };
}
