import { Runtime, StorageSync, Tabs, WebNavigation } from '../utils/browser.js';
import { QOL_DEFAULT_CONFIGURATION } from '../utils/feature_default_configuration.js';
import { checkVersion } from './src/check_version.js';
import { switchThemeIfNeeded } from './src/theme_switch.js';
import { getFinalRunbotURL } from './src/runbot_smart_login.js';
import { updateTabState } from './src/keyboard_shortcut.js';

// On page # path change
WebNavigation.onReferenceFragmentUpdated.addListener((e) => {
    Tabs.sendMessage(e.tabId, { url: e.url });
});

Tabs.onUpdated.addListener((_1, _2, tabInfo) => {
    switchThemeIfNeeded(tabInfo);
});

Runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        const configurationOrDefault = await StorageSync.get(QOL_DEFAULT_CONFIGURATION);
        StorageSync.set(configurationOrDefault);
    }
});

const AVAILABLE_ACTION_MESSAGES_HANDLERS = {
    GET_FINAL_RUNBOT_URL: getFinalRunbotURL,
    UPDATE_EXT_STATUS: updateTabState,
};

// Triggers when a message is received (from the content script)
Runtime.onMessage.addListener((request, _, sendResponse) => {
    AVAILABLE_ACTION_MESSAGES_HANDLERS[request.action]?.(request).then(sendResponse);
    return true; // Needed for asynchronous
});

checkVersion();
