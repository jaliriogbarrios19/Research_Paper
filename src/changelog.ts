export interface ChangelogEntry {
    version: string;
    date: string;
    changes: {
        type: "feature" | "fix" | "improvement";
        text: string;
    }[];
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "0.4.6",
        date: "2026-06-14",
        changes: [
            { type: "feature", text: "What's New modal — shows changelog on plugin update" },
        ],
    },
];
