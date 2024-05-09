import { ContextMenus, Runtime, StorageSync, Tabs, WebNavigation } from '../src/utils/browser.js';

import { features, getCurrentSettings, loadFeaturesConfiguration } from '../configuration.js';
import { checkHostsExpiration, clearHost } from '../src/api/cache.js';
import { checkVersion } from './src/check_version.js';
import { CLEAR_CACHE_HOST_ID_MENU, createClearHostCache } from './src/contextMenu.js';
import { checkCommandShortcuts, handleCommands } from './src/keyboard_shortcut.js';
import { handleMessage } from './src/messaging.js';

// On page # path change, pre 17.2
WebNavigation.onReferenceFragmentUpdated.addListener((e) => {
    if (e.url.startsWith('http')) {
        Tabs.sendMessage(e.tabId, { url: e.url, navigator: true, fragment: true });
    }
});

// 17.2
WebNavigation.onHistoryStateUpdated.addListener((e) => {
    if (e.url.startsWith('http')) {
        Tabs.sendMessage(e.tabId, { url: e.url, navigator: true, history: true });
    }
});

Runtime.onInstalled.addListener(async (details) => {
    if (details.reason === Runtime.OnInstalledReason.INSTALL) {
        const settingsOrDefault = getCurrentSettings(features);
        await StorageSync.set(settingsOrDefault);
        checkCommandShortcuts();
    }
    createClearHostCache();
});

// Triggers when a message is received (from the content script)
Runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
        .then(async (r) => {
            sendResponse(r);
        })
        .catch((ex) => {
            console.warn(ex);
            sendResponse();
        });
    return true;
});

ContextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === CLEAR_CACHE_HOST_ID_MENU) {
        clearHost(new URL(tab.url).host);
    }
});

function main() {
    checkVersion();
    handleCommands();
    checkHostsExpiration();

    loadFeaturesConfiguration();
}

main();
