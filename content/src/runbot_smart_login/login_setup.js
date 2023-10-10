async function appendSmartLogin(urlStr) {
    const { adminDebugLoginRunbotEnabled, impersonateLoginRunbotEnabled } =
        await chrome.storage.sync.get({
            adminDebugLoginRunbotEnabled: false,
            impersonateLoginRunbotEnabled: false,
        });

    let autologin = false;
    if (adminDebugLoginRunbotEnabled) {
        appendRunbotAdminDebugLogin(urlStr);
        autologin = await checkAdminDebug(urlStr);
    }

    if (!autologin && impersonateLoginRunbotEnabled) {
        appendRunbotLogin(urlStr);
    }
}
