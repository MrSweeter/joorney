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

import { getCurrentSettings, loadFeaturesConfiguration } from '../configuration.js';
import { checkHostsExpiration } from '../src/api/cache.js';
import { createContextMenu, onContextMenuItemClick, updateContext } from '../src/contextmenu/manager.js';
import AmbientManager from '../src/features/ambient/ambient_manager.js';
import { checkVersion, openOption } from '../src/utils/check_version.js';
import { MESSAGE_ACTION } from '../src/utils/messaging.js';
import { sleep } from '../src/utils/util.js';
import { checkCommandShortcuts, handleCommands } from './src/keyboard_shortcut.js';
import { handleMessage } from './src/messaging.js';
import { initOmni } from './src/omnibox.js';
import { listenRequest } from './src/request.js';
import { onRunbotNavigationCommitted } from './src/runbot.js';

// [ODOO] < 17.2 On page # path change
WebNavigation.onReferenceFragmentUpdated.addListener((e) => {
    // Ignore iframe navigation (website editor, html field, report preview...)
    if (e.frameId === 0 && e.url.startsWith('http')) {
        sendTabMessage(e.tabId, MESSAGE_ACTION.TO_CONTENT.TAB_NAVIGATION, {
            url: e.url,
            navigator: true,
            fragment: true,
        });
    }
});

// [ODOO] 17.2+
WebNavigation.onHistoryStateUpdated.addListener((e) => {
    if (e.frameId === 0 && e.url.startsWith('http')) {
        sendTabMessage(e.tabId, MESSAGE_ACTION.TO_CONTENT.TAB_NAVIGATION, {
            url: e.url,
            navigator: true,
            history: true,
        });
    }
});

// Admin/debug login on runbot builds opened through the background (see openRunbotAdminDebug)
WebNavigation.onCommitted.addListener(onRunbotNavigationCommitted);

Runtime.onInstalled.addListener(async (details) => {
    const isInstall = details.reason === Runtime.OnInstalledReason.INSTALL;
    if (isInstall) {
        const features = await loadFeaturesConfiguration();
        const settingsOrDefault = await getCurrentSettings(features);
        await StorageSync.set(settingsOrDefault);
        checkCommandShortcuts();
    }
    await sleep(1000);
    await openOption(isInstall, details.previousVersion);
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
Runtime.onMessage.addListener((message, sender) => {
    return handleMessage(message, sender);
});

ContextMenus.onClicked.addListener(onContextMenuItemClick);

// Listeners must be registered synchronously, MV3 does not dispatch the waking event to listeners added later
handleCommands();
initOmni();

async function main() {
    // Start loading features immediately, messages handlers await the same promise
    loadFeaturesConfiguration();

    try {
        await checkVersion();
    } catch (e) {
        Console.error(e);
    }
    await checkHostsExpiration();

    await createContextMenu('main');

    await listenRequest();

    await AmbientManager.computeEvents();
}

main().catch((e) => Console.error(e));
