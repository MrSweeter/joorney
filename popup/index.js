import { getFeaturesAndCurrentSettings, importFeaturePopupFile } from '../configuration.js';
import { generateFeaturePopupToggleItem, generateTabFeaturePopupToggleItem } from '../src/html_generator.js';
import { Runtime, Tabs } from '../src/utils/browser.js';
import { reloadTabFeatures } from './src/tab_features.js';

window.onload = async () => {
    const tabs = await Tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (!currentTab.url.startsWith('http')) return;

    document.getElementById('joorney-invalid-website').remove();
    document.getElementById('joorney-popup-configuration').classList.remove('d-none');

    renderFeatures();

    const popupIcon = document.getElementById('popupIcon');
    popupIcon.onclick = () => Runtime.openOptionsPage();
};

async function renderFeatures() {
    const { features, currentSettings } = await getFeaturesAndCurrentSettings();

    const toggleContainer = document.getElementById('joorney-popup-feature-toggle');
    toggleContainer.innerHTML = '';
    const tabFeatureContainer = document.getElementById('tabFeaturesContainer');
    tabFeatureContainer.innerHTML = '';

    for (const f of features) {
        toggleContainer.appendChild(generateFeaturePopupToggleItem(f));
        if (!f.limited) tabFeatureContainer.appendChild(generateTabFeaturePopupToggleItem(f));
    }

    loadFeatures(features, currentSettings);
}

async function loadFeatures(features, currentSettings) {
    for (const feature of features) {
        importFeaturePopupFile(feature.id).then((featureModule) => {
            featureModule.load(currentSettings);
        });
    }

    reloadTabFeatures();
}
