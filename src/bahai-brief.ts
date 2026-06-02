import { LLMProvider } from "./types";
import { callLLM, DEFAULT_MODELS } from "./llm-client";

const KNOWN_BAHAI_TEXTS = [
  "Kitáb-i-Aqdas",
  "Kitáb-i-Íqán",
  "Palabras Ocultas",
  "Pasajes de los Escritos de Bahá'u'lláh",
  "El Llamado del Señor de los Ejércitos",
  "Tablas de Bahá'u'lláh",
  "Epístola al Hijo del Lobo",
  "Los Siete Valles",
  "Los Cuatro Valles",
  "Joyas de los Misterios Divinos",
  "Oraciones y Meditaciones",
  "Selección de los Escritos del Báb",
  "Contestación a Unas Preguntas",
  "El Secreto de la Civilización Divina",
  "Tablas del Plan Divino",
  "Voluntad y Testamento de 'Abdu'l-Bahá",
  "Selección de los Escritos de 'Abdu'l-Bahá",
  "La Promulgación de la Paz Universal",
  "La Sabiduría de 'Abdu'l-Bahá",
  "El Desenvolvimiento de la Civilización Mundial",
  "Dios Pasa",
  "El Día Prometido Ha Llegado",
  "Los Rompedores del Alba",
  "Mensajes de la Casa Universal de Justicia",
  "La Prosperidad de la Humanidad",
  "Bahá'u'lláh",
  "Casa Universal de Justicia",
  "Shoghi Effendi",
  "Shoghi Effendi",
  "Báb",
  "'Abdu'l-Bahá",
  "Hidden Words",
  "Gleanings from the Writings of Bahá'u'lláh",
  "Tablets of Bahá'u'lláh",
  "Epistle to the Son of the Wolf",
  "The Seven Valleys",
  "The Four Valleys",
  "Gems of Divine Mysteries",
  "Prayers and Meditations",
  "Some Answered Questions",
  "The Secret of Divine Civilization",
  "Tablets of the Divine Plan",
  "Will and Testament of 'Abdu'l-Bahá",
  "Selections from the Writings of 'Abdu'l-Bahá",
  "The Promulgation of Universal Peace",
  "Paris Talks",
  "The World Order of Bahá'u'lláh",
  "God Passes By",
  "The Dawn-Breakers",
  "Messages of the Universal House of Justice",
  "The Prosperity of Humankind",
  "Selections from the Writings of the Báb",
  "Tablets of Bahá'u'lláh Revealed After the Kitáb-i-Aqdas",
  "Summons of the Lord of Hosts",
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export async function verifyBahaiCitations(text: string): Promise<string> {
  const citationRegex = /["""]([^""""]+?)[""](?:\s*\(([^)]+)\)|\s*—\s*([^,.\n]+))/g;
  const sourceNames = new Map<string, string>();

  let match;
  while ((match = citationRegex.exec(text)) !== null) {
    const quotedText = match[1]?.trim();
    const citation = (match[2] || match[3] || "").trim();
    if (citation && citation.length > 2 && citation.length < 200) {
      if (!sourceNames.has(citation)) {
        sourceNames.set(citation, citation);
      }
    }
  }

  const inlineRefRegex = /\(([^)]*(?:Bahá'u'lláh|'Abdu'l-Bahá|Báb|Shoghi Effendi|Casa Universal|Universal House)[^)]*?(?:,\s*(?:párr?|para?|pág|pp?\.|núm|cap)\.?\s*[^)]*)?)\)/gi;
  let inlineMatch;
  while ((inlineMatch = inlineRefRegex.exec(text)) !== null) {
    const ref = inlineMatch[1].trim();
    if (ref && !sourceNames.has(ref)) {
      sourceNames.set(ref, ref);
    }
  }

  let result = text;

  for (const [, source] of sourceNames) {
    const normSource = normalizeText(source);
    const found = KNOWN_BAHAI_TEXTS.some(
      (known) => normSource.includes(normalizeText(known)) || normalizeText(known).includes(normSource)
    );

    if (!found) {
      const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const citationPattern = new RegExp(
        `([""]'']\\s*)?\\(?${escaped}\\)?`,
        "gi"
      );
      result = result.replace(citationPattern, (full) => {
        if (full.includes("(Cita no verificada)")) return full;
        return `${full} *(Cita no verificada en fuentes oficiales)*`;
      });
    }
  }

  const verifiedCount = sourceNames.size;
  if (verifiedCount > 0) {
    const header = text.includes("## Research Brief:") || text.includes("## Brief de Investigación:");
    if (header) {
      const verifiedNote = `\n> *Verificación Bahá'í: ${verifiedCount} referencia(s) analizada(s) contra fuentes oficiales. Las citas marcadas con *(Cita no verificada)* no coinciden con textos canónicos conocidos. Se recomienda verificar en [reference.bahai.org](https://reference.bahai.org).*\n`;
      const firstHeader = result.match(/^#{1,3}\s+.+$/m);
      if (firstHeader) {
        const idx = result.indexOf(firstHeader[0]) + firstHeader[0].length;
        result = result.slice(0, idx) + verifiedNote + result.slice(idx);
      }
    }
  }

  return result;
}

export async function generateBahaiBrief(
  provider: LLMProvider,
  apiKey: string,
  model: string | undefined,
  query: string,
  paperLanguage: string,
  instructions?: string
): Promise<string> {
  const effectiveModel = model || DEFAULT_MODELS[provider];

  const extra = instructions?.trim()
    ? `\nAdditional instructions from user: ${instructions.trim()}`
    : "";

  const languageNames: Record<string, string> = {
    es: "Español", en: "English", pt: "Português", fr: "Français", de: "Deutsch", it: "Italiano"
  };
  const langName = languageNames[paperLanguage] || paperLanguage;

  const sectionTitles: Record<string, Record<string, string>> = {
    es: {
      researchQuestion: "Pregunta de Investigación",
      findingsPerSource: "Hallazgos por Fuente",
      synthesisImplications: "Síntesis e Implicaciones",
    },
    en: {
      researchQuestion: "Research Question",
      findingsPerSource: "Findings per Source",
      synthesisImplications: "Synthesis and Implications",
    },
    pt: {
      researchQuestion: "Pergunta de Pesquisa",
      findingsPerSource: "Resultados por Fonte",
      synthesisImplications: "Síntese e Implicações",
    },
    fr: {
      researchQuestion: "Question de Recherche",
      findingsPerSource: "Résultats par Source",
      synthesisImplications: "Synthèse et Implications",
    },
    de: {
      researchQuestion: "Forschungsfrage",
      findingsPerSource: "Ergebnisse pro Quelle",
      synthesisImplications: "Synthese und Implikationen",
    },
    it: {
      researchQuestion: "Domanda di Ricerca",
      findingsPerSource: "Risultati per Fonte",
      synthesisImplications: "Sintesi e Implicazioni",
    },
  };

  const t = (key: string): string => {
    return sectionTitles[paperLanguage]?.[key] || sectionTitles.en[key] || key;
  };

  const prompt = `You are researching the Bahá'í Faith. Generate a Research Brief using YOUR KNOWLEDGE of the Bahá'í Sacred Writings and official sources. Use clean markdown (no HTML entities, no LaTeX, no fences).

CRITICAL RULES:
1. ONLY cite official Bahá'í sources from the Bahá'í Reference Library (reference.bahai.org) or bahai.org.
2. Use proper Bahá'í citation format: (Author, *Title*, paragraph/chapter/page).
3. For Bahá'u'lláh: "Bahá'u'lláh, *Title*, párr/para X" or "Bahá'u'lláh, *Title*, p. X".
4. For 'Abdu'l-Bahá: "'Abdu'l-Bahá, *Title*, p. X".
5. For Shoghi Effendi: "Shoghi Effendi, *Title*, p. X".
6. For Universal House of Justice: "Universal House of Justice, *Title*, date, p. X".
7. For Báb: "The Báb, *Title*, p. X".
8. NEVER invent citations, page numbers, or sources. If you cannot provide a precise citation, write the principle as a general teaching (e.g. "The Bahá'í Writings teach that...").
9. When quoting text directly, you are recalling from your training data — not accessing the live text. Only quote passages you are highly confident about. Paraphrase when unsure.
10. All section headers and content MUST be in ${langName}.
11. When providing URLs, link DIRECTLY to the specific text on reference.bahai.org (e.g. https://reference.bahai.org/en/t/b/GWB/ for Gleanings, https://reference.bahai.org/en/t/ab/SAQ/ for Some Answered Questions). Do NOT just link to the homepage.
${extra}

Structure:

## Research Brief: {concise title in ${langName}}

### ${t("researchQuestion")}
${query}

### ${t("findingsPerSource")}
{For EACH source, write a self-contained block structured as follows:

1. A thematic subtitle as an H4 heading (####) that captures the core idea of this source's contribution — e.g. "#### La educación como obligación espiritual" or "#### El niño como mina de gemas". The subtitle should be descriptive and scannable. Do NOT repeat the author or book title here.
2. Approximately 150 words (2-3 substantial paragraphs) of findings relevant to the question. Develop each finding with context, explanation, and doctrinal depth. Place the specific citation — (Author, *Title*, párr/p. X) — at the END of the paragraph, not at the beginning.
3. At the END of each block, a separator line (---) followed by the FULL canonical reference including URL as a clickable link. Format exactly:
---
**Referencia:** Author. *Title in original* (*Title in ${langName}*). Publisher, Year. [Disponible en reference.bahai.org](URL)

Each source block must be self-contained — the reader should not need another section to find the full citation.}

### ${t("synthesisImplications")}
{3-4 substantial paragraphs (approximately 400-500 words total) that first SYNTHESIZE what this body of Bahá'í teachings means as a coherent whole, and then draw out the practical IMPLICATIONS for the question at hand. The synthesis should weave together the findings from all consulted sources, showing how they form an integrated Bahá'í perspective. The implications should connect spiritual principles to concrete applications — whether individual conduct, community life, or social policy. Use APA 7 in-text citations throughout. Do NOT claim personal revelation or interpretation beyond what the texts state.}

IMPORTANT: This is a DOCTRINAL RESEARCH BRIEF based on Bahá'í Sacred Writings and authoritative texts. Do NOT add Introduction, Methods, Discussion, or Conclusion. Do NOT claim to have performed original academic research. All content comes from the Bahá'í Writings as preserved in your training data — direct quotes should be verified against the original texts on reference.bahai.org before academic use. The verification note at the top will be added automatically by the system.

Topic: ${query}\nDomain: Bahá'í Faith\nLanguage: ${langName}`;

  return callLLM(provider, apiKey, effectiveModel, prompt);
}
