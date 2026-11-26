import {
    defaultEnabledFeatures,
    extensionFeatureState,
    getCurrentSettings,
    loadFeaturesConfiguration,
} from '../configuration.js';
import { checkHostsExpiration } from '../src/api/cache.js';
import { createContextMenu, onContextMenuItemClick, updateContext } from '../src/contextmenu/manager.js';
import AmbientManager from '../src/features/ambient/ambient_manager.js';
import { Console, ContextMenus, Runtime, StorageSync, Tabs, WebNavigation, Windows } from '../src/utils/browser.js';
import { checkVersion, openOption } from '../src/utils/check_version.js';
import { sleep } from '../src/utils/util.js';
import { handleMessage } from './src/messaging.js';
import { listenNavigation } from './src/navigation.js';
import { initOmni } from './src/omnibox.js';
import { listenRequest } from './src/request.js';
import { onRunbotNavigationCommitted } from './src/runbot.js';
import { watchDisabledWebsites } from './src/toolbar_state.js';

listenNavigation();

// Admin/debug login on runbot builds opened through the background (see openRunbotAdminDebug)
WebNavigation.onCommitted.addListener(onRunbotNavigationCommitted);

// Only features shipped in this build can be turned on, others have no storage keys to write.
// An install also happens on a second device or after a reinstall, where Chrome sync already holds the
// user's choices: read before the defaults are written, and only enable the features never set.
async function getDefaultFeaturesToEnable() {
    try {
        const ids = defaultEnabledFeatures.filter((id) => extensionFeatureState[id]);
        const stored = await StorageSync.get(ids.map((id) => `${id}Enabled`));
        return ids.filter((id) => stored[`${id}Enabled`] === undefined);
    } catch (e) {
        // Must never break the install flow (options page opening, shortcuts)
        Console.error(e);
        return [];
    }
}

async function enableDefaultFeatures(ids) {
    try {
        const defaults = {};
        for (const id of ids) {
            defaults[`${id}Enabled`] = true;
            defaults[`${id}WhitelistMode`] = false;
        }
        await StorageSync.set(defaults);
    } catch (e) {
        // Must never break the install flow (options page opening, shortcuts)
        Console.error(e);
    }
}

Runtime.onInstalled.addListener(async (details) => {
    const isInstall = details.reason === Runtime.OnInstalledReason.INSTALL;
    if (isInstall) {
        const toEnable = await getDefaultFeaturesToEnable();
        const features = await loadFeaturesConfiguration();
        const settingsOrDefault = await getCurrentSettings(features);
        await StorageSync.set(settingsOrDefault);
        await enableDefaultFeatures(toEnable);
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
initOmni();
watchDisabledWebsites();

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
