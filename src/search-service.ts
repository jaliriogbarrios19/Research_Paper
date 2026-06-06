import { AcademicWork, QueryVariants, SemanticScore, SearchIteration } from "./types";
import { fetchPubMed } from "./pubmed-api";
import { fetchOpenAlex } from "./openalex-api";
import { callLLM, DEFAULT_MODELS } from "./llm-client";

export async function searchAcademic(
  query: string,
  highPrecision: boolean,
  pubmedApiKey: string,
  crossrefEmail: string,
  domain: string = "general",
  yearRange: number = 0
): Promise<AcademicWork[]> {
  const email = crossrefEmail || "hola@neuroscribe.app";
  const meshQuery = highPrecision ? `${query}[MeSH Terms]` : query;

  const usePubMed = ["psychology", "medicine", "nursing", "biology"].includes(domain);

  const [pubmed, openalex] = await Promise.allSettled([
    usePubMed ? fetchPubMed(meshQuery, pubmedApiKey) : Promise.resolve([] as AcademicWork[]),
    fetchOpenAlex(query, email),
  ]);

  const combined: AcademicWork[] = [];
  if (pubmed.status === "fulfilled") combined.push(...pubmed.value);
  if (openalex.status === "fulfilled") combined.push(...openalex.value);

  const seen = new Map<string, AcademicWork>();
  for (const work of combined) {
    const key = work.doi
      ? work.doi.replace("https://doi.org/", "").toLowerCase()
      : work.title.toLowerCase();
    if (!seen.has(key)) seen.set(key, work);
  }

  const result = Array.from(seen.values());
  result.sort((a, b) => b.relevance_score - a.relevance_score);

  const relevant = result.filter((w) => w.relevance_score >= 0.5);

  if (yearRange > 0) {
    const minYear = new Date().getFullYear() - yearRange;
    const filtered = relevant.filter((w) => w.year >= minYear);
    return filtered.slice(0, 10);
  }

  return relevant.slice(0, 10);
}

export async function optimizeQuery(
  provider: import("./types").LLMProvider,
  apiKey: string,
  model: string | undefined,
  naturalQuery: string
): Promise<QueryVariants> {
  const effectiveModel = model || DEFAULT_MODELS[provider];

  const prompt = `You are a research query optimizer for academic databases (PubMed, OpenAlex). Convert this natural language question into MULTIPLE optimized English keyword search variants. Generate exactly 5 variants following this structure:

1. **primary**: core keywords, clean and direct
2. **synonyms**: same concept with synonyms and alternate phrasings
3. **mesh**: MeSH-style controlled vocabulary terms (when applicable — use "[MeSH]" suffix per term)
4. **broader**: wider/broader terms that capture the general domain
5. **narrower**: more specific terms that drill into sub-topics

Also detect the most fitting academic domain.

Return ONLY a JSON object with no markdown, no explanations:
{"variants": ["primary keywords", "synonym variant", "mesh variant", "broader variant", "narrower variant"], "detectedDomain": "psychology"}

Valid domains: psychology, medicine, nursing, biology, education, sociology, economics, law, engineering, general.

Question: ${naturalQuery}`;

  const raw = await callLLM(provider, apiKey, effectiveModel, prompt);
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as { variants?: string[]; detectedDomain?: string };
    return {
      variants: Array.isArray(parsed.variants) && parsed.variants.length > 0
        ? parsed.variants.filter((v: string) => v.trim().length > 0)
        : [naturalQuery],
      detectedDomain: parsed.detectedDomain || "general",
    };
  } catch {
    return { variants: [naturalQuery], detectedDomain: "general" };
  }
}

export async function rerankResults(
  provider: import("./types").LLMProvider,
  apiKey: string,
  model: string | undefined,
  question: string,
  works: AcademicWork[]
): Promise<AcademicWork[]> {
  if (works.length === 0) return works;

  const effectiveModel = model || DEFAULT_MODELS[provider];

  const papers = works.map((w, i) =>
    `${i}: ${w.title} (${w.year})\n   Abstract: ${(w.abstract_text || "No abstract").slice(0, 300)}`
  ).join("\n\n");

  const prompt = `Rate how relevant each paper is to this research question. Score 0.0 (completely irrelevant) to 1.0 (perfect match). Consider: topic alignment, population studied, methodology relevance, and recency.

Question: ${question}

Papers:
${papers}

Return ONLY a JSON array (no markdown, no backticks):
[{"index": 0, "score": 0.85, "reason": "Directly studies CBT in adolescents with GAD"}, ...]`;

  const raw = await callLLM(provider, apiKey, effectiveModel, prompt);
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const scores: SemanticScore[] = JSON.parse(cleaned) as SemanticScore[];

    const scoreMap = new Map<number, SemanticScore>();
    for (const s of scores) {
      if (typeof s.index === "number" && typeof s.score === "number") {
        scoreMap.set(s.index, s);
      }
    }

    return works.map((w, i) => {
      const semScore = scoreMap.get(i);
      return {
        ...w,
        relevance_score: semScore?.score ?? w.relevance_score,
        reason: semScore?.reason ?? "",
      };
    });
  } catch {
    return works;
  }
}

export async function evaluateCoverage(
  provider: import("./types").LLMProvider,
  apiKey: string,
  model: string | undefined,
  question: string,
  works: AcademicWork[]
): Promise<{ sufficient: boolean; gaps: string; refinedQuery: string }> {
  const highRelevance = works.filter((w) => w.relevance_score >= 0.7);

  if (highRelevance.length >= 3) {
    return { sufficient: true, gaps: "", refinedQuery: "" };
  }

  const effectiveModel = model || DEFAULT_MODELS[provider];

  const summaries = works.map((w, i) =>
    `${i}: ${w.title} (${w.year}) — score ${w.relevance_score.toFixed(2)}`
  ).join("\n");

  const prompt = `We searched for "${question}" and found these papers. Only ${highRelevance.length} out of ${works.length} are highly relevant (score >= 0.7). Identify what's missing and suggest a refined search query.

Papers:
${summaries}

Return ONLY JSON:
{"gaps": "what key aspects are missing", "refinedQuery": "new optimized keyword search string"}`;

  const raw2 = await callLLM(provider, apiKey, effectiveModel, prompt);
  try {
    const cleaned2 = raw2.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const parsed2 = JSON.parse(cleaned2) as { gaps?: string; refinedQuery?: string };
    return {
      sufficient: false,
      gaps: parsed2.gaps || "Coverage insufficient",
      refinedQuery: parsed2.refinedQuery || question,
    };
  } catch {
    return { sufficient: false, gaps: "Coverage insufficient", refinedQuery: question };
  }
}

export async function agenticSearch(
  provider: import("./types").LLMProvider,
  apiKey: string,
  model: string | undefined,
  query: string,
  pubmedApiKey: string,
  crossrefEmail: string,
  domain: string,
  yearRange: number,
  onIteration?: (iteration: SearchIteration, allIterations: SearchIteration[]) => void
): Promise<{ results: AcademicWork[]; iterations: SearchIteration[] }> {
  const variants = await optimizeQuery(provider, apiKey, model, query);
  const iterations: SearchIteration[] = [];
  const seen = new Map<string, AcademicWork>();

  let currentQuery = variants.variants[0];
  const maxIterations = Math.min(3, variants.variants.length);

  for (let i = 0; i < maxIterations; i++) {
    const results = await searchAcademic(
      currentQuery,
      false,
      pubmedApiKey,
      crossrefEmail,
      variants.detectedDomain || domain,
      yearRange
    );

    const reranked = await rerankResults(provider, apiKey, model, query, results);

    for (const w of reranked) {
      const key = w.doi
        ? w.doi.replace("https://doi.org/", "").toLowerCase()
        : w.title.toLowerCase();
      if (!seen.has(key)) seen.set(key, w);
    }

    const coverage = await evaluateCoverage(provider, apiKey, model, query, reranked);

    iterations.push({
      iteration: i + 1,
      query: currentQuery,
      results: reranked,
      coverage: coverage.sufficient,
      gaps: coverage.gaps || undefined,
      refinedQuery: coverage.refinedQuery || undefined,
    });

    onIteration?.(iterations[iterations.length - 1], [...iterations]);

    if (coverage.sufficient) break;

    currentQuery = coverage.refinedQuery || variants.variants[i + 1] || variants.variants[0];
  }

  const merged = Array.from(seen.values());
  merged.sort((a, b) => b.relevance_score - a.relevance_score);

  return { results: merged, iterations };
}
