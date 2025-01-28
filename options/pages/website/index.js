import { importFeatureOptionFile } from '../../../configuration.js';
import { setupDragAndDrop } from '../../src/features.js';
import { load as loadOriginsFilter } from '../../src/origins_filter.js';

export async function loadPage(features, _currentSettings) {
    await loadOriginsFilter();

    await loadFeatures(features);

    setupDragAndDrop();
}

async function loadFeatures(features) {
    for (const feature of features) {
        importFeatureOptionFile(feature.id).then((featureModule) => featureModule.load());
    }
}
