export interface ShortcutSetting {
    shortcuts: Record<string, Shortcut>;
}

export type Page = "screenshot" | "basic";

export class Shortcut {
    id: string;
    keys: string[];
    enabled: boolean;
    page: Page;
    name: string;
    globalF: (() => void) | null;

    constructor(id: string, keys: string[], enabled: boolean, page: Page, name: string, globalF: (() => void) | null) {
        this.id = id;
        this.keys = keys;
        this.enabled = enabled;
        this.page = page;
        this.name = name;
        this.globalF = globalF;
    }

    toJSON() {
        return {
            id: this.id,
            keys: this.keys,
            enabled: this.enabled,
        };
    }
}
