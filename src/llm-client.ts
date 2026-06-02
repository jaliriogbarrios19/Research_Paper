import { LLMProvider } from "./types";
import { getSpobBaseUrl } from "./settings";

export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-5.5",
  anthropic: "claude-opus-4-7",
  deepseek: "deepseek-v4-pro",
  gemini: "gemini-2.5-pro",
  openrouter: "openai/gpt-5.5",
  grok: "grok-4.3",
  glm: "glm-4-plus",
  spob: "deepseek-v4-pro",
};

export async function callLLM(
  provider: LLMProvider,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  switch (provider) {
    case "anthropic":
      return callAnthropic(apiKey, model, prompt);
    case "gemini":
      return callGemini(apiKey, model, prompt);
    default:
      return callOpenAICompat(provider, apiKey, model, prompt);
  }
}

async function callOpenAICompat(
  provider: LLMProvider,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const baseUrls: Record<string, string> = {
    openai: "https://api.openai.com",
    deepseek: "https://api.deepseek.com",
    openrouter: "https://openrouter.ai/api",
    grok: "https://api.x.ai",
    glm: "https://api.z.ai",
    spob: getSpobBaseUrl(),
  };

  const baseUrl = baseUrls[provider];

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`${provider} HTTP ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Anthropic HTTP ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
