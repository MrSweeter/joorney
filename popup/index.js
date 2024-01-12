window.onload = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (!currentTab.url.startsWith('http')) return;

    document.getElementById('qol-invalid-website').remove();
    document.getElementById('qol-popup-configuration').classList.remove('d-none');

    const configuration = await chrome.storage.sync.get(features_enabled_configuration);

    loadAwesomeLoading(configuration);
    loadThemeSwitch(configuration);
    loadTaskSetup(configuration);
    loadSaveKnowledge(configuration);
    loadAwesomeStyle(configuration);
    loadUnfocusApp(configuration);
    loadSmartLogin(configuration);
    loadNewServerActionCode(configuration);

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
