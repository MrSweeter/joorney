import { importFeatureCustomizationFile } from '../../../configuration.js';

export async function loadPage(features, currentSettings) {
    loadFeatures(features);
}

async function loadFeatures(features) {
    for (const feature of features.filter((f) => f.customization.option)) {
        importFeatureCustomizationFile(feature.id).then((featureModule) => featureModule.load());
    }
}
