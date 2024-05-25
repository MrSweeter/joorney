type GuessVersion = { isOdoo: boolean; version?: string };

type JoorneyFeature = {
    id: string;
    display_name: string;
    icon: Array<string>;
    trigger: JFeatureTrigger;
    customization: JFeatureCustomization;
    defaultSettings: object;
    supported_version: Array<string>;
};
type JFeatureTrigger = { load: boolean; navigate: boolean };
type JFeatureCustomization = { popup: boolean; option: boolean };

type URLState = {
    action: string | number | NullUndefined;
    view_type: string | NullUndefined;
    resId: number | 'new' | NullUndefined;
    active_id: number | NullUndefined;
    model: string | NullUndefined;
    actionWindow: WindowAction | NullUndefined;
};

type ModelID = {
    model: string | NullUndefined;
    resId: number;
};

type WindowAction = { id: number };

type UnsafeURL = URL | string;
type NullUndefined = undefined | null;
