async function appendSmartLogin(urlStr) {
    const { adminDebugLoginRunbotEnabled, impersonateLoginRunbotEnabled } =
        await chrome.storage.sync.get({
            adminDebugLoginRunbotEnabled: false,
            impersonateLoginRunbotEnabled: false,
        });

    if (adminDebugLoginRunbotEnabled) {
        appendRunbotAdminDebugLogin(urlStr);
    }
    if (impersonateLoginRunbotEnabled) {
        appendRunbotLogin(urlStr);
    }
}
