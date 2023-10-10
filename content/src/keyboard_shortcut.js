async function updateTabState(url) {
    document.onkeyup = async (e) => {
        if (e.ctrlKey && e.altKey && e.key === ':') {
            if (confirm('The current tab will be reload.\nDo you confirm your action?')) {
                sendUpdate();
            }
        }
    };

    const { offs } = await chrome.storage.local.get({ offs: [] });
    if (offs.includes(new URL(url).origin)) {
        sendUpdate(true);
        return true;
    }
    return false;
}

async function sendUpdate(forceOFF = undefined) {
    await chrome.runtime.sendMessage({
        action: 'UPDATE_EXT_STATUS',
        forceSwitchToOFF: forceOFF,
    });
}
