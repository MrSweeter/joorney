function loadNewServerActionCode(configuration) {
    const newServerActionCodeFeature = document.getElementById('newServerActionCodeFeature');
    newServerActionCodeFeature.onchange = updateNewServerActionCode;

    newServerActionCodeFeature.checked = configuration.newServerActionCodeEnabled;
}

function updateNewServerActionCode(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ newServerActionCodeEnabled: checked });
    updateOptionPage({ enableNewServerActionCode: checked });
}
