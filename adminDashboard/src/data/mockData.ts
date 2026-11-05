export interface Agent {
  id: string;
  name: string;
  subtitle: string;
  sipEndpoint: string;
  voicePipeline: {
    stt: string;
    tts: string;
  };
  status: 'active' | 'standby';
  channels?: number;
  // 'live' rows come from the backend; everything else is sample data.
  source?: 'live' | 'sample';
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

export const statsData: StatCard[] = [
  {
    id: 'total-agents',
    label: 'Total Agents',
    value: '3',
    suffix: 'of 8 assigned',
    sub: '2 active, 1 standby',
  },
  {
    id: 'active-streams',
    label: 'Active Streams',
    value: '131',
    trend: { value: '+14%', direction: 'up' },
    sub: 'SIP trunk channels',
  },
  {
    id: 'avg-latency',
    label: 'Avg Latency',
    value: '218',
    suffix: 'ms',
    sub: 'Speech synthesis roundtrip',
  },
  {
    id: 'pipeline-uptime',
    label: 'Pipeline Uptime',
    value: '99.98%',
    sub: '30-day edge nominal',
  },
];

export const agentsData: Agent[] = [
  {
    id: 'agent-1',
    name: 'Broadband Support Bot',
    subtitle: 'Fiber & LTE Customer Care',
    sipEndpoint: 'sip:inbound-bb@voice.slt.lk',
    voicePipeline: {
      stt: 'Whisper v3',
      tts: 'ElevenLabs (Sinhala/Eng)',
    },
    status: 'active',
    channels: 84,
  },
  {
    id: 'agent-2',
    name: 'Billing & Payment Assistant',
    subtitle: 'Finance & Top-up Gateway',
    sipEndpoint: 'sip:ivr-pay@voice.slt.lk',
    voicePipeline: {
      stt: 'Azure Neural',
      tts: 'Google Cloud TTS',
    },
    status: 'active',
    channels: 47,
  },
  {
    id: 'agent-3',
    name: 'Fault Reporting Bot',
    subtitle: 'Outside Plant Diagnostics',
    sipEndpoint: 'sip:fault-desk@voice.slt.lk',
    voicePipeline: {
      stt: 'Vosk Offline L1',
      tts: 'Coqui FastSpeech',
    },
    status: 'standby',
  },
];
