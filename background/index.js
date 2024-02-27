import { Runtime, StorageSync, Tabs, WebNavigation } from '../src/utils/browser.js';

import { checkVersion } from './src/check_version.js';
import { checkCommandShortcuts, handleCommands } from './src/keyboard_shortcut.js';
import {
    loadFeaturesConfiguration,
    getCurrentSettings,
    features,
    importFeatureBackgroundFile,
} from '../configuration.js';
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

Tabs.onUpdated.addListener(async (_1, _2, tab) => {
    if (tab.url.startsWith('http')) {
        features
            .filter((f) => f.trigger.background)
            .forEach((feature) => {
                importFeatureBackgroundFile(feature.id).then((featureModule) => {
                    featureModule.load(tab);
                });
            });
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
Runtime.onMessage.addListener((message, _, sendResponse) => {
    handleMessage(message, _, sendResponse)
        .then(async (r) => {
            console.log(r);
            sendResponse(r);
        })
        .catch((ex) => {
            console.log(ex);
            sendResponse();
        });
    return true;
});

checkVersion();
handleCommands();

loadFeaturesConfiguration();
