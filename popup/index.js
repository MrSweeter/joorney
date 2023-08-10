window.onload = async () => {
    const configuration = await chrome.storage.sync.get(features_enabled_configuration);

    loadAwesomeLoading(configuration);
    loadThemeSwitch(configuration);
    loadTaskSetup(configuration);
    loadSaveKnowledge(configuration);
    loadAwesomeStyle(configuration);
    loadUnfocusApp(configuration);

    loadTabFeatures(configuration);

    const popupIcon = document.getElementById('popupIcon');
    popupIcon.onclick = () => chrome.runtime.openOptionsPage();
};

async function updateOptionPage(message) {
    reloadTabFeatures();
    const tabs = await chrome.tabs.query({}); // No query for the chrome-extension scheme
    tabs.filter((t) => t.url.startsWith(`chrome-extension://${chrome.runtime.id}`)).forEach((tab) =>
        chrome.tabs.sendMessage(tab.id, message)
    );
}
