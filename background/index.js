import { Runtime, StorageSync, Tabs, WebNavigation } from '../src/utils/browser.js';

import { checkVersion } from './src/check_version.js';
import { checkCommandShortcuts, handleCommands } from './src/keyboard_shortcut.js';
import { loadFeaturesConfiguration, getCurrentSettings, features } from '../configuration.js';
import { handleMessage } from './src/messaging.js';

// On page # path change, pre 17.2
WebNavigation.onReferenceFragmentUpdated.addListener((e) => {
    if (e.url.startsWith('http')) {
        Tabs.sendMessage(e.tabId, { url: e.url });
    }
});

// 17.2
WebNavigation.onHistoryStateUpdated.addListener((e) => {
    if (e.url.startsWith('http')) {
        Tabs.sendMessage(e.tabId, { url: e.url });
    }
});

Runtime.onInstalled.addListener(async (details) => {
    if (details.reason === Runtime.OnInstalledReason.INSTALL) {
        const settingsOrDefault = getCurrentSettings(features);
        await StorageSync.set(settingsOrDefault);
        checkCommandShortcuts();
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

checkVersion();
handleCommands();

loadFeaturesConfiguration();
