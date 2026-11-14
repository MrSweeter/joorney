import backgroundLoaders from 'virtual:joorney-features/background';
import backgroundTriggerLoaders from 'virtual:joorney-features/background_trigger';
import configurationLoaders from 'virtual:joorney-features/configuration';
import contentLoaders from 'virtual:joorney-features/content';
import optionLoaders from 'virtual:joorney-features/option';
import optionCustomizationLoaders from 'virtual:joorney-features/option_customization';
import popupLoaders from 'virtual:joorney-features/popup';
import FeaturesState from 'virtual:joorney-features/state';
import { Console, StorageSync, sendRuntimeMessage } from './src/utils/browser.js';
import { MESSAGE_ACTION } from './src/utils/messaging.js';

export const baseSettings = {
    configurationVersion: 2,
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

    supportedVersions: ['20.0'],
    supportedDevVersions: [],

    // Experimental
    developerMode: false,
    useSimulatedUI: false,
    omniboxFocusCurrentTab: false,
    cacheEncodingBase64: true,
};

export const extensionFeatureState = FeaturesState;
const activeFeaturesList = Object.keys(FeaturesState).filter((k) => !k.startsWith('__') && FeaturesState[k]);

export let features = [];
let featuresLoading = undefined;
// Memoized: every caller awaits the same loading, avoid using 'features' before it is filled
export function loadFeaturesConfiguration() {
    featuresLoading ??= Promise.all(activeFeaturesList.map((f) => importFeatureConfigurationFile(f))).then(
        (loadedFeatures) => {
            features = loadedFeatures;
            Console.info(features);
            return features;
        }
    );
    return featuresLoading;
}

export function getFeaturesListResponse() {
    return loadFeaturesConfiguration().then((features) => ({ features: features }));
}

// Only the features of this build are in the registry (see scripts/rollup/feature_registry.js)
async function importFeatureFile(loaders, featureID, file) {
    const loader = loaders[featureID];
    if (!loader) throw new Error(`Feature '${featureID}' has no '${file}' file in this build`);
    return loader();
}

export function importFeatureConfigurationFile(featureID) {
    return importFeatureFile(configurationLoaders, featureID, 'configuration').then((f) => f.default);
}

export function importFeatureContentFile(featureID) {
    return importFeatureFile(contentLoaders, featureID, 'content').then((f) => new f.default());
}

export function importFeatureBackgroundTriggerFile(featureID) {
    return importFeatureFile(backgroundTriggerLoaders, featureID, 'background_trigger').then((f) => new f.default());
}

export function importFeatureBackgroundFile(featureID) {
    return importFeatureFile(backgroundLoaders, featureID, 'background').then((f) => new f.default());
}

export function importFeatureOptionFile(featureID) {
    return importFeatureFile(optionLoaders, featureID, 'option').then((f) => new f.default());
}

export function importFeatureCustomizationFile(featureID) {
    return importFeatureFile(optionCustomizationLoaders, featureID, 'option_customization').then(
        (f) => new f.default()
    );
}

export function importFeaturePopupFile(featureID) {
    return importFeatureFile(popupLoaders, featureID, 'popup').then((f) => new f.default());
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
