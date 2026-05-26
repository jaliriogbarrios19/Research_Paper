export interface LocaleStrings {
  openNoteFirst: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchNatural: string;
  optimizedQuery: string;
  optimizingQuery: string;
  searching: string;
  searchError: string;
  noResults: string;
  highPrecisionLabel: string;
  domainLabel: string;
  domainPsychology: string;
  domainMedicine: string;
  domainNursing: string;
  domainBiology: string;
  domainEducation: string;
  domainSociology: string;
  domainEconomics: string;
  domainLaw: string;
  domainEngineering: string;
  domainGeneral: string;
  llmProviderLabel: string;
  modeLabel: string;
  quickAnswer: string;
  fullPaper: string;
  generating: string;
  generateQuick: string;
  generateFull: string;
  aiDisclaimer: string;
  researchQuestion: string;
  sourcesConsulted: string;
  findingsPerSource: string;
  convergences: string;
  divergences: string;
  implications: string;
  implicationsWarning: string;
  generationFailed: string;
  generationReady: string;
  providerLabel: string;
  apiKeysLabel: string;
  apiKeyPlaceholder: string;
  showKey: string;
  hideKey: string;
  noApiKey: string;
  sourceLabel: string;
  openAccess: string;
  verifiedByCrossref: string;
  selectPapers: string;
  extraInstructions: string;
  extraInstructionsDesc: string;
  paperLanguageLabel: string;
  langEnglish: string;
  langSpanish: string;
  langPortuguese: string;
  langFrench: string;
  langGerman: string;
  langItalian: string;
  supportLabel: string;
  deepSearchLabel: string;
  iterationProgress: string;
  semanticScore: string;
}

const es: LocaleStrings = {
  openNoteFirst: "Abrí una nota primero",
  searchLabel: "Búsqueda académica",
  searchPlaceholder: "Buscar evidencia científica...",
  searchNatural: "¿Qué querés investigar?",
  optimizedQuery: "Query optimizada",
  optimizingQuery: "Optimizando búsqueda...",
  searching: "Buscando en PubMed y OpenAlex...",
  searchError: "Error en la búsqueda",
  noResults: "No se encontraron resultados. Probá con otros términos.",
  highPrecisionLabel: "Alta precisión (MeSH)",
  domainLabel: "Dominio",
  domainPsychology: "Psicología",
  domainMedicine: "Medicina",
  domainNursing: "Enfermería y Salud",
  domainBiology: "Biología",
  domainEducation: "Educación",
  domainSociology: "Sociología y Antropología",
  domainEconomics: "Economía y Negocios",
  domainLaw: "Derecho",
  domainEngineering: "Ingeniería e Informática",
  domainGeneral: "General",
  llmProviderLabel: "Proveedor LLM",
  modeLabel: "Modo",
  quickAnswer: "Respuesta rápida",
  fullPaper: "Brief de investigación",
  generating: "Generando...",
  generateQuick: "Generar respuesta rápida",
  generateFull: "Generar brief",
  aiDisclaimer: "⚠️ Research Brief — Asistido por IA. Todos los datos factuales son trazables a las fuentes.",
  researchQuestion: "Pregunta de investigación",
  sourcesConsulted: "Fuentes consultadas",
  findingsPerSource: "Hallazgos por fuente",
  convergences: "Convergencias",
  divergences: "Divergencias",
  implications: "Implicaciones",
  implicationsWarning: "⚠️ Esta sección es síntesis generada por IA, no revisión por pares.",
  generationFailed: "Falló la generación",
  generationReady: "Brief generado",
  providerLabel: "Proveedor LLM",
  apiKeysLabel: "API Keys",
  apiKeyPlaceholder: "Ingresá tu API key",
  showKey: "Mostrar",
  hideKey: "Ocultar",
  noApiKey: "No API key configurada para",
  sourceLabel: "Ver fuente",
  openAccess: "Acceso abierto",
  verifiedByCrossref: "Verificado por Crossref",
  selectPapers: "Seleccioná los artículos a incluir",
  extraInstructions: "Instrucciones extra",
  extraInstructionsDesc: "Ej: 'Enfocate en eficacia comparada con farmacoterapia' o 'Solo ensayos clínicos de los últimos 5 años'",
  paperLanguageLabel: "Idioma del brief",
  langEnglish: "English",
  langSpanish: "Español",
  langPortuguese: "Português",
  langFrench: "Français",
  langGerman: "Deutsch",
  langItalian: "Italiano",
  supportLabel: "☕ Apoyar este plugin",
  deepSearchLabel: "Deep search",
  iterationProgress: "Iteración {n}/{total}",
  semanticScore: "Score semántico",
};

const en: LocaleStrings = {
  openNoteFirst: "Open a note first",
  searchLabel: "Academic search",
  searchPlaceholder: "Search scientific evidence...",
  searchNatural: "What do you want to research?",
  optimizedQuery: "Optimized query",
  optimizingQuery: "Optimizing search...",
  searching: "Searching PubMed and OpenAlex...",
  searchError: "Search error",
  noResults: "No results found. Try different terms.",
  highPrecisionLabel: "High precision (MeSH)",
  domainLabel: "Domain",
  domainPsychology: "Psychology",
  domainMedicine: "Medicine",
  domainNursing: "Nursing & Health",
  domainBiology: "Biology",
  domainEducation: "Education",
  domainSociology: "Sociology & Anthropology",
  domainEconomics: "Economics & Business",
  domainLaw: "Law",
  domainEngineering: "Engineering & CS",
  domainGeneral: "General",
  llmProviderLabel: "LLM Provider",
  modeLabel: "Mode",
  quickAnswer: "Quick answer",
  fullPaper: "Research Brief",
  generating: "Generating...",
  generateQuick: "Generate quick answer",
  generateFull: "Generate brief",
  aiDisclaimer: "⚠️ Research Brief — AI-assisted. All factual data is traceable to the listed sources.",
  researchQuestion: "Research Question",
  sourcesConsulted: "Sources Consulted",
  findingsPerSource: "Findings per Source",
  convergences: "Convergences",
  divergences: "Divergences",
  implications: "Implications",
  implicationsWarning: "⚠️ This section is AI-generated synthesis, not peer-reviewed.",
  generationFailed: "Generation failed",
  generationReady: "Brief generated",
  providerLabel: "LLM Provider",
  apiKeysLabel: "API Keys",
  apiKeyPlaceholder: "Enter your API key",
  showKey: "Show",
  hideKey: "Hide",
  noApiKey: "No API key set for",
  sourceLabel: "View source",
  openAccess: "Open access",
  verifiedByCrossref: "Verified by Crossref",
  selectPapers: "Select articles to include",
  extraInstructions: "Extra instructions",
  extraInstructionsDesc: "E.g. 'Focus on efficacy compared to pharmacotherapy' or 'Only clinical trials from the last 5 years'",
  paperLanguageLabel: "Brief language",
  langEnglish: "English",
  langSpanish: "Spanish",
  langPortuguese: "Portuguese",
  langFrench: "French",
  langGerman: "German",
  langItalian: "Italian",
  supportLabel: "☕ Support this plugin",
  deepSearchLabel: "Deep search",
  iterationProgress: "Iteration {n}/{total}",
  semanticScore: "Semantic score",
};

export const LOCALES: Record<string, LocaleStrings> = { es, en };

export function t(key: keyof LocaleStrings, locale?: string): string {
  return LOCALES[locale ?? "es"]?.[key] ?? LOCALES.es[key] ?? key;
}
