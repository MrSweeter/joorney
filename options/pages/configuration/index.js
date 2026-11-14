import { importFeatureCustomizationFile } from '../../../configuration.js';

export async function loadPage(features, _currentSettings) {
    loadFeatures(features);
}

async function loadFeatures(features) {
    for (const feature of features.filter((f) => f.customization.option)) {
        importFeatureCustomizationFile(feature.id).then((featureModule) => featureModule.load());
    }
}

// Options menu entry, see options/menu.js
export const PAGE = {
    id: 'page-configuration',
    tour: 'tour_preferences',
    label: 'Preferences',
    path: './pages/configuration/index.html',
    loader: loadPage,
};
