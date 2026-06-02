import type ResearchAndPaperPlugin from "../main";
import { AcademicWork, ResearchDomain } from "./types";
import {
  searchAcademic,
  generateBrief,
  formatBrief,
  verifyDOIs,
  optimizeQuery,
  agenticSearch,
  generateBahaiBrief,
  verifyBahaiCitations,
} from "./research-engine";
import { getModelField } from "./settings";
import { Notice } from "obsidian";

export interface ModalState {
  plugin: ResearchAndPaperPlugin;
  query: string;
  domain: string;
  paperLanguage: string;
  mode: "quick" | "full";
  yearRange: number;
  highPrecision: boolean;
  deepSearch: boolean;
  instructions: string;
  results: AcademicWork[];
  selectedIndices: Set<number>;
  optimizedQuery: string;
  iterationStatus: string;
  generating: boolean;
  loading: boolean;
  optimizing: boolean;
  error: string | null;
}

export async function handleSearch(
  state: ModalState,
  render: () => void
): Promise<void> {
  try {
    if (!state.query.trim()) {
      state.error = "Escribí una pregunta de investigación para buscar.";
      render();
      return;
    }

    if (state.generating || state.optimizing || state.loading) return;

    const provider = state.plugin.settings.llmProvider;
    const apiKey = state.plugin.getApiKey(provider);
    if (!apiKey) {
      state.error = `No API key configurada para ${provider}`;
      render();
      return;
    }

    if (state.domain === "bahai") {
      state.error = null;
      state.results = [];
      render();
      return;
    }

    state.optimizing = true;
    state.loading = true;
    state.error = null;
    state.results = [];
    state.instructions = "";
    state.iterationStatus = "";
    render();

    const modelField = getModelField(provider);
    const model =
      (state.plugin.settings as unknown as Record<string, string>)[modelField] ||
      undefined;

    if (state.deepSearch) {
      state.optimizing = false;
      render();
      const result = await agenticSearch(
        provider,
        apiKey,
        model,
        state.query,
        state.plugin.settings.pubmedApiKey,
        state.plugin.settings.crossrefEmail,
        state.domain,
        state.yearRange,
        (_iteration, allIterations) => {
          state.iterationStatus = allIterations
            .map((it) => `Iter ${it.iteration}: ${it.results.length} papers — ${it.coverage ? "suficiente" : "refining..."}`)
            .join(" | ");
          render();
        }
      );
      state.results = result.results;
      state.optimizedQuery = result.iterations.length > 0
        ? result.iterations[result.iterations.length - 1].query
        : state.query;
    } else {
      const optimized = await optimizeQuery(provider, apiKey, model, state.query);
      state.optimizing = false;
      state.optimizedQuery = optimized.variants[0];

      if (optimized.detectedDomain && !state.domain) {
        state.domain = optimized.detectedDomain as ResearchDomain;
      }

      state.results = await searchAcademic(
        state.optimizedQuery,
        state.highPrecision,
        state.plugin.settings.pubmedApiKey,
        state.plugin.settings.crossrefEmail,
        state.domain,
        state.yearRange
      );
    }

    state.selectedIndices = new Set(
      Array.from({ length: state.results.length }, (_, i) => i)
    );
  } catch (err) {
    console.error("[Research Paper] handleSearch error:", err);
    state.error = err instanceof Error ? err.message : String(err);
  } finally {
    state.optimizing = false;
    state.loading = false;
    render();
  }
}

export async function handleGenerate(
  state: ModalState,
  editor: import("obsidian").Editor,
  close: () => void,
  render: () => void
): Promise<void> {
  try {
    if (state.generating || state.loading || state.optimizing) return;

    const provider = state.plugin.settings.llmProvider;
    const apiKey = state.plugin.getApiKey(provider);
    if (!apiKey) {
      state.error = `No API key configurada para ${provider}`;
      render();
      return;
    }

    const modelField = getModelField(provider);
    const model =
      (state.plugin.settings as unknown as Record<string, string>)[modelField] ||
      undefined;

    state.generating = true;
    render();

    if (state.domain === "bahai") {
      const raw = await generateBahaiBrief(
        provider,
        apiKey,
        model,
        state.query,
        state.paperLanguage,
        state.instructions
      );

      const verified = await verifyBahaiCitations(raw);
      const formatted = formatBrief(verified, state.mode);

      editor.replaceRange(formatted, editor.getCursor());

      new Notice("Brief Bahá'í generado");
      state.generating = false;
      state.loading = false;
      close();
      return;
    }

    const selected = state.results
      .slice(0, 10)
      .filter((_, i) => state.selectedIndices.has(i));

    if (selected.length === 0) {
      state.error = "Seleccioná al menos un artículo.";
      render();
      return;
    }

    const raw = await generateBrief(
      provider,
      apiKey,
      model,
      state.query,
      selected,
      state.domain,
      state.mode,
      state.paperLanguage,
      state.instructions
    );

    const verified = await verifyDOIs(
      raw,
      state.plugin.settings.crossrefEmail
    );

    const formatted = formatBrief(verified, state.mode);

    editor.replaceRange(formatted, editor.getCursor());

    new Notice("Brief generado");
    state.generating = false;
    close();
  } catch (err) {
    console.error("[Research Paper] handleGenerate error:", err);
    state.error = err instanceof Error ? err.message : String(err);
    state.generating = false;
    render();
    new Notice(`Falló la generación: ${state.error}`);
  }
}
