import { Editor, MarkdownView, Notice, Plugin, moment } from "obsidian";
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

  getLocale(): "es" | "en" {
    return moment.locale().startsWith("es") ? "es" : "en";
  }

  private L(key: keyof LocaleStrings): string {
    return t(key, this.getLocale());
  }

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SettingsTab(this.app, this));

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
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    setSpobBaseUrl(this.settings.spobBaseUrl || "http://localhost:8080");
  }

  async saveSettings() {
    await this.saveData(this.settings);
    setSpobBaseUrl(this.settings.spobBaseUrl || "http://localhost:8080");
  }

  getApiKey(provider: LLMProvider): string {
    const field = getApiKeyField(provider);
    return (this.settings as unknown as Record<string, string>)[field] ?? "";
  }
}
