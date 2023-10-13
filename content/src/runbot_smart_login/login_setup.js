async function appendSmartLogin(urlStr) {
    const { adminDebugLoginRunbotEnabled, impersonateLoginRunbotEnabled, autoOpenRunbotEnabled } =
        await chrome.storage.sync.get({
            adminDebugLoginRunbotEnabled: false,
            impersonateLoginRunbotEnabled: false,
            autoOpenRunbotEnabled: false,
        });

    let autologin = false;
    if (adminDebugLoginRunbotEnabled) {
        appendRunbotAdminDebugLogin(urlStr);
        autologin = await checkAdminDebug(urlStr);
    }

    if (!autologin && impersonateLoginRunbotEnabled) {
        await appendRunbotLogin(urlStr);
    }

    if (autoOpenRunbotEnabled && isRunbotPageWithAutoOpenHash(urlStr)) {
        await autoOpenRunbot(urlStr);
    }
}
