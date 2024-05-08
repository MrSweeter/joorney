import FeaturesState from './features_state.json';
import { Runtime, StorageSync } from './src/utils/browser.js';
import { MESSAGE_ACTION } from './src/utils/messaging.js';

export const baseSettings = {
    configurationVersion: 1,

    // [LIMITATION] Object is loaded by default even if values exists - 'https://www.odoo.com': {},
    originsFilterOrigins: {},

    supportedVersions: ['17.0'],
};

const activeFeaturesList = Object.keys(FeaturesState).filter((k) => FeaturesState[k]);

export let features = [];
export async function loadFeaturesConfiguration() {
    features = await Promise.all(activeFeaturesList.map((f) => importFeatureConfigurationFile(f)));
    console.info(features);
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
    const response = await Runtime.sendMessage({
        action: MESSAGE_ACTION.GET_FEATURES_LIST,
    });
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
