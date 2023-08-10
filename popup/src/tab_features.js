const features_enabled_configuration = {
    assignMeTaskEnabled: false,
    saveKnowledgeEnabled: false,
    themeSwitchEnabled: false,
    awesomeLoadingLargeEnabled: false,
    awesomeLoadingSmallEnabled: false,
    starringTaskEffectEnabled: false,
    originsFilterOrigins: {},
    originsFilterIsBlacklist: false,
    awesomeStyleEnabled: false,
    unfocusAppEnabled: false,
};

async function loadTabFeatures(configuration) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    const originString = new URL(currentTab.url).origin;

    const currentTabText = document.getElementById('currentTabUrl');
    currentTabText.innerHTML = originString;

    const origins = configuration.originsFilterOrigins;

    setupFilterButton(configuration, currentTab.id, origins, originString);
}

async function reloadTabFeatures() {
    const configuration = await chrome.storage.sync.get(features_enabled_configuration);

    loadTabFeatures(configuration);
}

function setupFilterButton(configuration, currentTabID, origins, originString) {
    const filterButton = document.getElementById('filterButton');
    const tabFeaturesList = document.getElementById('tabFeaturesList');

    function updateButton(isBlacklist, existing) {
        filterButton.innerHTML = isBlacklist ? 'Blacklist' : 'Whitelist';
        if (existing) filterButton.innerHTML = isBlacklist ? 'Unblacklist' : 'Unwhitelist';

        filterButton.classList.remove('btn-success');
        filterButton.classList.remove('btn-danger');
        filterButton.classList.add(
            (isBlacklist && !existing) || (!isBlacklist && existing) ? 'btn-danger' : 'btn-success'
        );
    }

    const regexes = Object.keys(origins)
        .filter((o) => o.startsWith('regex://'))
        .map((o) => new RegExp(o.replace('regex://', '')));
    const validRegex = regexes.find((r) => r.test(originString));
    if (validRegex) {
        originString = 'regex://' + validRegex.source;
    }

    if (Object.keys(origins).includes(originString)) {
        updateButton(configuration.originsFilterIsBlacklist, true);
        filterButton.onclick = async () => {
            delete origins[originString];
            await chrome.storage.sync.set({ originsFilterOrigins: origins });
            reloadTabFeatures();
            chrome.tabs.reload(currentTabID);
        };
        setupFeatures(configuration, origins[originString], currentTabID, origins, originString);
        tabFeaturesList.classList.remove('d-none');
        tabFeaturesList.classList.add('d-flex');

        document.getElementById('currentTabUrl').innerHTML = originString;
    } else {
        updateButton(configuration.originsFilterIsBlacklist, false);
        filterButton.onclick = async () => {
            origins[originString] = {};
            await chrome.storage.sync.set({ originsFilterOrigins: origins });
            reloadTabFeatures();
        };
        tabFeaturesList.classList.remove('d-flex');
        tabFeaturesList.classList.add('d-none');
    }
    filterButton.disabled = false;
}

function setupFeatures(configuration, tabConfiguration, currentTabID, origins, originString) {
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
        featureInput.classList.add(
            configuration.originsFilterIsBlacklist ? 'blacklist' : 'whitelist'
        );
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
