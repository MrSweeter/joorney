import { extensionFeatureState } from '../../../configuration.js';
import { handleExpanderClick } from '../../../lib/json-formatter/collapse.js';
import { buildDom } from '../../../lib/json-formatter/html.js';

export async function loadPage(features, currentSettings) {
    loadFeaturesPreview(features);
    loadConfigurationPreview(currentSettings);
    handleExpanderClick();
}

async function loadFeaturesPreview(features) {
    let preview = document.getElementById('joorney-extension-state');
    preview.innerHTML = '';
    preview.appendChild(buildDom(extensionFeatureState));
    //preview.innerHTML = JSON.stringify(extensionFeatureState, null, 4);
    preview = document.getElementById('joorney-extension-features');
    preview.innerHTML = '';
    preview.appendChild(buildDom(features, false, true));
    //preview.innerHTML = JSON.stringify(features, null, 4);
}

async function loadConfigurationPreview(currentSettings) {
    const preview = document.getElementById('joorney-storage-configuration');
    preview.innerHTML = '';
    preview.appendChild(buildDom(currentSettings, false, true));
    //debug.innerHTML = JSON.stringify(currentSettings, null, 4);
}
