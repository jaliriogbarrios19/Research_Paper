import { App, PluginSettingTab, Setting, requestUrl } from "obsidian";
import type ResearchAndPaperPlugin from "../main";
import { LLMProvider, LLM_PROVIDERS, LLM_MODELS } from "./types";
import { t, type LocaleStrings } from "./locales";

export interface PluginSettings {
  llmProvider: LLMProvider;
  openaiApiKey: string;
  openaiModel: string;
  anthropicApiKey: string;
  anthropicModel: string;
  deepseekApiKey: string;
  deepseekModel: string;
  geminiApiKey: string;
  geminiModel: string;
  openrouterApiKey: string;
  openrouterModel: string;
  grokApiKey: string;
  grokModel: string;
  glmApiKey: string;
  glmModel: string;
  spobApiKey: string;
  spobModel: string;
  spobBaseUrl: string;
  pubmedApiKey: string;
  crossrefEmail: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  llmProvider: "spob",
  openaiApiKey: "",
  openaiModel: "gpt-5.5",
  anthropicApiKey: "",
  anthropicModel: "claude-opus-4-7",
  deepseekApiKey: "",
  deepseekModel: "deepseek-v4-pro",
  geminiApiKey: "",
  geminiModel: "gemini-2.5-pro",
  openrouterApiKey: "",
  openrouterModel: "openai/gpt-5.5",
  grokApiKey: "",
  grokModel: "grok-4.3",
  glmApiKey: "",
  glmModel: "glm-4-plus",
  spobApiKey: "",
  spobModel: "deepseek-v4-pro",
  spobBaseUrl: "https://spob-backend.fly.dev",
  pubmedApiKey: "",
  crossrefEmail: "",
};

const API_KEY_FIELDS: Record<LLMProvider, keyof PluginSettings> = {
  openai: "openaiApiKey",
  anthropic: "anthropicApiKey",
  deepseek: "deepseekApiKey",
  gemini: "geminiApiKey",
  openrouter: "openrouterApiKey",
  grok: "grokApiKey",
  glm: "glmApiKey",
  spob: "spobApiKey",
};

const MODEL_FIELDS: Record<LLMProvider, keyof PluginSettings> = {
  openai: "openaiModel",
  anthropic: "anthropicModel",
  deepseek: "deepseekModel",
  gemini: "geminiModel",
  openrouter: "openrouterModel",
  grok: "grokModel",
  glm: "glmModel",
  spob: "spobModel",
};

export function getApiKeyField(provider: LLMProvider): keyof PluginSettings {
  return API_KEY_FIELDS[provider];
}

export function getModelField(provider: LLMProvider): keyof PluginSettings {
  return MODEL_FIELDS[provider];
}

let spobBaseUrl = "https://spob-backend.fly.dev";

export function getSpobBaseUrl(): string {
  return spobBaseUrl;
}

export function setSpobBaseUrl(url: string): void {
  spobBaseUrl = url;
}

export class SettingsTab extends PluginSettingTab {
  plugin: ResearchAndPaperPlugin;

  constructor(app: App, plugin: ResearchAndPaperPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const L = (k: keyof LocaleStrings) => t(k, this.plugin.getLocale());

    new Setting(containerEl).setName("Research and Paper").setHeading();

    this.addSpobBanner(containerEl);

    new Setting(containerEl)
      .setName(L("providerLabel"))
      .setDesc("Proveedor de IA para generar briefs de investigación")
      .addDropdown((dropdown) => {
        for (const { value, label } of LLM_PROVIDERS) {
          dropdown.addOption(value, label);
        }
        dropdown
          .setValue(this.plugin.settings.llmProvider)
          .onChange(async (v: string) => {
            this.plugin.settings.llmProvider = v as LLMProvider;
            await this.plugin.saveSettings();
            this.display();
          });
      });

    const provider = this.plugin.settings.llmProvider;
    const meta = LLM_PROVIDERS.find((p) => p.value === provider);

    if (meta) {
      const field = getApiKeyField(meta.value);
      this.addApiKeyField(containerEl, `${meta.label} API Key`, field);

      const models = LLM_MODELS[provider];
      if (models && models.length > 0) {
        const modelField = getModelField(provider);
        new Setting(containerEl)
          .setName("Modelo")
          .setDesc("Modelo de IA a usar para generar briefs")
          .addDropdown((dropdown) => {
            for (const m of models) {
              dropdown.addOption(m.modelId, `${m.label} — ${m.description}`);
            }
            dropdown
              .setValue(
                String(
                  this.plugin.settings[modelField] ?? models[0].modelId
                )
              )
              .onChange(async (v: string) => {
                (this.plugin.settings as unknown as Record<string, string>)[
                  modelField
                ] = v;
                await this.plugin.saveSettings();
              });
          });
      }
    }

    if (provider === "spob") {
      new Setting(containerEl)
        .setName("spob Backend URL")
        .setDesc("URL del servidor spob (por defecto localhost:8080)")
        .addText((text) => {
          text
            .setPlaceholder("http://localhost:8080")
            .setValue(this.plugin.settings.spobBaseUrl)
            .onChange(async (value) => {
              this.plugin.settings.spobBaseUrl = value;
              await this.plugin.saveSettings();
            });
        });

      new Setting(containerEl)
        .setName("Probar conexión")
        .setDesc("Verifica que la API key de spob funciona")
        .addButton((btn) =>
          btn.setButtonText("Probar").onClick(() => {
            void (async () => {
            btn.setDisabled(true);
            btn.setButtonText("Probando...");
            const key = this.plugin.settings.spobApiKey;
            const url = this.plugin.settings.spobBaseUrl || "https://spob-backend.fly.dev";
            let ok = false;
            if (key) {
              try {
                const res = await requestUrl({ url: `${url}/health`, headers: { Authorization: `Bearer ${key}` } });
                ok = res.status >= 200 && res.status < 300;
              } catch { /* offline */ }
            }
            btn.setButtonText(ok ? "✓ Conectado" : "✗ Falló");
            window.setTimeout(() => btn.setButtonText("Probar"), 3000);
            btn.setDisabled(false);
            })();
          })
        );
    }

    new Setting(containerEl).setName("Bases de datos académicas").setHeading();

    new Setting(containerEl)
      .setName("PubMed API Key")
      .setDesc("Opcional. Aumenta el rate limit de 3 a 10 requests/segundo.")
      .addText((text) => {
        text
          .setPlaceholder("API key de NCBI")
          .setValue(this.plugin.settings.pubmedApiKey)
          .onChange(async (value) => {
            this.plugin.settings.pubmedApiKey = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Crossref Email")
      .setDesc("Email para el polite pool de Crossref. Requerido para verificación de DOIs.")
      .addText((text) => {
        text
          .setPlaceholder("tu@email.com")
          .setValue(this.plugin.settings.crossrefEmail)
          .onChange(async (value) => {
            this.plugin.settings.crossrefEmail = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl).setName(L("apiKeysLabel")).setHeading();

    for (const { value, label } of LLM_PROVIDERS) {
      const field = getApiKeyField(value);
      this.addApiKeyField(containerEl, label, field);
      if (value === "spob") {
        const spobLink = containerEl.createDiv({
          cls: "setting-item-description",
          attr: { style: "margin-top: -8px; margin-bottom: 16px;" },
        });
        spobLink.createEl("a", {
          text: "Obtén tu API key en spob-backend.fly.dev →",
          href: "https://spob-backend.fly.dev",
        });
      }
    }

    const support = containerEl.createDiv({
      attr: {
        style:
          "margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--background-modifier-border); text-align: center;",
      },
    });
    support.createEl("a", {
      text: L("supportLabel"),
      href: "https://paypal.me/jesusgarciapsi",
    });
  }

  private addSpobBanner(container: HTMLElement): void {
    const banner = container.createDiv({
      attr: {
        style:
          "background: var(--background-modifier-border); border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; font-size: 0.92rem; line-height: 1.6;",
      },
    });
    const locale = this.plugin.getLocale();
    banner.createEl("p", { text: t("spobBanner", locale) });
    const links = banner.createDiv({ attr: { style: "margin-top: 10px; display: flex; gap: 16px;" } });
    links.createEl("a", {
      text: "☕ Donar vía PayPal",
      href: "https://paypal.me/jesusgarciapsi",
    });
    links.createEl("a", {
      text: "🚀 Servicios SPOB",
      href: "https://spob-backend.fly.dev",
    });
  }

  private addApiKeyField(
    container: HTMLElement,
    name: string,
    key: keyof PluginSettings
  ): void {
    new Setting(container).setName(name).addText((text) => {
      text
        .setPlaceholder("Ingresá tu API key")
        .setValue(String(this.plugin.settings[key] ?? ""));
      text.inputEl.type = "password";

      const toggleBtn = text.inputEl.parentElement?.createEl("button", {
        text: "Mostrar",
        cls: "research-paper-toggle-key",
      });
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          const isPassword = text.inputEl.type === "password";
          text.inputEl.type = isPassword ? "text" : "password";
          toggleBtn.textContent = isPassword ? "Ocultar" : "Mostrar";
        };
      }

      text.onChange(async (value) => {
        (this.plugin.settings as unknown as Record<string, string>)[key] =
          value;
        await this.plugin.saveSettings();
      });
    });
  }
}
