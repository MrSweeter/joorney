import { getFeaturesAndCurrentSettings, importFeaturePopupFile } from '../configuration.js';
import { generateFeaturePopupToggleItem, generateTabFeaturePopupToggleItem } from '../src/html_generator.js';
import { Runtime, Tabs } from '../src/utils/browser.js';
import { MESSAGE_ACTION } from '../src/utils/messaging.js';
import { reloadTabFeatures } from './src/tab_features.js';

window.onload = async () => {
    const tabs = await Tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (!currentTab.url.startsWith('http')) return;

    document.getElementById('qol-invalid-website').remove();
    document.getElementById('qol-popup-configuration').classList.remove('d-none');

    renderFeatures();

    loadFeatures();

    const popupIcon = document.getElementById('popupIcon');
    popupIcon.onclick = () => Runtime.openOptionsPage();
};

async function renderFeatures() {
    const response = await Runtime.sendMessage({
        action: MESSAGE_ACTION.GET_FEATURES_LIST,
    });
    const features = response.features;

    const toggleContainer = document.getElementById('qol-popup-feature-toggle');
    toggleContainer.innerHTML = '';
    const tabFeatureContainer = document.getElementById('tabFeaturesContainer');
    tabFeatureContainer.innerHTML = '';

    for (const f of features) {
        toggleContainer.appendChild(generateFeaturePopupToggleItem(f));
        if (!f.limited) tabFeatureContainer.appendChild(generateTabFeaturePopupToggleItem(f));
    }
}

async function loadFeatures() {
    const { features, currentSettings } = await getFeaturesAndCurrentSettings();

    for (const feature of features) {
        importFeaturePopupFile(feature.id).then((featureModule) => {
            featureModule.load(currentSettings);
        });
    }

    reloadTabFeatures();
}
