import { load as loadOriginsFilter } from '../../src/origins_filter.js';
import { load as loadKeyboardShortcut } from '../../src/keyboard_shortcut.js';
import { setupDragAndDrop } from '../../src/features.js';
import { importFeatureOptionFile } from '../../../configuration.js';

export async function loadPage(features, currentSettings) {
    loadKeyboardShortcut();

    await loadOriginsFilter();

    loadFeatures(features);

    setupDragAndDrop();
}

async function loadFeatures(features) {
    for (const feature of features) {
        importFeatureOptionFile(feature.id).then((featureModule) => featureModule.load());
    }
}
