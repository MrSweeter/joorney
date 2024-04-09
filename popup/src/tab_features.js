const features_enabled_configuration = {
    assignMeTaskEnabled: false,
    saveKnowledgeEnabled: false,
    themeSwitchEnabled: false,
    awesomeLoadingLargeEnabled: false,
    awesomeLoadingSmallEnabled: false,
    starringTaskEffectEnabled: false,
    awesomeStyleEnabled: false,
    unfocusAppEnabled: false,
    newServerActionCodeEnabled: false,
    tooltipMetadataEnabled: false,
    showMyBadgeEnabled: false,
    adminDebugLoginRunbotEnabled: false,
    impersonateLoginRunbotEnabled: false,

    assignMeTaskWhitelistMode: true,
    saveKnowledgeWhitelistMode: true,
    themeSwitchWhitelistMode: true,
    awesomeLoadingLargeWhitelistMode: true,
    awesomeLoadingSmallWhitelistMode: true,
    starringTaskEffectWhitelistMode: true,
    awesomeStyleWhitelistMode: true,
    unfocusAppWhitelistMode: true,
    newServerActionCodeWhitelistMode: false,
    tooltipMetadataWhitelistMode: false,
    showMyBadgeWhitelistMode: false,
    adminDebugLoginRunbotWhitelistMode: true,
    impersonateLoginRunbotWhitelistMode: true,

    originsFilterOrigins: {},
};

async function loadTabFeatures(configuration) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    const originString = new URL(currentTab.url).origin;

    const currentTabText = document.getElementById('currentTabUrl');
    currentTabText.innerHTML = originString;

    const origins = configuration.originsFilterOrigins;

    setupSaveOriginButton(configuration, currentTab.id, origins, originString);
}

async function reloadTabFeatures() {
    const configuration = await chrome.storage.sync.get(features_enabled_configuration);

    loadTabFeatures(configuration);
}

function setupSaveOriginButton(configuration, currentTabID, origins, originString) {
    const saveOriginButton = document.getElementById('saveOriginButton');
    const tabFeaturesList = document.getElementById('tabFeaturesList');

    const regexes = Object.keys(origins)
        .filter((o) => o.startsWith('regex://'))
        .map((o) => new RegExp(o.replace('regex://', '')));
    const validRegex = regexes.find((r) => r.test(originString));
    if (validRegex) {
        originString = 'regex://' + validRegex.source;
    }

    if (Object.keys(origins).includes(originString)) {
        setupFeatures(configuration, currentTabID, origins, originString);
        saveOriginButton.style.display = 'none';
        tabFeaturesList.style.display = 'flex';
        return;
    }
    saveOriginButton.style.display = 'flex';
    tabFeaturesList.style.display = 'none';
    saveOriginButton.onclick = async () => {
        origins[originString] = {};
        await chrome.storage.sync.set({ originsFilterOrigins: origins });
        reloadTabFeatures();
    };
    saveOriginButton.disabled = false;
}

function setupFeatures(configuration, currentTabID, origins, originString) {
    const tabConfiguration = origins[originString];
    const features = [
        'awesomeLoadingLarge',
        'awesomeLoadingSmall',
        'assignMeTask',
        'starringTaskEffect',
        'saveKnowledge',
        'themeSwitch',
        'awesomeStyle',
        'unfocusApp',
    ];

    features.forEach((f) => {
        const featureInput = document.getElementById(`${f}FeatureTab`);
        featureInput.checked = tabConfiguration[f];
        featureInput.disabled = !configuration[`${f}Enabled`];
        featureInput.classList.remove('blacklist');
        featureInput.classList.remove('whitelist');
        featureInput.classList.add(configuration[`${f}WhitelistMode`] ? 'whitelist' : 'blacklist');
    });

    const saveButton = document.getElementById('saveButton');
    saveButton.onclick = async () => {
        const originConfiguration = {};
        features.forEach((f) => {
            const featureInput = document.getElementById(`${f}FeatureTab`);
            originConfiguration[f] = featureInput.checked;
        });
        origins[originString] = originConfiguration;
        await chrome.storage.sync.set({ originsFilterOrigins: origins });
        chrome.tabs.reload(currentTabID);
    };
    saveButton.disabled = false;
}
