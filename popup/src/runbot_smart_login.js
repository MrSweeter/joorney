function loadSmartLogin() {
    updateRenderSmartLogin();
}

async function updateRenderSmartLogin() {
    const configuration = await chrome.storage.sync.get({
        adminDebugLoginRunbotEnabled: false,
        impersonateLoginRunbotEnabled: false,
        autoOpenRunbotEnabled: false,
    });

    const adminDebugLoginRunbotFeature = document.getElementById('adminDebugLoginRunbotFeature');
    adminDebugLoginRunbotFeature.checked = configuration.adminDebugLoginRunbotEnabled;
    adminDebugLoginRunbotFeature.onchange = updateAdminDebugLoginRunbot;

    const impersonateLoginRunbotFeature = document.getElementById('impersonateLoginRunbotFeature');
    impersonateLoginRunbotFeature.checked = configuration.impersonateLoginRunbotEnabled;
    impersonateLoginRunbotFeature.onchange = updateImpersonateLoginRunbot;

    const autoOpenRunbotFeature = document.getElementById('autoOpenRunbotFeature');
    autoOpenRunbotFeature.checked = configuration.autoOpenRunbotEnabled;
    autoOpenRunbotFeature.onchange = updateAutoOpenRunbot;
}

function updateAdminDebugLoginRunbot(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ adminDebugLoginRunbotEnabled: checked });
    updateOptionPage({ enableAdminDebugLoginRunbot: checked });
}

function updateImpersonateLoginRunbot(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ impersonateLoginRunbotEnabled: checked });
    updateOptionPage({ enableImpersonateLoginRunbot: checked });
}

function updateAutoOpenRunbot(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ autoOpenRunbotEnabled: checked });
    updateOptionPage({ autoOpenRunbotEnabled: checked });
}
