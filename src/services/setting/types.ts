export interface StoredSetting {
    settings: Record<string, Setting>;
}

export class Setting {
    id: string;
    name: string;
    description: string;
    type: SettingType;
    value: SettingValue;

    constructor(id: string, name: string, description: string, type: SettingType, value: SettingValue) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type;
        this.value = value;
    }

    toJSON() {
        return {
            id: this.id,
            value: this.value,
        };
    }
}

type SettingType = "Boolean" | "Path";

export class SettingValueBoolean {
    value: boolean;

    constructor(value: boolean) {
        this.value = value;
    }
}

export class SettingValuePath {
    path: string;

    constructor(path: string) {
        this.path = path;
    }
}

export type SettingValue = SettingValueBoolean | SettingValuePath;
