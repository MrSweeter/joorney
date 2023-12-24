function loadSaveKnowledge(configuration) {
    const saveKnowledgeFeature = document.getElementById('saveKnowledgeFeature');
    saveKnowledgeFeature.onchange = updateSaveKnowledge;

    saveKnowledgeFeature.checked = configuration.saveKnowledgeEnabled;
}

function updateSaveKnowledge(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ saveKnowledgeEnabled: checked });
    updateOptionPage({ enableSaveKnowledge: checked });
}
