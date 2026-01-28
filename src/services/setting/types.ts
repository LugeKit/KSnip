export interface StoredSetting {
    settings: Record<string, Setting>;
}

export class Setting {
    id: string;
    name: string;
    description: string;
    type: SettingType;
    value: SettingValue

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
            value: JSON.stringify(this.value)
        }
    }
}

type SettingType = "Boolean" | "Path";

export interface SettingTypeBoolean {
    value: boolean;
}

export interface SettingTypePath {
    path: string;
}

export type SettingValue = SettingTypeBoolean | SettingTypePath;
