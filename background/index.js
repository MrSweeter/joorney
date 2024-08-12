import {
    Console,
    ContextMenus,
    Runtime,
    StorageSync,
    Tabs,
    WebNavigation,
    Windows,
    sendTabMessage,
} from '../src/utils/browser.js';

import { features, getCurrentSettings, loadFeaturesConfiguration } from '../configuration.js';
import { checkHostsExpiration } from '../src/api/cache.js';
import { createContextMenu, onContextMenuItemClick, updateContext } from '../src/contextmenu/manager.js';
import { checkVersion, openOption } from '../src/utils/check_version.js';
import { MESSAGE_ACTION } from '../src/utils/messaging.js';
import { sleep } from '../src/utils/util.js';
import { checkCommandShortcuts, handleCommands } from './src/keyboard_shortcut.js';
import { handleMessage } from './src/messaging.js';
import { initOmni } from './src/omnibox.js';
import { listenRequest } from './src/request.js';

// On page # path change, pre 17.2
WebNavigation.onReferenceFragmentUpdated.addListener((e) => {
    if (e.url.startsWith('http')) {
        sendTabMessage(e.tabId, MESSAGE_ACTION.TO_CONTENT.TAB_NAVIGATION, {
            url: e.url,
            navigator: true,
            fragment: true,
        });
    }
});

// 17.2
WebNavigation.onHistoryStateUpdated.addListener((e) => {
    if (e.url.startsWith('http')) {
        sendTabMessage(e.tabId, MESSAGE_ACTION.TO_CONTENT.TAB_NAVIGATION, {
            url: e.url,
            navigator: true,
            history: true,
        });
    }
});

Runtime.onInstalled.addListener(async (details) => {
    const isInstall = details.reason === Runtime.OnInstalledReason.INSTALL;
    if (isInstall) {
        const settingsOrDefault = getCurrentSettings(features);
        await StorageSync.set(settingsOrDefault);
        checkCommandShortcuts();
    }
    await sleep(1000);
    openOption(isInstall);
});

Tabs.onActivated.addListener((activeInfo) => {
    updateContext(activeInfo.tabId);
});

// Handled by message "TAB_LOADED"
// Tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
//     if (changeInfo.status === 'complete') {
//         updateContext(tabId);
//     }
// });

Windows.onFocusChanged.addListener(async (windowId) => {
    const tabs = await Tabs.query({ active: true, windowId: windowId });
    if (tabs.length > 0) updateContext(tabs[0].id);
});

// Triggers when a message is received (from the content script)
Runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
        .then(async (r) => {
            sendResponse(r);
        })
        .catch((ex) => {
            Console.warn(ex);
            sendResponse();
        });
    return true;
});

ContextMenus.onClicked.addListener(onContextMenuItemClick);

async function main() {
    // Add some delay to avoid initialization side effect
    await sleep(1000);

    checkVersion();
    handleCommands();
    checkHostsExpiration();

    await loadFeaturesConfiguration();

    initOmni();

    createContextMenu();

    listenRequest();
}

main();
