import { App, Modal, Setting } from "obsidian";
import type { ChangelogEntry } from "./changelog";
import { CHANGELOG } from "./changelog";

export class WhatsNewModal extends Modal {
    private fromVersion: string;

    constructor(app: App, fromVersion: string) {
        super(app);
        this.fromVersion = fromVersion;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("supsync-whats-new");

        const newEntries = this.getNewEntries();
        if (newEntries.length === 0) {
            this.close();
            return;
        }

        contentEl.createEl("h2", { text: "What's New" });
        contentEl.createEl("p", {
            text: `Version ${CHANGELOG[0].version}`,
            cls: "supsync-whats-new-subtitle",
        });

        for (const entry of newEntries) {
            const section = contentEl.createDiv("supsync-whats-new-version");
            const header = section.createDiv("supsync-whats-new-header");
            header.createEl("span", { text: `v${entry.version}`, cls: "supsync-whats-new-version-tag" });
            header.createEl("span", { text: entry.date, cls: "supsync-whats-new-date" });

            const list = section.createEl("ul");
            for (const change of entry.changes) {
                const li = list.createEl("li");
                const badge = li.createSpan({
                    cls: `supsync-whats-new-badge supsync-badge-${change.type}`,
                });
                const labels: Record<string, string> = { feature: "New", fix: "Fix", improvement: "Improvement" };
                badge.textContent = labels[change.type] || change.type;
                li.createSpan({ text: ` ${change.text}` });
            }
        }

        new Setting(contentEl)
            .addButton((btn) =>
                btn.setButtonText("Got it").setCta().onClick(() => this.close()),
            );
    }

    private getNewEntries(): ChangelogEntry[] {
        if (!this.fromVersion) {
            return CHANGELOG.slice(0, 3);
        }

        const idx = CHANGELOG.findIndex((e) => e.version === this.fromVersion);
        if (idx === -1) {
            return CHANGELOG.slice(0, 3);
        }
        return CHANGELOG.slice(0, idx);
    }

    onClose(): void {
        this.contentEl.empty();
    }
}
