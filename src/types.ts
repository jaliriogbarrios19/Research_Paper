export interface AcademicWork {
  doi: string;
  title: string;
  authors: { name: string }[];
  year: number;
  journal: string;
  abstract_text: string;
  relevance_score: number;
  url: string;
  mesh_terms: string[];
  reason: string;
}

export interface SearchOptions {
  query: string;
  high_precision: boolean;
  domain: string;
}

export type ResearchDomain =
  | "psychology"
  | "medicine"
  | "nursing"
  | "biology"
  | "education"
  | "sociology"
  | "economics"
  | "law"
  | "engineering"
  | "general";

export interface CitationResult {
  inText: string;
  reference: string;
}

export interface ResearchResponse {
  synthesis: string;
  sources: AcademicWork[];
  validated: boolean;
}

export interface QueryVariants {
  variants: string[];
  detectedDomain: string;
}

export interface SemanticScore {
  index: number;
  score: number;
  reason: string;
}

export interface SearchIteration {
  iteration: number;
  query: string;
  results: AcademicWork[];
  coverage: boolean;
  gaps?: string;
  refinedQuery?: string;
}

export type LLMProvider =
  | "openai"
  | "anthropic"
  | "deepseek"
  | "gemini"
  | "openrouter"
  | "grok"
  | "glm"
  | "spob";

export interface LLMModel {
  modelId: string;
  label: string;
  description: string;
}

export const LLM_PROVIDERS: { value: LLMProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "gemini", label: "Google Gemini" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "grok", label: "Grok (xAI)" },
  { value: "glm", label: "GLM (Z.ai)" },
  { value: "spob", label: "Smart Plugins Obsidian (DeepSeek)" },
];

export const LLM_MODELS: Record<LLMProvider, LLMModel[]> = {
  openai: [
    { modelId: "gpt-5.5", label: "GPT-5.5", description: "Flagship. 1M ctx. Complex reasoning." },
    { modelId: "gpt-5.4", label: "GPT-5.4", description: "Professional work. 1M ctx." },
    { modelId: "gpt-5.4-mini", label: "GPT-5.4 Mini", description: "Fast, cost-efficient. 400k ctx." },
    { modelId: "gpt-5.4-nano", label: "GPT-5.4 Nano", description: "Ultra-low-cost. Simple tasks." },
    { modelId: "gpt-5.2", label: "GPT-5.2", description: "Previous frontier. 400k ctx." },
  ],
  anthropic: [
    { modelId: "claude-opus-4-7", label: "Claude Opus 4.7", description: "Most capable. 1M ctx, 128k out." },
    { modelId: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", description: "Speed/intelligence balance. 1M ctx." },
    { modelId: "claude-haiku-4-5", label: "Claude Haiku 4.5", description: "Fast, near-frontier. 200k ctx." },
  ],
  deepseek: [
    { modelId: "deepseek-v4-pro", label: "DeepSeek V4 Pro", description: "Top-tier. 1M ctx. Thinking mode." },
    { modelId: "deepseek-v4-flash", label: "DeepSeek V4 Flash", description: "Fast, cost-efficient. 1M ctx." },
  ],
  gemini: [
    { modelId: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Flagship. Complex reasoning. 1M+ ctx." },
    { modelId: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Fast variant for high-volume." },
    { modelId: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", description: "Most affordable tier." },
  ],
  openrouter: [
    { modelId: "openai/gpt-5.5", label: "OpenAI GPT-5.5", description: "Via OpenRouter" },
    { modelId: "anthropic/claude-opus-4-7", label: "Claude Opus 4.7", description: "Via OpenRouter" },
    { modelId: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6", description: "Via OpenRouter" },
    { modelId: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro", description: "Via OpenRouter" },
    { modelId: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Via OpenRouter" },
  ],
  grok: [
    { modelId: "grok-4.3", label: "Grok 4.3", description: "Flagship. 1M ctx. Low hallucination." },
    { modelId: "grok-4.20-0309-reasoning", label: "Grok 4.20 Reasoning", description: "Reasoning mode enabled." },
    { modelId: "grok-4.20-0309-non-reasoning", label: "Grok 4.20 Non-Reasoning", description: "Faster, reasoning off." },
    { modelId: "grok-build-0.1", label: "Grok Build 0.1", description: "Optimized for code/build." },
  ],
  glm: [
    { modelId: "glm-4-plus", label: "GLM-4 Plus", description: "Top-tier. 128k ctx." },
    { modelId: "glm-4", label: "GLM-4", description: "Balanced performance/cost." },
    { modelId: "glm-4-flash", label: "GLM-4 Flash", description: "Fast, low-cost." },
    { modelId: "glm-4-air", label: "GLM-4 Air", description: "Ultra-lightweight." },
  ],
  spob: [
    { modelId: "deepseek-v4-pro", label: "DeepSeek V4 Pro (spob)", description: "Top-tier. 1M ctx. Vía spob." },
    { modelId: "deepseek-v4-flash", label: "DeepSeek V4 Flash (spob)", description: "Fast, cost-efficient. Vía spob." },
  ],
};
