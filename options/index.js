import { load as loadOriginsFilter } from './src/origins_filter.js';
import { load as loadKeyboardShortcut } from './src/keyboard_shortcut.js';
import { setupDragAndDrop } from './src/features.js';
import { initImportExport } from './import_export.js';
import { StorageSync } from '../src/utils/browser.js';
import { getFeaturesAndCurrentSettings, importFeatureOptionFile } from '../configuration.js';

async function onDOMContentLoaded() {
    document.getElementById('copyright-year').innerText = new Date().getFullYear();
    //document.getElementById('copyright-link').href = Runtime.getManifest().homepage_url; Not public API

    const { features, currentSettings } = await getFeaturesAndCurrentSettings();

    loadKeyboardShortcut();

    await loadOriginsFilter();

    loadFeatures(features);
    initImportExport(currentSettings);

    setupDragAndDrop();

    const searchParams = new URLSearchParams(window.location.search);
    let htmlDebug = 1;
    if (searchParams.get('debug') == 1) {
        htmlDebug = 0;
        const debug = document.getElementById('qol-debug-configuration');
        const config = await StorageSync.get(currentSettings);
        debug.innerHTML = JSON.stringify(config, null, 4);
    }
    document.getElementById('qol-brand-debug').href = `?debug=${htmlDebug}`;
}

async function loadFeatures(features) {
    features.forEach((feature) => {
        importFeatureOptionFile(feature.id).then((featureModule) => featureModule.load());
    });
}

document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
