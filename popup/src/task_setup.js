function loadTaskSetup() {
    updateRenderTaskSetup();
}

async function updateRenderTaskSetup() {
    const configuration = await chrome.storage.sync.get({
        assignMeTaskEnabled: false,
        starringTaskEffectEnabled: false,
    });

    const assignMeTaskFeature = document.getElementById('assignMeTaskFeature');
    assignMeTaskFeature.checked = configuration.assignMeTaskEnabled;
    assignMeTaskFeature.onchange = updateAssignMeTask;

    const starringTaskEffectFeature = document.getElementById('starringTaskEffectFeature');
    starringTaskEffectFeature.checked = configuration.starringTaskEffectEnabled;
    starringTaskEffectFeature.onchange = updateStarringTaskEffect;
}

function updateAssignMeTask(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ assignMeTaskEnabled: checked });
    updateOptionPage({ enableAssignMeTask: checked });
}

function updateStarringTaskEffect(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ starringTaskEffectEnabled: checked });
    updateOptionPage({ enableStarringTaskEffect: checked });
}
