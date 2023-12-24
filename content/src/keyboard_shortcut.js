async function updateTabState(url) {
    const { offs } = await chrome.storage.local.get({ offs: [] });
    if (offs.includes(new URL(url).origin)) {
        await chrome.runtime.sendMessage({
            action: 'UPDATE_EXT_STATUS',
            forceSwitchToOFF: true,
        });
        return true;
    }
    return false;
}
