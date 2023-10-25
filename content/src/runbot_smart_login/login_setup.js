async function appendSmartLogin(urlStr) {
    const { adminDebugLoginRunbotEnabled, impersonateLoginRunbotEnabled, autoOpenRunbotEnabled } =
        await chrome.storage.sync.get({
            adminDebugLoginRunbotEnabled: false,
            impersonateLoginRunbotEnabled: false,
            autoOpenRunbotEnabled: false,
        });

    if (adminDebugLoginRunbotEnabled && isRunbotPage(urlStr)) {
        await appendRunbotAdminDebugLogin(urlStr);
    }

    if (autoOpenRunbotEnabled && isRunbotPageWithAutoOpenHash(urlStr)) {
        await autoOpenRunbot(urlStr);
    }

    let autologin = false;
    if (adminDebugLoginRunbotEnabled || autoOpenRunbotEnabled) {
        autologin = await checkAdminDebug(urlStr);
    }

    if (!autologin && impersonateLoginRunbotEnabled) {
        await appendRunbotLogin(urlStr);
    }
}
