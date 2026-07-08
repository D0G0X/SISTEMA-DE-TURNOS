// Cliente de IA: OpenAI por defecto. xAI solo si AI_PROVIDER=xai explícitamente.
import { env } from 'node:process';

const DEFAULT_PROVIDER = 'openai';

const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    keyEnv: 'OPENAI_API_KEY',
    modelEnv: 'OPENAI_MODEL',
    defaultModel: 'gpt-4o-mini',
    label: 'OpenAI',
  },
  xai: {
    url: 'https://api.x.ai/v1/chat/completions',
    keyEnv: 'XAI_API_KEY',
    modelEnv: 'GROK_MODEL',
    defaultModel: 'grok-4.3',
    label: 'xAI Grok',
  },
};

function resolveProvider() {
  const requested = (env.AI_PROVIDER || DEFAULT_PROVIDER).toLowerCase().trim();
  const id = requested === 'xai' ? 'xai' : 'openai';
  const cfg = PROVIDERS[id];
  if (env[cfg.keyEnv]) return { id, ...cfg };
  return null;
}

export function isAiEnabled() {
  return resolveProvider() !== null;
}

export function getAiInfo() {
  const p = resolveProvider();
  if (!p) {
    return {
      enabled: false,
      provider: DEFAULT_PROVIDER,
      model: env.OPENAI_MODEL || PROVIDERS.openai.defaultModel,
      label: PROVIDERS.openai.label,
    };
  }
  return {
    enabled: true,
    provider: p.id,
    model: env[p.modelEnv] || p.defaultModel,
    label: p.label,
  };
}

export async function chatCompletion({ messages, max_tokens = 256, tools, tool_choice }) {
  const p = resolveProvider();
  if (!p) return null;

  const body = {
    model: env[p.modelEnv] || p.defaultModel,
    messages,
    max_tokens,
  };
  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = tool_choice ?? 'auto';
  }

  const res = await fetch(p.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env[p.keyEnv]}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${p.label} API ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message ?? null;
}

export async function chatText({ messages, max_tokens = 256 }) {
  const msg = await chatCompletion({ messages, max_tokens });
  return msg?.content?.trim() || null;
}
