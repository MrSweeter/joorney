//#region Joorney
declare namespace Configuration {
    type Feature = {
        id: string;
        display_name: string;
        icon: Array<string>;
        trigger: Configuration.FeatureTrigger;
        customization: Configuration.FeatureCustomization;
        defaultSettings: object;
        supported_version?: Array<string>;
        limited?: boolean;
    };
    type FeatureTrigger = { load: boolean; navigate: boolean };
    type FeatureCustomization = { popup: boolean; option: boolean };
}

declare namespace Toast {
    type Collection = { [id: string]: { id: NodeJS.Timeout; msg: string } };

    type Manager = {
        toastMode: ToastMode;
        load: () => Promise<void>;
        isUI: () => boolean;
        info: (feature: string, title: string, message: string) => void;
        warn: (feature: string, title: string, message: string) => void;
        error: (feature: string, title: string, message: string) => void;
        success: (feature: string, title: string, message: string) => void;
        _notify: (feature: string, title: string, message: string, type: ToastType) => void;
        _logs: (feature: string, title: string, message: string, type: ToastType) => void;
        _show: (toastID: string) => NodeJS.Timeout;
        _hide: (toastID: string) => void;
    };
}
//#endregion

//#region Odoo
type GuessVersion = { isOdoo: boolean; version?: string };

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
//#endregion

//#region Combine
type UnsafeURL = URL | string;
type NullUndefined = undefined | null;
//#endregion
