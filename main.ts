import { Editor, MarkdownView, Notice, Plugin, moment, requestUrl } from "obsidian";
import {
  PluginSettings,
  DEFAULT_SETTINGS,
  SettingsTab,
  getApiKeyField,
  setSpobBaseUrl,
} from "./src/settings";
import { ResearchModal } from "./src/research-modal";
import { LLMProvider, AcademicWork } from "./src/types";
import { t, type LocaleStrings } from "./src/locales";
import { searchAcademic, generateBrief, verifyDOIs } from "./src/research-engine";

export default class ResearchAndPaperPlugin extends Plugin {
  settings!: PluginSettings;
  private statusBarItemEl: HTMLElement | null = null;

  getLocale(): "es" | "en" {
    return moment.locale().startsWith("es") ? "es" : "en";
  }

  private L(key: keyof LocaleStrings): string {
    return t(key, this.getLocale());
  }

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SettingsTab(this.app, this));

    this.statusBarItemEl = this.addStatusBarItem();

    this.addRibbonIcon("search", "Research and Paper", () => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) {
        new Notice(this.L("openNoteFirst"));
        return;
      }
      new ResearchModal(this.app, this, view.editor).open();
    });

    this.addCommand({
      id: "research-and-paper",
      name: "Research and Paper: buscar y generar",
      editorCallback: (editor: Editor) => {
        new ResearchModal(this.app, this, editor).open();
      },
    });

    this.updateCredits();
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    setSpobBaseUrl(this.settings.spobBaseUrl || "http://localhost:8080");
  }

  async saveSettings() {
    await this.saveData(this.settings);
    setSpobBaseUrl(this.settings.spobBaseUrl || "http://localhost:8080");
    this.updateCredits();
  }

  getApiKey(provider: LLMProvider): string {
    const field = getApiKeyField(provider);
    return (this.settings as unknown as Record<string, string>)[field] ?? "";
  }

  updateCredits() {
    const s = this.settings;
    if (s.llmProvider !== "spob" || !s.spobApiKey) {
      if (this.statusBarItemEl) this.statusBarItemEl.setText("");
      return;
    }
    const baseUrl = s.spobBaseUrl || "https://spob-backend.fly.dev";
    requestUrl({
      url: `${baseUrl}/me`,
      headers: { Authorization: `Bearer ${s.spobApiKey}` },
    })
      .then((res) => {
        if (res.status !== 200) return;
        const data = res.json as { credits?: number };
        if (data.credits != null && this.statusBarItemEl) {
          this.statusBarItemEl.setText(`spob: $${Number(data.credits).toFixed(4)}`);
        }
      })
      .catch(() => {});
  }
}
