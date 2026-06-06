import { App, Editor, Modal, Setting } from "obsidian";
import type ResearchAndPaperPlugin from "../main";
import { ResearchDomain } from "./types";
import { t, type LocaleStrings } from "./locales";
import { renderResults } from "./render-results";
import { handleSearch, handleGenerate, ModalState } from "./modal-handlers";

export class ResearchModal extends Modal {
  private plugin: ResearchAndPaperPlugin;
  private editor: Editor;
  state: ModalState;

  constructor(app: App, plugin: ResearchAndPaperPlugin, editor: Editor) {
    super(app);
    this.plugin = plugin;
    this.editor = editor;
    this.state = {
      plugin,
      query: "",
      domain: "general",
      paperLanguage: "es",
      mode: "quick",
      yearRange: 10,
      highPrecision: false,
      deepSearch: false,
      instructions: "",
      results: [],
      selectedIndices: new Set(),
      optimizedQuery: "",
      iterationStatus: "",
      generating: false,
      loading: false,
      optimizing: false,
      error: null,
    };
  }

  private L(key: keyof LocaleStrings): string {
    return t(key, this.plugin.getLocale());
  }

  onOpen() {
    const bg = this.modalEl?.previousElementSibling;
    if (bg) {
      bg.addEventListener("click", (e: Event) => {
        if (this.state.generating || this.state.loading || this.state.optimizing) {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);
    }

    this.render();
  }

  close() {
    if (this.state.generating || this.state.loading || this.state.optimizing) {
      const confirmed = window.confirm(
        "¿Desea detener el proceso? Se perderá el progreso."
      );
      if (!confirmed) return;
      this.state.generating = false;
      this.state.loading = false;
      this.state.optimizing = false;
    }
    super.close();
  }

  private render() {
    const { contentEl } = this;
    const s = this.state;
    contentEl.empty();
    contentEl.addClass("research-paper-modal");

    contentEl.createEl("h2", { text: this.L("searchNatural") });

    const searchRow = contentEl.createDiv({
      attr: { style: "display: flex; gap: 8px; margin-bottom: 12px;" },
    });
    const input = searchRow.createEl("input", {
      type: "text",
      placeholder: this.L("searchPlaceholder"),
      attr: { style: "flex: 1;" },
    });
    input.value = s.query;
    input.oninput = () => (s.query = input.value);
    input.onkeydown = (e) => {
      if (e.key === "Enter") { void this.doSearch(); }
    };

    const btnText =
      s.domain === "bahai" && !s.generating
        ? this.L("generateFull")
        : "Buscar";
    searchRow.createEl("button", {
      text: btnText,
      cls: "mod-cta",
    }).onclick = () => this.doSearch();

    if (s.optimizedQuery && s.domain !== "bahai") {
      contentEl.createDiv({
        text: `${this.L("optimizedQuery")}: ${s.optimizedQuery}`,
        attr: {
          style:
            "font-size: 0.85em; color: var(--text-accent); margin-bottom: 8px;",
        },
      });
    }

    const optionsRow = contentEl.createDiv({
      attr: {
        style: "display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;",
      },
    });

    new Setting(optionsRow)
      .setName(this.L("domainLabel"))
      .addDropdown((d) => {
        d.addOption("psychology", this.L("domainPsychology"));
        d.addOption("medicine", this.L("domainMedicine"));
        d.addOption("nursing", this.L("domainNursing"));
        d.addOption("biology", this.L("domainBiology"));
        d.addOption("education", this.L("domainEducation"));
        d.addOption("sociology", this.L("domainSociology"));
        d.addOption("economics", this.L("domainEconomics"));
        d.addOption("law", this.L("domainLaw"));
        d.addOption("engineering", this.L("domainEngineering"));
        d.addOption("bahai", this.L("domainBahai"));
        d.addOption("general", this.L("domainGeneral"));
        d.setValue(s.domain).onChange(
          (v) => {
            s.domain = v as ResearchDomain;
            s.results = [];
            s.selectedIndices = new Set();
            s.optimizedQuery = "";
            this.render();
          }
        );
      });

    if (s.domain !== "bahai") {
      new Setting(optionsRow)
        .setName(this.L("modeLabel"))
        .addDropdown((d) =>
          d
            .addOption("quick", this.L("quickAnswer"))
            .addOption("full", this.L("fullPaper"))
            .setValue(s.mode)
            .onChange((v) => (s.mode = v as typeof s.mode))
        );

      new Setting(optionsRow)
        .setName("Años")
        .addDropdown((d) =>
          d
            .addOption("0", "Todos")
            .addOption("3", "Últimos 3")
            .addOption("5", "Últimos 5")
            .addOption("10", "Últimos 10")
            .addOption("20", "Últimos 20")
            .setValue(String(s.yearRange))
            .onChange((v) => (s.yearRange = Number(v)))
        );

      new Setting(optionsRow)
        .setName(this.L("highPrecisionLabel"))
        .addToggle((t) =>
          t
            .setValue(s.highPrecision)
            .onChange((v) => (s.highPrecision = v))
        );

      new Setting(optionsRow)
        .setName("Deep search")
        .addToggle((t) =>
          t
            .setValue(s.deepSearch)
            .onChange((v) => (s.deepSearch = v))
        );
    }

    new Setting(optionsRow)
      .setName(this.L("paperLanguageLabel"))
      .addDropdown((d) =>
        d
          .addOption("es", this.L("langSpanish"))
          .addOption("en", this.L("langEnglish"))
          .addOption("pt", this.L("langPortuguese"))
          .addOption("fr", this.L("langFrench"))
          .addOption("de", this.L("langGerman"))
          .addOption("it", this.L("langItalian"))
          .setValue(s.paperLanguage)
          .onChange((v) => (s.paperLanguage = v))
      );

    if (s.optimizing) {
      contentEl.createDiv({
        text: this.L("optimizingQuery"),
        attr: {
          style:
            "padding: 16px; text-align: center; color: var(--text-accent);",
        },
      });
    } else if (s.loading && s.domain !== "bahai") {
      contentEl.createDiv({
        text: s.deepSearch
          ? s.iterationStatus || "Deep searching..."
          : this.L("searching"),
        attr: {
          style:
            "padding: 16px; text-align: center; color: var(--text-muted);",
        },
      });
    } else if (s.generating && s.domain === "bahai") {
      contentEl.createDiv({
        text: this.L("bahaiGenerating"),
        attr: {
          style:
            "padding: 16px; text-align: center; color: var(--text-accent); font-weight: 600;",
        },
      });
    }

    if (s.error) {
      const errDiv = contentEl.createDiv({
        attr: {
          style:
            "background: var(--background-modifier-error); color: var(--text-error); padding: 8px 12px; border-radius: 4px; margin-bottom: 8px;",
        },
      });
      errDiv.createEl("strong", { text: this.L("searchError") });
      errDiv.createEl("p", { text: s.error });
    }

    if (s.results.length > 0 && s.domain !== "bahai") {
      renderResults(contentEl, {
        L: (k) => this.L(k),
        results: s.results,
        selectedIndices: s.selectedIndices,
        onToggle: (idx) => {
          if (s.selectedIndices.has(idx)) {
            s.selectedIndices.delete(idx);
          } else {
            s.selectedIndices.add(idx);
          }
        },
        instructions: s.instructions,
        onInstructionsChange: (v) => (s.instructions = v),
        generating: s.generating,
        mode: s.mode,
        onGenerate: () => { void this.doGenerate(); },
      });
    }
  }

  private async doSearch() {
    await handleSearch(this.state, () => this.render());
    if (this.state.domain === "bahai") {
      await this.doGenerate();
    }
  }

  private async doGenerate() {
    await handleGenerate(
      this.state,
      this.editor,
      () => this.close(),
      () => this.render()
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
