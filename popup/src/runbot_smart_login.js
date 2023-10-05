function loadSmartLogin() {
    updateRenderSmartLogin();
}

async function updateRenderSmartLogin() {
    const configuration = await chrome.storage.sync.get({
        adminDebugLoginRunbotEnabled: false,
        impersonateLoginRunbotEnabled: false,
    });

    const adminDebugLoginRunbotFeature = document.getElementById('adminDebugLoginRunbotFeature');
    adminDebugLoginRunbotFeature.checked = configuration.adminDebugLoginRunbotEnabled;
    adminDebugLoginRunbotFeature.onchange = updateAdminDebugLoginRunbot;

    const impersonateLoginRunbotFeature = document.getElementById('impersonateLoginRunbotFeature');
    impersonateLoginRunbotFeature.checked = configuration.impersonateLoginRunbotEnabled;
    impersonateLoginRunbotFeature.onchange = updateImpersonateLoginRunbot;
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
