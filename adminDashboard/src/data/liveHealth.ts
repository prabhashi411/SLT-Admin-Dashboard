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
  };
}
