import FeaturesState from './features_state.json';
import { Console, StorageSync, sendRuntimeMessage } from './src/utils/browser.js';
import { MESSAGE_ACTION } from './src/utils/messaging.js';

export const baseSettings = {
    configurationVersion: 1,
    toastMode: 'ui',
    toastType: JSON.stringify({
        info: false,
        warning: true,
        danger: true,
        success: false,
    }),

    // [LIMITATION] Object is loaded by default even if values exists - 'https://www.odoo.com': {},
    originsFilterOrigins: {},
    windowActionFallbacks: {
        // 'https://www.odoo.com': {
        //     'my-tasks': 'project.task',
        //     'all-tasks': 'project.task',
        // },
    },

    supportedVersions: ['18.0'],
    supportedDevVersions: [],

    // Experimental
    developerMode: false,
    useSimulatedUI: false,
    omniboxFocusCurrentTab: false,
    cacheEncodingBase64: true,
};

export const extensionFeatureState = FeaturesState;
const activeFeaturesList = Object.keys(FeaturesState).filter((k) => FeaturesState[k]);

export let features = [];
export async function loadFeaturesConfiguration() {
    features = await Promise.all(activeFeaturesList.map((f) => importFeatureConfigurationFile(f)));
    Console.info(features);
}

export function importFeatureConfigurationFile(featureID) {
    return import(`./src/features/${featureID}/configuration.js`).then((f) => f.default);
}

export function importFeatureContentFile(featureID) {
    return import(`./src/features/${featureID}/content.js`).then((f) => new f.default());
}

export function importFeatureBackgroundTriggerFile(featureID) {
    return import(`./src/features/${featureID}/background_trigger.js`).then((f) => new f.default());
}

export function importFeatureBackgroundFile(featureID) {
    return import(`./src/features/${featureID}/background.js`).then((f) => new f.default());
}

export function importFeatureOptionFile(featureID) {
    return import(`./src/features/${featureID}/option.js`).then((f) => new f.default());
}

export function importFeatureCustomizationFile(featureID) {
    return import(`./src/features/${featureID}/option_customization.js`).then((f) => new f.default());
}

export function importFeaturePopupFile(featureID) {
    return import(`./src/features/${featureID}/popup.js`).then((f) => new f.default());
}

export function importMigratorFile(fromVersion) {
    return import(`./options/migration/migrator/migrate_${fromVersion}.js`).then((f) => f.default);
}

export async function getFeaturesAndCurrentSettings() {
    const response = await sendRuntimeMessage(MESSAGE_ACTION.TO_BACKGROUND.GET_FEATURES_LIST);
    const features = response.features;

    const configuration = await getCurrentSettings(features);
    return { features: features, currentSettings: configuration };
}

export async function getCurrentSettings(features) {
    const defaultSettings = features.reduce((acc, obj) => {
        return Object.assign(acc, obj.defaultSettings);
    }, {});

    const settings = await StorageSync.get({
        ...baseSettings,
        ...defaultSettings,
    });
    return settings;
}
