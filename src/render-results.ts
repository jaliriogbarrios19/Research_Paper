import { AcademicWork } from "./types";
import { type LocaleStrings } from "./locales";

export interface RenderResultsParams {
  L: (key: keyof LocaleStrings) => string;
  results: AcademicWork[];
  selectedIndices: Set<number>;
  onToggle: (idx: number) => void;
  instructions: string;
  onInstructionsChange: (value: string) => void;
  generating: boolean;
  mode: "quick" | "full";
  onGenerate: () => void;
}

export function renderResults(
  contentEl: HTMLElement,
  params: RenderResultsParams
): void {
  const {
    L,
    results,
    selectedIndices,
    onToggle,
    instructions,
    onInstructionsChange,
    generating,
    mode,
    onGenerate,
  } = params;

  contentEl.createDiv({
    text: L("selectPapers"),
    attr: {
      style:
        "font-weight: 600; margin-bottom: 8px; padding-top: 8px; border-top: 1px solid var(--background-modifier-border);",
    },
  });

  for (const [idx, work] of results.slice(0, 10).entries()) {
    const row = contentEl.createDiv({
      attr: {
        style:
          "display: flex; align-items: flex-start; gap: 8px; border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 8px; margin-bottom: 6px;",
      },
    });

    const cb = row.createEl("input", {
      type: "checkbox",
      attr: { style: "margin-top: 3px; flex-shrink: 0;" },
    });
    cb.checked = selectedIndices.has(idx);
    cb.onchange = () => onToggle(idx);

    const info = row.createDiv({ attr: { style: "flex: 1;" } });
    info.createEl("div", {
      text: work.title,
      attr: { style: "font-weight: 600; margin-bottom: 2px;" },
    });
    const meta = info.createDiv({
      attr: {
        style: "display: flex; align-items: center; gap: 8px; font-size: 0.85em; color: var(--text-muted);",
      },
    });
    meta.createEl("span", { text: `${work.year} · ${work.journal}` });
    const score = Math.round(work.relevance_score * 100);
    const scoreColor =
      score >= 80 ? "var(--color-green)" : score >= 60 ? "var(--color-orange)" : "var(--text-faint)";
    const scoreTooltip = work.reason
      ? `${score}% — ${work.reason}`
      : `${score}% de relevancia`;
    meta.createEl("span", {
      text: `${score}%`,
      attr: {
        title: scoreTooltip,
        style: `font-size: 0.75em; background: var(--background-modifier-border); padding: 1px 4px; border-radius: 3px; color: ${scoreColor}; cursor: help;`,
      },
    });
    if (work.url) {
      info.createEl("a", {
        text: L("sourceLabel"),
        href: work.url,
        attr: { style: "font-size: 0.8em;" },
      });
    }
  }

  const instructionsDiv = contentEl.createDiv({
    attr: { style: "margin-top: 12px; margin-bottom: 12px;" },
  });
  instructionsDiv.createEl("div", {
    text: L("extraInstructions"),
    attr: {
      style: "font-weight: 600; margin-bottom: 4px;",
    },
  });
  const ta = instructionsDiv.createEl("textarea", {
    placeholder: L("extraInstructionsDesc"),
    attr: {
      style:
        "width: 100%; min-height: 60px; font-size: 0.9em;",
    },
  });
  ta.value = instructions;
  ta.oninput = () => onInstructionsChange(ta.value);

  if (generating) {
    contentEl.createEl("button", {
      text: L("generating"),
      cls: "mod-cta",
      attr: { style: "width: 100%; opacity: 0.6;" },
    }).setAttr("disabled", "true");
  } else {
    contentEl.createEl("button", {
      text:
        mode === "quick"
          ? L("generateQuick")
          : L("generateFull"),
      cls: "mod-cta",
      attr: { style: "width: 100%;" },
    }).onclick = () => onGenerate();
  }
}
