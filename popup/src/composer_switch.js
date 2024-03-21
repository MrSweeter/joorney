function loadComposerSwitch(configuration) {
    const composerSwitchFeature = document.getElementById('composerSwitchFeature');
    composerSwitchFeature.onchange = updateComposerSwitch;

    composerSwitchFeature.checked = configuration.composerSwitchEnabled;
}

function updateComposerSwitch(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ composerSwitchEnabled: checked });
    updateOptionPage({ enableComposerSwitch: checked });
}
