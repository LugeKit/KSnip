export interface ShortcutSetting {
    shortcuts: Record<string, Shortcut>;
}

export class Shortcut {
    id: string;
    keys: string[];
    enabled: boolean;
    globalF: (() => void) | null;

    constructor(id: string, keys: string[], enabled: boolean, globalF: (() => void) | null) {
        this.id = id;
        this.keys = keys;
        this.enabled = enabled;
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
