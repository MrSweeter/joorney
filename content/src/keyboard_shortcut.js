const defaultShortcut = {
    kbsEnabled: true,
    kbsAltKey: true,
    kbsCtrlKey: true,
    //kbsMetaKey: false, Mac OS
    kbsShiftKey: false,
    kbsCodeKey: 'Period',
    kbsDisplayKey: 'Period (:)'
};

async function updateTabState(url) {
    document.onkeyup = async (e) => {
        const shortcut = await chrome.storage.sync.get(defaultShortcut);

        if (!shortcut.kbsEnabled) return;
        if (shortcut.kbsAltKey && !e.altKey) return;
        if (shortcut.kbsCtrlKey && !e.ctrlKey) return;
        //if (shortcut.kbsMetaKey && !e.metaKey) return;
        if (shortcut.kbsShiftKey && !e.shiftKey) return;
        console.log(e.code)
        console.log(shortcut.kbsCodeKey)
        if (shortcut.kbsCodeKey !== e.code) return;

        if (confirm('The current tab will be reload.\nDo you confirm your action?')) {
            sendUpdate();
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
