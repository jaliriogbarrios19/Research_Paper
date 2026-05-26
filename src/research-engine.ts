import { AcademicWork, LLMProvider, QueryVariants, SemanticScore, SearchIteration } from "./types";

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const OPENALEX_BASE = "https://api.openalex.org/works";
const S2_BASE = "https://api.semanticscholar.org/graph/v1";

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-5.5",
  anthropic: "claude-opus-4-7",
  deepseek: "deepseek-v4-pro",
  gemini: "gemini-2.5-pro",
  openrouter: "openai/gpt-5.5",
  grok: "grok-4.3",
  glm: "glm-4-plus",
};

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

  const [pubmed, openalex, semantic] = await Promise.allSettled([
    usePubMed ? fetchPubMed(meshQuery, pubmedApiKey) : Promise.resolve([] as AcademicWork[]),
    fetchOpenAlex(query, email),
    fetchSemanticScholar(query),
  ]);

  const combined: AcademicWork[] = [];
  if (pubmed.status === "fulfilled") combined.push(...pubmed.value);
  if (openalex.status === "fulfilled") combined.push(...openalex.value);
  if (semantic.status === "fulfilled") combined.push(...semantic.value);

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

async function fetchPubMed(
  query: string,
  apiKey: string
): Promise<AcademicWork[]> {
  const params = new URLSearchParams({
    db: "pubmed",
    term: query,
    retmode: "json",
    retmax: "10",
  });
  if (apiKey) params.set("api_key", apiKey);

  const searchRes = await fetch(
    `${PUBMED_BASE}/esearch.fcgi?${params.toString()}`
  );
  if (!searchRes.ok) throw new Error(`PubMed HTTP ${searchRes.status}`);
  const searchData = await searchRes.json();
  const ids: string[] = searchData.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summaryParams = new URLSearchParams({
    db: "pubmed",
    id: ids.join(","),
    retmode: "json",
  });
  if (apiKey) summaryParams.set("api_key", apiKey);

  const sumRes = await fetch(
    `${PUBMED_BASE}/esummary.fcgi?${summaryParams.toString()}`
  );
  if (!sumRes.ok) throw new Error(`PubMed summary HTTP ${sumRes.status}`);
  const sumData = await sumRes.json();

  const abstracts = await fetchAbstracts(ids, apiKey);

  const works: AcademicWork[] = [];
  for (const id of ids) {
    const article = sumData.result?.[id];
    if (!article) continue;
    const doi =
      article.articleids?.find((a: { idtype: string }) => a.idtype === "doi")
        ?.value ?? "";
    works.push({
      doi: doi ? `https://doi.org/${doi}` : "",
      title: article.title ?? "",
      authors:
        article.authors?.map((a: { name: string }) => ({ name: a.name })) ??
        [],
      year: parseInt(article.pubdate?.split(" ")[0] ?? "0") || 0,
      journal: article.fulljournalname ?? "",
      abstract_text: abstracts.get(id) ?? "",
      relevance_score: 0.9,
      url: doi
        ? `https://doi.org/${doi}`
        : `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      mesh_terms: [],
    });
  }
  return works;
}

async function fetchAbstracts(
  ids: string[],
  apiKey: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    const params = new URLSearchParams({
      db: "pubmed",
      id: ids.join(","),
      retmode: "xml",
      rettype: "abstract",
    });
    if (apiKey) params.set("api_key", apiKey);

    const res = await fetch(
      `${PUBMED_BASE}/efetch.fcgi?${params.toString()}`
    );
    if (!res.ok) return result;

    const xml = await res.text();
    const abstractRegex =
      /<PubmedArticle>[\s\S]*?<PMID[^>]*>(\d+)<\/PMID>[\s\S]*?<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi;

    let match;
    while ((match = abstractRegex.exec(xml)) !== null) {
      const pmid = match[1];
      const abstract = match[2]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (abstract) result.set(pmid, abstract);
    }
  } catch {
    // EFetch failure is non-fatal — return empty abstracts
  }
  return result;
}

async function fetchOpenAlex(
  query: string,
  email: string
): Promise<AcademicWork[]> {
  const params = new URLSearchParams({ search: query, mailto: email });
  const res = await fetch(`${OPENALEX_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`);
  const data = await res.json();

  return (data.results ?? []).map((w: any) => ({
    doi: w.doi ?? "",
    title: w.title ?? w.display_name ?? "",
    authors:
      w.authorships?.map((a: any) => ({
        name: a.author?.display_name ?? "",
      })) ?? [],
    year: w.publication_year ?? 0,
    journal: w.host_venue?.display_name ?? "",
    abstract_text: "",
    relevance_score: w.relevance_score ?? 0.5,
    url: w.doi ?? "",
    mesh_terms: [],
  }));
}

async function fetchSemanticScholar(query: string): Promise<AcademicWork[]> {
  try {
    const params = new URLSearchParams({
      query,
      limit: "10",
      fields: "title,year,authors,journal,externalIds,abstract,url",
    });
    const res = await fetch(
      `${S2_BASE}/paper/search?${params.toString()}`
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.data ?? []).map((p: any) => ({
      doi: p.externalIds?.DOI ?? "",
      title: p.title ?? "",
      authors:
        p.authors?.map((a: any) => ({ name: a.name })) ?? [],
      year: p.year ?? 0,
      journal: p.journal?.name ?? "",
      abstract_text: p.abstract ?? "",
      relevance_score: 0.7,
      url: p.url ?? (p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : ""),
      mesh_terms: [],
    }));
  } catch {
    return [];
  }
}

export async function generatePaper(
  provider: LLMProvider,
  apiKey: string,
  model: string | undefined,
  query: string,
  works: AcademicWork[],
  domain: string,
  mode: "quick" | "full",
  paperLanguage: string,
  instructions?: string
): Promise<string> {
  const effectiveModel = model || DEFAULT_MODELS[provider];

  const context = works
    .map(
      (w, i) =>
        `Source ${i + 1}: ${w.title} (${w.year})\nAuthors: ${w.authors.map((a) => a.name).join(", ")}\nJournal: ${w.journal}\nDOI: ${w.doi}\nAbstract: ${w.abstract_text || "Not available"}`
    )
    .join("\n\n");

  const sourceDOIs = works
    .filter((w) => w.doi)
    .map((w) => w.doi.replace("https://doi.org/", ""))
    .join(", ");

  const citationRule = sourceDOIs
    ? `\nCRITICAL: Only cite the provided sources above. Use their EXACT DOIs in references (${sourceDOIs}). Do NOT invent new sources or fabricate DOIs. If a source has no DOI, cite it without one.`
    : "";

  const extra = instructions?.trim()
    ? `\nAdditional instructions from user: ${instructions.trim()}`
    : "";

  const languageNames: Record<string, string> = {
    es: "Español", en: "English", pt: "Português", fr: "Français", de: "Deutsch", it: "Italiano"
  };
  const abstractTerms: Record<string, string> = {
    es: "Resumen", en: "Abstract", pt: "Resumo", fr: "Résumé", de: "Zusammenfassung", it: "Abstract"
  };
  const langName = languageNames[paperLanguage] || paperLanguage;
  const abstractTerm = abstractTerms[paperLanguage] || "Abstract";

  const sectionTitles: Record<string, Record<string, string>> = {
    es: {
      researchQuestion: "Pregunta de Investigación",
      sourcesConsulted: "Fuentes Consultadas",
      findingsPerSource: "Hallazgos por Fuente",
      convergences: "Convergencias",
      divergences: "Divergencias",
      implications: "Implicaciones",
      references: "Referencias",
    },
    en: {
      researchQuestion: "Research Question",
      sourcesConsulted: "Sources Consulted",
      findingsPerSource: "Findings per Source",
      convergences: "Convergences",
      divergences: "Divergences",
      implications: "Implications",
      references: "References",
    },
    pt: {
      researchQuestion: "Pergunta de Pesquisa",
      sourcesConsulted: "Fontes Consultadas",
      findingsPerSource: "Resultados por Fonte",
      convergences: "Convergências",
      divergences: "Divergências",
      implications: "Implicações",
      references: "Referências",
    },
    fr: {
      researchQuestion: "Question de Recherche",
      sourcesConsulted: "Sources Consultées",
      findingsPerSource: "Résultats par Source",
      convergences: "Convergences",
      divergences: "Divergences",
      implications: "Implications",
      references: "Références",
    },
    de: {
      researchQuestion: "Forschungsfrage",
      sourcesConsulted: "Konsultierte Quellen",
      findingsPerSource: "Ergebnisse pro Quelle",
      convergences: "Konvergenzen",
      divergences: "Divergenzen",
      implications: "Implikationen",
      references: "Referenzen",
    },
    it: {
      researchQuestion: "Domanda di Ricerca",
      sourcesConsulted: "Fonti Consultate",
      findingsPerSource: "Risultati per Fonte",
      convergences: "Convergenze",
      divergences: "Divergenze",
      implications: "Implicazioni",
      references: "Riferimenti",
    },
  };

  const t = (key: string): string => {
    return sectionTitles[paperLanguage]?.[key] || sectionTitles.en[key] || key;
  };

  const prompt =
    mode === "quick"
      ? `Answer this question using the provided evidence. Be concise and cite sources using APA 7 in-text format (Author, Year). Do NOT output bare DOIs or URLs as citations. At the end, add a 'References' section with the full APA 7 citations of all sources you cited.${citationRule}\nLanguage: write the answer in ${paperLanguage}.${extra}\n\nQuestion: ${query}\nDomain: ${domain}\n\nEvidence:\n${context}`
      : `Generate a Research Brief from the provided sources. Use clean markdown (no HTML entities, no LaTeX, no fences). Structure:${citationRule}

## Research Brief: {concise title in ${langName}}

> ⚠️ AI-assisted brief. All factual data is traceable to the listed sources.

### ${t("researchQuestion")}
${query}

### ${t("sourcesConsulted")}
{For EACH source, include: number, full APA 7 citation with authors, year, title, journal, volume, pages, and DOI as clickable link. Then write a 2-3 sentence faithful summary of the abstract IN ${langName} (do NOT paste the English abstract — paraphrase it accurately in ${langName}). Example:
1. Smith, J., Jones, M., & Lee, K. (2025). Title of the article. *Journal Name*, *12*(3), 45-67. [DOI: 10.xxx](https://doi.org/10.xxx)
   {2-3 sentence summary in ${langName}}
}
DO NOT add a separate References section.

### ${t("findingsPerSource")}
{For EACH source, write 2-4 bullet points summarizing its key findings with APA 7 in-text citations. Example: Smith et al. (2025) found that... Include population, method, and effect sizes. Start each bullet with the in-text citation.}

### ${t("convergences")}
{2-4 bullet points where multiple sources agree. Use APA 7 in-text citations like (Smith, 2020; García, 2021). Do NOT use source numbers like 'sources 1,3' — always cite by author and year.}

### ${t("divergences")}
{2-4 bullet points where sources disagree or report different findings. Explain possible reasons (population, method, period). Use APA 7 in-text citations — never source numbers.}

### ${t("implications")}
{2-3 paragraphs synthesizing what this evidence means as a whole. Use APA 7 in-text citations.}
> ⚠️ This section is AI-generated synthesis.

IMPORTANT: This is a RESEARCH BRIEF. Do NOT add Introduction, Methods, Discussion, Conclusion, or a separate References section (sources are already cited above). Do NOT claim to have performed analysis. All facts come from the source abstracts provided. Use APA 7 in-text citations throughout. All section headers MUST be in ${langName}.${extra}

Topic: ${query}\nDomain: ${domain}\n\nEvidence:\n${context}`;

  return callLLM(provider, apiKey, effectiveModel, prompt);
}

export async function optimizeQuery(
  provider: LLMProvider,
  apiKey: string,
  model: string | undefined,
  naturalQuery: string
): Promise<QueryVariants> {
  const effectiveModel = model || DEFAULT_MODELS[provider];

  const prompt = `You are a research query optimizer for academic databases (PubMed, OpenAlex, Semantic Scholar). Convert this natural language question into MULTIPLE optimized English keyword search variants. Generate exactly 5 variants following this structure:

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
    const parsed = JSON.parse(cleaned);
    return {
      variants: Array.isArray(parsed.variants) && parsed.variants.length > 0
        ? parsed.variants.filter((v: unknown) => typeof v === "string" && v.trim().length > 0)
        : [naturalQuery],
      detectedDomain: parsed.detectedDomain || "general",
    };
  } catch {
    return { variants: [naturalQuery], detectedDomain: "general" };
  }
}

async function callLLM(
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

export async function verifyDOIs(
  text: string,
  crossrefEmail: string
): Promise<string> {
  const doiRegex = /(?:\[DOI:\s*|https?:\/\/doi\.org\/)(10\.\d{4,}\/[^\s\]\)\]]+)/gi;
  const email = crossrefEmail || "hola@neuroscribe.app";
  const dois = new Map<string, string>();

  let match;
  while ((match = doiRegex.exec(text)) !== null) {
    const raw = match[1].replace(/[.,;:)\]]+$/, "");
    if (!dois.has(raw)) dois.set(raw, raw);
  }

  if (dois.size === 0) return text;

  const validDois = new Set<string>();
  const invalidDois = new Set<string>();

  for (const doi of dois.values()) {
    try {
      const res = await fetch(
        `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${encodeURIComponent(email)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        validDois.add(doi);
      } else if (res.status === 404) {
        invalidDois.add(doi);
      } else {
        validDois.add(doi);
      }
    } catch {
      validDois.add(doi);
    }
  }

  let result = text;
  for (const doi of invalidDois) {
    const escaped = doi.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(
      new RegExp(`\\[DOI:\\s*${escaped}\\]`, "gi"),
      `*(Cita no verificada)*`
    );
    result = result.replace(
      new RegExp(`https?://doi\\.org/${escaped}`, "gi"),
      `[DOI invalidado: ${doi}]`
    );
  }

  return result;
}

export function formatPaper(text: string, mode: "quick" | "full"): string {
  const cleaned = text
    .replace(/^% .*\n?/gm, "")
    .replace(/^```\w*\n?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

  if (mode === "quick") {
    return `\n${cleaned}\n`;
  }

  return `\n${cleaned}\n`;
}
