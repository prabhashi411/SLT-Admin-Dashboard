import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '../api/client';
import type {
  Agent,
  CreateAgentRequest,
  DraftTestRequest,
  McpClient,
  CreateMcpClientRequest,
  AuditEntry,
  HubStatus,
  RatingsSummary,
  ConversationSessionItem,
  ConversationDetail,
  HealthResponse,
  VoiceTierResponse,
} from '../types/api';

// Query Keys
export const queryKeys = {
  agents: ['agents'] as const,
  agent: (id: number) => ['agents', id] as const,
  mcpClients: ['mcp-clients'] as const,
  auditLog: (limit: number) => ['audit', limit] as const,
  hubStatus: ['hub-status'] as const,
  ratings: (days: number) => ['ratings', days] as const,
  conversations: (limit?: number) => ['conversations', limit] as const,
  conversation: (id: string) => ['conversations', id] as const,
  health: ['health'] as const,
  voiceTier: ['voice-tier'] as const,
};

// Agents
export function useAgents(options?: UseQueryOptions<Agent[]>) {
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: async () => {
      const res = await api.getAgents();
      return res.agents;
    },
    refetchInterval: 30000,
    ...options,
  });
}

export function useAgent(id: number, options?: UseQueryOptions<Agent>) {
  return useQuery({
    queryKey: queryKeys.agent(id),
    queryFn: () => api.getAgent(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agent: CreateAgentRequest) => api.createAgent(agent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agent }: { id: number; agent: Partial<CreateAgentRequest> }) => api.updateAgent(id, agent),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      queryClient.invalidateQueries({ queryKey: queryKeys.agent(id) });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

export function useActivateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.activateAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

export function useTestAgent() {
  return useMutation({
    mutationFn: (draft: DraftTestRequest) => api.testAgent(draft),
  });
}

// MCP Clients
export function useMcpClients(options?: UseQueryOptions<McpClient[]>) {
  return useQuery({
    queryKey: queryKeys.mcpClients,
    queryFn: () => api.getMcpClients(),
    refetchInterval: 60000,
    ...options,
  });
}

export function useCreateMcpClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (client: CreateMcpClientRequest) => api.createMcpClient(client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mcpClients });
    },
  });
}

export function useRevokeMcpClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.revokeMcpClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mcpClients });
    },
  });
}

// Audit Log
export function useAuditLog(limit = 100, options?: UseQueryOptions<AuditEntry[]>) {
  return useQuery({
    queryKey: queryKeys.auditLog(limit),
    queryFn: () => api.getAuditLog(limit),
    refetchInterval: 30000,
    ...options,
  });
}

// Hub Status
export function useHubStatus(options?: UseQueryOptions<HubStatus>) {
  return useQuery({
    queryKey: queryKeys.hubStatus,
    queryFn: () => api.getHubStatus(),
    refetchInterval: 10000,
    ...options,
  });
}

// Ratings
export function useRatings(days = 30, options?: UseQueryOptions<RatingsSummary>) {
  return useQuery({
    queryKey: queryKeys.ratings(days),
    queryFn: () => api.getRatings(days),
    refetchInterval: 60000,
    ...options,
  });
}

// Conversations
export function useConversations(limit = 50, options?: UseQueryOptions<ConversationSessionItem[]>) {
  return useQuery({
    queryKey: ['conversations', limit],
    queryFn: () => api.getConversations(limit),
    refetchInterval: 30000,
    ...options,
  });
}

export function useConversation(id: string, options?: UseQueryOptions<ConversationDetail>) {
  return useQuery({
    queryKey: queryKeys.conversation(id),
    queryFn: () => api.getConversation(id),
    enabled: !!id,
    ...options,
  });
}

// Health & Voice Tier
export function useHealth(options?: UseQueryOptions<HealthResponse>) {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.getHealth(),
    refetchInterval: 8000,
    ...options,
  });
}

export function useVoiceTier(options?: UseQueryOptions<VoiceTierResponse>) {
  return useQuery({
    queryKey: queryKeys.voiceTier,
    queryFn: () => api.getVoiceTier(),
    refetchInterval: 8000,
    ...options,
  });
}