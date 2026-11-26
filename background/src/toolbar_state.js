import { loadFeaturesConfiguration } from '../../configuration.js';
import { isWebsiteDisabled } from '../../src/api/local.js';
import { isSupportedOdoo, originMatches } from '../../src/utils/authorize.js';
import { Action, Console, I18n, StorageLocal, sendTabMessage, Tabs } from '../../src/utils/browser.js';
import { resolveLanguage, translate } from '../../src/utils/i18n.js';
import { MESSAGE_ACTION } from '../../src/utils/messaging.js';

const ICON = '/images/icon_128.png';
const ICON_GREY = '/images/icon_128_grey.png';
const ICON_RED = '/images/icon_128_red.png';
const VERSION_BADGE_TEXT = '!';
// Joorney orange, navy text: the red badge is the update one
const VERSION_BADGE_COLOR = '#fca311';
const VERSION_BADGE_TEXT_COLOR = '#13213c';

/**
 * The tab's toolbar icon tells, without opening the popup, what the popup explains (popup/index.js):
 * - red: Joorney is disabled on the site from the popup power button, nothing runs there (Runbot features included)
 * - grey: Joorney does nothing on this page, no Odoo session or its Odoo version turned off in Versions, and no
 *   Runbot feature for this host (they run without a session and skip the version checks)
 * - orange "!" badge: the page's Odoo version is turned off
 * Set on every page load (TAB_LOADED), so it is right whatever the browser keeps of a tab's state across navigations,
 * and when the disabled sites change (watchDisabledWebsites).
 */
export async function updateToolbarState(tab, versionInfo) {
    try {
        if (!tab?.id || !tab.url?.startsWith('http')) return;
        const origin = new URL(tab.url).origin;
        const tabId = tab.id;

        if (await isWebsiteDisabled(origin)) {
            const lang = await resolveLanguage({ origin });
            await Action.setIcon({ tabId, path: ICON_RED });
            // null: back to the global badge (the update one on development installs)
            await Action.setBadgeText({ tabId, text: null });
            await Action.setTitle({ tabId, title: translate(lang, 'badge_disabledTitle') });
            return;
        }

        const { isOdoo, version } = versionInfo ?? {};
        const versionOff = Boolean(isOdoo && version) && !(await isSupportedOdoo(version));
        const features = await loadFeaturesConfiguration();
        const runbotHere = features.some((f) => f.limited && originMatches(f.limitedOrigins ?? [], origin));
        const grey = (!isOdoo || versionOff) && !runbotHere;

        // A tab icon has no reset value: back to the manifest default
        await Action.setIcon({ tabId, path: grey ? ICON_GREY : ICON });
        if (versionOff) {
            await Action.setBadgeText({ tabId, text: VERSION_BADGE_TEXT });
            await Action.setBadgeBackgroundColor({ tabId, color: VERSION_BADGE_COLOR });
            await Action.setBadgeTextColor?.({ tabId, color: VERSION_BADGE_TEXT_COLOR });
        } else {
            // null: back to the global badge (the update one on development installs)
            await Action.setBadgeText({ tabId, text: null });
        }

        let title = I18n.getMessage('ext_name');
        if (versionOff || grey) {
            const lang = await resolveLanguage({ origin });
            title = versionOff
                ? translate(lang, 'badge_versionOffTitle', version)
                : translate(lang, 'badge_noSessionTitle');
        }
        await Action.setTitle({ tabId, title });
    } catch (error) {
        // The tab may be gone meanwhile: its state goes with it
        Console.warn(error);
    }
}

// The popup and the Settings page only write the disabled sites: the open tabs of the sites that changed follow
// at once, their features at the next page load. Registered at the service worker top level (MV3 wake-up)
export function watchDisabledWebsites() {
    StorageLocal.onChanged.addListener((changes) => {
        if (!changes.offs) return;
        const before = new Set(changes.offs.oldValue ?? []);
        const after = new Set(changes.offs.newValue ?? []);
        const changed = new Set([...before, ...after].filter((origin) => before.has(origin) !== after.has(origin)));
        if (changed.size) refreshOrigins(changed).catch((ex) => Console.warn(ex));
    });
}

async function refreshOrigins(origins) {
    const tabs = await Tabs.query({ url: ['http://*/*', 'https://*/*'] });
    for (const tab of tabs) {
        let origin;
        try {
            origin = new URL(tab.url).origin;
        } catch {
            continue;
        }
        if (!origins.has(origin)) continue;
        // The content script knows the page's Odoo (undefined if it is not there yet: TAB_LOADED will tell)
        const versionInfo = await sendTabMessage(tab.id, MESSAGE_ACTION.TO_CONTENT.REQUEST_ODOO_INFO);
        await updateToolbarState(tab, versionInfo);
    }
}
