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
  fullPaper: "Paper completo (APA 7)",
  generating: "Generando...",
  generateQuick: "Generar respuesta rápida",
  generateFull: "Redactar paper completo",
  generationFailed: "Falló la generación",
  generationReady: "Paper generado",
  providerLabel: "Proveedor LLM",
  apiKeysLabel: "API Keys",
  apiKeyPlaceholder: "Ingresá tu API key",
  showKey: "Mostrar",
  hideKey: "Ocultar",
  noApiKey: "No API key configurada para",
  sourceLabel: "Ver fuente",
  openAccess: "Acceso abierto",
  verifiedByCrossref: "Verificado por Crossref",
  selectPapers: "Seleccioná los papers a incluir en la generación",
  extraInstructions: "Instrucciones extra",
  extraInstructionsDesc: "Ej: 'Enfocate en eficacia comparada con farmacoterapia' o 'Solo ensayos clínicos de los últimos 5 años'",
  paperLanguageLabel: "Idioma del paper",
  langEnglish: "English",
  langSpanish: "Español",
  langPortuguese: "Português",
  langFrench: "Français",
  langGerman: "Deutsch",
  langItalian: "Italiano",
  supportLabel: "☕ Apoyar este plugin",
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
  fullPaper: "Full paper (APA 7)",
  generating: "Generating...",
  generateQuick: "Generate quick answer",
  generateFull: "Draft full paper",
  generationFailed: "Generation failed",
  generationReady: "Paper generated",
  providerLabel: "LLM Provider",
  apiKeysLabel: "API Keys",
  apiKeyPlaceholder: "Enter your API key",
  showKey: "Show",
  hideKey: "Hide",
  noApiKey: "No API key set for",
  sourceLabel: "View source",
  openAccess: "Open access",
  verifiedByCrossref: "Verified by Crossref",
  selectPapers: "Select papers to include in the generation",
  extraInstructions: "Extra instructions",
  extraInstructionsDesc: "E.g. 'Focus on efficacy compared to pharmacotherapy' or 'Only clinical trials from the last 5 years'",
  paperLanguageLabel: "Paper language",
  langEnglish: "English",
  langSpanish: "Spanish",
  langPortuguese: "Portuguese",
  langFrench: "French",
  langGerman: "German",
  langItalian: "Italian",
  supportLabel: "☕ Support this plugin",
};

export const LOCALES: Record<string, LocaleStrings> = { es, en };

export function t(key: keyof LocaleStrings, locale?: string): string {
  return LOCALES[locale ?? "es"]?.[key] ?? LOCALES.es[key] ?? key;
}
