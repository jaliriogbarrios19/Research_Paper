import { App, Editor, Modal, Notice, Setting } from "obsidian";
import type ResearchAndPaperPlugin from "../main";
import { AcademicWork, ResearchDomain } from "./types";
import { t, type LocaleStrings } from "./locales";
import {
  searchAcademic,
  generatePaper,
  formatPaper,
  verifyDOIs,
} from "./research-engine";
import { getModelField } from "./settings";

export class ResearchModal extends Modal {
  private plugin: ResearchAndPaperPlugin;
  private editor: Editor;
  private query = "";
  private mode: "quick" | "full" = "quick";
  private domain: ResearchDomain = "psychology";
  private paperLanguage = "es";
  private highPrecision = false;
  private loading = false;
  private generating = false;
  private results: AcademicWork[] = [];
  private selectedCheckboxes: HTMLInputElement[] = [];
  private instructions = "";
  private error: string | null = null;

  constructor(app: App, plugin: ResearchAndPaperPlugin, editor: Editor) {
    super(app);
    this.plugin = plugin;
    this.editor = editor;
  }

  private L(key: keyof LocaleStrings): string {
    return t(key, this.plugin.getLocale());
  }

  onOpen() {
    this.render();
  }

  private render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("research-paper-modal");

    contentEl.createEl("h2", { text: this.L("searchLabel") });

    const searchRow = contentEl.createDiv({
      attr: { style: "display: flex; gap: 8px; margin-bottom: 12px;" },
    });
    const input = searchRow.createEl("input", {
      type: "text",
      placeholder: this.L("searchPlaceholder"),
      attr: { style: "flex: 1;" },
    });
    input.value = this.query;
    input.oninput = () => (this.query = input.value);
    input.onkeydown = (e) => {
      if (e.key === "Enter") this.handleSearch();
    };

    searchRow.createEl("button", {
      text: "Buscar",
      cls: "mod-cta",
    }).onclick = () => this.handleSearch();

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
        d.addOption("general", this.L("domainGeneral"));
        d.setValue(this.domain).onChange(
          (v) => (this.domain = v as ResearchDomain)
        );
      })

    new Setting(optionsRow)
      .setName(this.L("modeLabel"))
      .addDropdown((d) =>
        d
          .addOption("quick", this.L("quickAnswer"))
          .addOption("full", this.L("fullPaper"))
          .setValue(this.mode)
          .onChange((v) => (this.mode = v as typeof this.mode))
      );

    new Setting(optionsRow)
      .setName(this.L("highPrecisionLabel"))
      .addToggle((t) =>
        t
          .setValue(this.highPrecision)
          .onChange((v) => (this.highPrecision = v))
      );

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
          .setValue(this.paperLanguage)
          .onChange(
            (v) =>
              (this.paperLanguage = v)
          )
      );

    if (this.loading) {
      contentEl.createDiv({
        text: this.L("searching"),
        attr: {
          style:
            "padding: 16px; text-align: center; color: var(--text-muted);",
        },
      });
    }

    if (this.error) {
      const errDiv = contentEl.createDiv({
        attr: {
          style:
            "background: var(--background-modifier-error); color: var(--text-error); padding: 8px 12px; border-radius: 4px; margin-bottom: 8px;",
        },
      });
      errDiv.createEl("strong", { text: this.L("searchError") });
      errDiv.createEl("p", { text: this.error });
    }

    if (this.results.length > 0) {
      contentEl.createDiv({
        text: this.L("selectPapers"),
        attr: {
          style:
            "font-weight: 600; margin-bottom: 8px; padding-top: 8px; border-top: 1px solid var(--background-modifier-border);",
        },
      });

      this.selectedCheckboxes = [];

      for (const work of this.results.slice(0, 10)) {
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
        cb.checked = true;
        this.selectedCheckboxes.push(cb);

        const info = row.createDiv({ attr: { style: "flex: 1;" } });
        info.createEl("div", {
          text: work.title,
          attr: { style: "font-weight: 600; margin-bottom: 2px;" },
        });
        info.createEl("div", {
          text: `${work.year} · ${work.journal}`,
          attr: { style: "font-size: 0.85em; color: var(--text-muted);" },
        });
        if (work.url) {
          info.createEl("a", {
            text: this.L("sourceLabel"),
            href: work.url,
            attr: { style: "font-size: 0.8em;" },
          });
        }
      }

      const instructionsDiv = contentEl.createDiv({
        attr: { style: "margin-top: 12px; margin-bottom: 12px;" },
      });
      instructionsDiv.createEl("div", {
        text: this.L("extraInstructions"),
        attr: {
          style: "font-weight: 600; margin-bottom: 4px;",
        },
      });
      const ta = instructionsDiv.createEl("textarea", {
        placeholder: this.L("extraInstructionsDesc"),
        attr: {
          style:
            "width: 100%; min-height: 60px; font-size: 0.9em;",
        },
      });
      ta.value = this.instructions;
      ta.oninput = () => (this.instructions = ta.value);

      if (this.generating) {
        contentEl.createEl("button", {
          text: this.L("generating"),
          cls: "mod-cta",
          attr: { style: "width: 100%; opacity: 0.6;" },
        }).setAttr("disabled", "true");
      } else {
        contentEl.createEl("button", {
          text:
            this.mode === "quick"
              ? this.L("generateQuick")
              : this.L("generateFull"),
          cls: "mod-cta",
          attr: { style: "width: 100%;" },
        }).onclick = () => this.handleGenerate();
      }
    }
  }

  private async handleSearch() {
    if (!this.query.trim()) return;

    this.loading = true;
    this.error = null;
    this.results = [];
    this.instructions = "";
    this.render();

    try {
      this.results = await searchAcademic(
        this.query,
        this.highPrecision,
        this.plugin.settings.pubmedApiKey,
        this.plugin.settings.crossrefEmail
      );
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private async handleGenerate() {
    if (this.generating) return; // Prevent double-clicks

    const provider = this.plugin.settings.llmProvider;
    const apiKey = this.plugin.getApiKey(provider);
    if (!apiKey) {
      this.error = `${this.L("noApiKey")} ${provider}`;
      this.render();
      return;
    }

    const modelField = getModelField(provider);
    const model =
      (this.plugin.settings as unknown as Record<string, string>)[modelField] ||
      undefined;

    const selected = this.results
      .slice(0, this.selectedCheckboxes.length)
      .filter((_, i) => this.selectedCheckboxes[i]?.checked);

    if (selected.length === 0) {
      this.error = "Seleccioná al menos un paper.";
      this.render();
      return;
    }

    this.generating = true;
    this.render();

    try {
      const raw = await generatePaper(
        provider,
        apiKey,
        model,
        this.query,
        selected,
        this.domain,
        this.mode,
        this.paperLanguage,
        this.instructions
      );

      const verified = await verifyDOIs(
        raw,
        this.plugin.settings.crossrefEmail
      );

      const formatted = formatPaper(verified, this.mode);
      this.editor.replaceRange(formatted, this.editor.getCursor());

      new Notice(`✓ ${this.L("generationReady")}`);
      this.close();
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
      this.generating = false;
      this.render();
      new Notice(`✗ ${this.L("generationFailed")}: ${this.error}`);
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
