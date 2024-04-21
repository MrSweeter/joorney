import { initImportExport } from './import_export.js';
import { StorageSync } from '../src/utils/browser.js';
import { getFeaturesAndCurrentSettings, importFeatureCustomizationFile } from '../configuration.js';

async function onDOMContentLoaded() {
    document.getElementById('copyright-year').innerText = new Date().getFullYear();
    //document.getElementById('copyright-link').href = Runtime.getManifest().homepage_url; Not public API

    const { features, currentSettings } = await getFeaturesAndCurrentSettings();

    loadFeatures(features);
    initImportExport(currentSettings);

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('debug') == 1) {
        const debug = document.getElementById('qol-debug-configuration');
        const config = await StorageSync.get(currentSettings);
        debug.innerHTML = JSON.stringify(config, null, 4);
    }
}

async function loadFeatures(features) {
    features
        .filter((f) => f.customization.option)
        .forEach((feature) => {
            importFeatureCustomizationFile(feature.id).then((featureModule) =>
                featureModule.load()
            );
        });
}

document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
