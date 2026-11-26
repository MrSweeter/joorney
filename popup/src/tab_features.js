import { getFeaturesAndCurrentSettings } from '../../configuration.js';
import { addHost, setHostListing } from '../../options/src/ui/state.js';
import { getOriginsRegex, regexSchemePrefix } from '../../src/utils/authorize.js';
import { Console, StorageSync, Tabs } from '../../src/utils/browser.js';

export async function reloadTabFeatures() {
    const { features, currentSettings } = await getFeaturesAndCurrentSettings();
    const modes = await StorageSync.get(
        Object.fromEntries(features.filter((f) => !f.limited).map((f) => [`${f.id}WhitelistMode`, true]))
    );

    loadTabFeatures(features, { ...currentSettings, ...modes });
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
        const regexes = getOriginsRegex(originKeys);
        const validRegex = regexes.find((r) => r.test(originString));
        if (validRegex) {
            originString = regexSchemePrefix + validRegex.source;
        }
    }

    const currentTabText = document.getElementById('currentTabUrl');
    currentTabText.textContent = originString;

    if (originKeys.includes(originString)) {
        setupFeatures(features, configuration, currentTabID, origins, originString);
        saveOriginButton.style.display = 'none';
        tabFeaturesList.style.display = 'flex';
        return;
    }
    saveOriginButton.style.display = 'flex';
    tabFeaturesList.style.display = 'none';
    saveOriginButton.onclick = async () => {
        try {
            await addHost(originString);
        } catch (ex) {
            // A tab that can't be a host (chrome://, file://...) or a host added meanwhile from the options page
            Console.warn(ex);
            saveOriginButton.disabled = true;
            return;
        }
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
        const listedById = {};
        for (const f of features) {
            const featureInput = document.getElementById(`${f}FeatureTab`);
            listedById[f] = featureInput.checked;
        }
        // Read and written at save time by the options state: a host list changed since the popup opened is kept
        await setHostListing(originString, listedById);
        Tabs.reload(currentTabID);
    };
    saveButton.disabled = false;
}
