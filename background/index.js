import { ContextMenus, Runtime, StorageSync, Tabs, WebNavigation, sendTabMessage } from '../src/utils/browser.js';

import { features, getCurrentSettings, loadFeaturesConfiguration } from '../configuration.js';
import { checkHostsExpiration } from '../src/api/cache.js';
import {
    createContextMenu,
    disableDynamicItems,
    onContextMenuItemClick,
    updateContextMenu,
} from '../src/contextmenu/manager.js';
import { MESSAGE_ACTION } from '../src/utils/messaging.js';
import { checkVersion, openOption } from './src/check_version.js';
import { checkCommandShortcuts, handleCommands } from './src/keyboard_shortcut.js';
import { handleMessage } from './src/messaging.js';
import { initOmni } from './src/omnibox.js';

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
    openOption(isInstall);
});

Tabs.onActivated.addListener((activeInfo) => {
    updateContext(activeInfo.tabId);
});

Tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
    if (changeInfo.status === 'complete') {
        updateContext(tabId);
    }
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

ContextMenus.onClicked.addListener(onContextMenuItemClick);

async function updateContext(tabId) {
    disableDynamicItems();

    await new Promise((r) => setTimeout(r, 1000)); // delay update to avoid fake positive

    try {
        const tab = await Tabs.get(tabId);
        if (!tab.active) return;
        if (!tab.url.startsWith('http')) return;
        const odooInfo = await sendTabMessage(tab.id, MESSAGE_ACTION.TO_CONTENT.REQUEST_ODOO_INFO);
        if (!odooInfo) return;
        updateContextMenu(tab, odooInfo.isOdoo, odooInfo.version);
    } catch (error) {
        // Error: No tab with id (from Tabs.get) is expected
        if (`${error}`.includes(tabId)) console.log(`background.js - updateContext: ${error}`);
        else console.error(error);
    }
}

function main() {
    checkVersion();
    handleCommands();
    checkHostsExpiration();

    loadFeaturesConfiguration();

    initOmni();

    createContextMenu();
}

main();
