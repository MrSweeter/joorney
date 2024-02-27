import { getFeaturesAndCurrentSettings, importFeaturePopupFile } from '../configuration.js';
import { Runtime, Tabs } from '../src/utils/browser.js';

window.onload = async () => {
    const tabs = await Tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (!currentTab.url.startsWith('http')) return;

    document.getElementById('qol-invalid-website').remove();
    document.getElementById('qol-popup-configuration').classList.remove('d-none');

    loadFeatures();

    const popupIcon = document.getElementById('popupIcon');
    popupIcon.onclick = () => Runtime.openOptionsPage();
};

async function loadFeatures() {
    const { features, currentSettings } = await getFeaturesAndCurrentSettings();

    features
        .filter((f) => f.trigger.popup)
        .forEach((feature) => {
            importFeaturePopupFile(feature.id).then((featureModule) =>
                featureModule.load(currentSettings)
            );
        });

    // TODO DYNAMIC HTML
    // loadTabFeatures(configuration);
}
