import { AcademicWork, LLMProvider } from "./types";
import { callLLM, DEFAULT_MODELS } from "./llm-client";
import { requestUrl } from "obsidian";

export async function generateBrief(
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

### ${t("researchQuestion")}
${query}

### ${t("sourcesConsulted")}
{For EACH source, include: number, full APA 7 citation with authors, year, title, journal, volume, pages, and DOI as clickable link. Then write a 2-3 sentence faithful summary of the abstract IN ${langName} (paraphrase — do NOT paste the English abstract). If the abstract is unavailable, write "${abstractTerm}: No disponible." / "${abstractTerm}: Not available." Example:
1. Smith, J., Jones, M., y Lee, K. (2025). Title of the article. *Journal Name*, *12*(3), 45-67. [DOI: 10.xxx](https://doi.org/10.xxx)
   Resumen: {2-3 sentence paraphrased summary in ${langName}}
}

### ${t("findingsPerSource")}
{For EACH source, write 2-4 bullet points summarizing its key findings. Use APA 7 in-text citations (Author, Year). Example: Smith et al. (2025) encontraron que... Include population, method, and effect sizes when available. Start each bullet with the in-text citation.}

### ${t("convergences")}
{2-4 bullet points where multiple sources agree. Use APA 7 in-text citations like (Smith, 2020; García, 2021). Do NOT use source numbers like 'sources 1,3' — always cite by author and year.}

### ${t("divergences")}
{2-4 bullet points where sources disagree or report different findings. Explain possible reasons (population, method, period). Use APA 7 in-text citations — never source numbers.}

### ${t("implications")}
{2-3 paragraphs synthesizing what this evidence means as a whole. Use APA 7 in-text citations.}

IMPORTANT: This is a RESEARCH BRIEF, not a paper. Do NOT add Introduction, Methods, Discussion, Conclusion, or a separate References section (sources are already fully cited in Sources Consulted above). Do NOT claim to have performed analysis. All facts come from the source abstracts provided. Use APA 7 in-text citations throughout. All section headers MUST be in ${langName}.${extra}

Topic: ${query}\nDomain: ${domain}\n\nEvidence:\n${context}`;

  return callLLM(provider, apiKey, effectiveModel, prompt);
}

export async function verifyDOIs(
  text: string,
  crossrefEmail: string
): Promise<string> {
  const doiRegex = /(?:\[DOI:\s*|https?:\/\/doi\.org\/)(10\.\d{4,}\/[^\s\])\]]+)/gi;
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
      const res = await requestUrl({
        url: `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${encodeURIComponent(email)}`,
      });
      if (res.status >= 200 && res.status < 300) {
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

export function formatBrief(text: string, mode: "quick" | "full"): string {
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
