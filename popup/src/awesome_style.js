function loadAwesomeStyle(configuration) {
    const awesomeStyleFeature = document.getElementById('awesomeStyleFeature');
    awesomeStyleFeature.onchange = updateAwesomeStyle;

    awesomeStyleFeature.checked = configuration.awesomeStyleEnabled;
}

function updateAwesomeStyle(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ awesomeStyleEnabled: checked });
    updateOptionPage({ enableAwesomeStyle: checked });
    updateAwesomeStyleTabs(checked);
}

function updateAwesomeStyleTabs(css) {
    // The wildcard * for scheme only matches http or https
    // Same url pattern than content_scripts in manifest
    chrome.tabs.query({ url: '*://*/*' }, (tabs) => {
        tabs.forEach((t) => chrome.tabs.sendMessage(t.id, { enableAwesomeStyle: css, url: t.url }));
    });
}
