function loadShowMyBadge(configuration) {
    const showMyBadgeFeature = document.getElementById('showMyBadgeFeature');
    showMyBadgeFeature.onchange = updateShowMyBadge;

    showMyBadgeFeature.checked = configuration.showMyBadgeEnabled;
}

function updateShowMyBadge(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ showMyBadgeEnabled: checked });
    updateOptionPage({ enableShowMyBadge: checked });
}
