import { updateTabState } from '../background/src/keyboard_shortcut.js';
import { listenNavigation } from '../background/src/navigation.js';
import { listenRequest } from '../background/src/request.js';
import { getCurrentSettings, getFeaturesListResponse, loadFeaturesConfiguration } from '../configuration.js';
import { checkHostsExpiration } from '../src/api/cache.js';
import { Console, Runtime, StorageSync } from '../src/utils/browser.js';
import { MESSAGE_ACTION } from '../src/utils/messaging.js';
import { sanitizeVersion } from '../src/utils/version.js';
import { refreshBundledVersions } from './odoo_data.js';

/**
 * Background of a lite feature build (see rollup.lite.config.mjs).
 * Only the plumbing of content features: navigation, web requests and the content script messages.
 * No context menu, omnibox, keyboard shortcut, ambient, runbot or announcement.
 */

//#region Listeners
// Listeners must be registered synchronously, MV3 does not dispatch the waking event to listeners added later
listenNavigation();

// Started at evaluation, before any event: the install versions must be written after its version integrity check
// (same as the full build checkVersion, without the remote data nor the update badge)
const odooDataLoading = refreshBundledVersions().catch((e) => {
    Console.error(e);
    return {};
});

Runtime.onInstalled.addListener(async (details) => {
    if (details.reason !== Runtime.OnInstalledReason.INSTALL) return;
    await enableBuildFeatures();
    await enableAvailableVersions(await odooDataLoading);
});

Runtime.onMessage.addListener((message, sender) => {
    if (!message.action) return undefined;
    switch (message.action) {
        case MESSAGE_ACTION.TO_BACKGROUND.GET_FEATURES_LIST:
            return getFeaturesListResponse();
        case MESSAGE_ACTION.TO_BACKGROUND.UPDATE_EXT_STATUS:
            return updateTabState(message, sender);
    }
    // TAB_LOADED: only used to refresh the context menu, which a lite build doesn't have
    return undefined;
});
//#endregion

/**
 * A lite build is installed for its feature(s): enable them and every available Odoo version,
 * so it works without opening the options. Both remain configurable in the options.
 */
async function enableBuildFeatures() {
    const features = await loadFeaturesConfiguration();
    // Same install defaults as the full build
    const settings = await getCurrentSettings(features);
    for (const feature of features) {
        settings[`${feature.id}Enabled`] = true;
    }
    await StorageSync.set(settings);
}

async function enableAvailableVersions(odooData) {
    const versions = odooData?.availableOdooVersions;
    if (!versions?.length) return;
    // Written after the version integrity check of refreshBundledVersions, so it is not overwritten
    await StorageSync.set({ supportedVersions: versions.map((v) => sanitizeVersion(v)) });
}

async function main() {
    // Start loading features immediately, messages handlers await the same promise
    loadFeaturesConfiguration();

    await checkHostsExpiration();
    await listenRequest();
}

main().catch((e) => Console.error(e));
