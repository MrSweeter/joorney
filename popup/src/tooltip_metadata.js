function loadTooltipMetadata(configuration) {
    const tooltipMetadataFeature = document.getElementById('tooltipMetadataFeature');
    tooltipMetadataFeature.onchange = updateTooltipMetadata;

    tooltipMetadataFeature.checked = configuration.tooltipMetadataEnabled;
}

function updateTooltipMetadata(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ tooltipMetadataEnabled: checked });
    updateOptionPage({ enableTooltipMetadata: checked });
}
