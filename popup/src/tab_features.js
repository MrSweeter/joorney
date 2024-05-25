import { getFeaturesAndCurrentSettings } from '../../configuration.js';
import { regexSchemePrefix } from '../../src/utils/authorize.ts';
import { StorageSync, Tabs } from '../../src/utils/browser.ts';

export async function reloadTabFeatures() {
    const { features, currentSettings } = await getFeaturesAndCurrentSettings();

    loadTabFeatures(features, currentSettings);
}

async function loadTabFeatures(features, configuration) {
    const tabs = await Tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    const originString = new URL(currentTab.url).origin;

    const origins = configuration.originsFilterOrigins;

    setupSaveOriginButton(features, configuration, currentTab.id, origins, originString);
}

function setupSaveOriginButton(features, configuration, currentTabID, origins, originStringArg) {
    const saveOriginButton = document.getElementById('saveOriginButton');
    const tabFeaturesList = document.getElementById('tabFeaturesList');

    let originString = originStringArg;
    const originKeys = Object.keys(origins);
    if (!originKeys.includes(originString)) {
        const regexes = originKeys
            .filter((o) => o.startsWith(regexSchemePrefix))
            .map((o) => new RegExp(o.replace(regexSchemePrefix, '')));
        const validRegex = regexes.find((r) => r.test(originString));
        if (validRegex) {
            originString = regexSchemePrefix + validRegex.source;
        }
    }

    const currentTabText = document.getElementById('currentTabUrl');
    currentTabText.innerHTML = originString;

    if (originKeys.includes(originString)) {
        setupFeatures(features, configuration, currentTabID, origins, originString);
        saveOriginButton.style.display = 'none';
        tabFeaturesList.style.display = 'flex';
        return;
    }
    saveOriginButton.style.display = 'flex';
    tabFeaturesList.style.display = 'none';
    saveOriginButton.onclick = async () => {
        origins[originString] = {};
        await StorageSync.set({ originsFilterOrigins: origins });
        reloadTabFeatures();
    };
    saveOriginButton.disabled = false;
}

function setupFeatures(featuresArg, configuration, currentTabID, origins, originString) {
    const tabConfiguration = origins[originString];
    const features = featuresArg.filter((f) => !f.limited).map((f) => f.id);

    for (const f of features) {
        const featureInput = document.getElementById(`${f}FeatureTab`);
        featureInput.checked = tabConfiguration[f];
        featureInput.disabled = !configuration[`${f}Enabled`];
        featureInput.classList.remove('blacklist');
        featureInput.classList.remove('whitelist');
        featureInput.classList.add(configuration[`${f}WhitelistMode`] ? 'whitelist' : 'blacklist');
    }

    const saveButton = document.getElementById('saveButton');
    saveButton.onclick = async () => {
        const originConfiguration = {};
        for (const f of features) {
            const featureInput = document.getElementById(`${f}FeatureTab`);
            originConfiguration[f] = featureInput.checked;
        }
        origins[originString] = originConfiguration;
        await StorageSync.set({ originsFilterOrigins: origins });
        Tabs.reload(currentTabID);
    };
    saveButton.disabled = false;
}
