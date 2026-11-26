import { loadFeaturesConfiguration } from '../../configuration.js';
import { getWebsiteOff } from '../../src/api/local.js';
import { isSupportedOdoo, originMatches } from '../../src/utils/authorize.js';
import { Action, Console, I18n } from '../../src/utils/browser.js';
import { resolveLanguage, translate } from '../../src/utils/i18n.js';

const ICON = '/images/icon_128.png';
const ICON_GREY = '/images/icon_128_grey.png';
const BADGE_TEXT = '!';
// Joorney orange, navy text: the red badges are the update and "OFF" ones
const BADGE_COLOR = '#fca311';
const BADGE_TEXT_COLOR = '#13213c';

/**
 * The tab's toolbar icon tells, without opening the popup, what the popup explains (popup/index.js):
 * - grey: Joorney does nothing on this page, no Odoo session or its Odoo version turned off in Versions, and no
 *   Runbot feature for this host (they run without a session and skip the version checks)
 * - orange "!" badge: the page's Odoo version is turned off
 * Set on every page load (TAB_LOADED), so it is right whatever the browser keeps of a tab's state across navigations.
 */
export async function updateToolbarState(tab, versionInfo) {
    try {
        if (!tab?.id || !tab.url?.startsWith('http')) return;
        const origin = new URL(tab.url).origin;
        // Alt+Shift+F owns the tab: "OFF" badge, action disabled (background/src/keyboard_shortcut.js)
        if ((await getWebsiteOff()).has(origin)) return;

        const { isOdoo, version } = versionInfo ?? {};
        const versionOff = Boolean(isOdoo && version) && !(await isSupportedOdoo(version));
        const features = await loadFeaturesConfiguration();
        const runbotHere = features.some((f) => f.limited && originMatches(f.limitedOrigins ?? [], origin));
        const grey = (!isOdoo || versionOff) && !runbotHere;

        const tabId = tab.id;
        // A tab icon has no reset value: back to the manifest default
        await Action.setIcon({ tabId, path: grey ? ICON_GREY : ICON });
        if (versionOff) {
            await Action.setBadgeText({ tabId, text: BADGE_TEXT });
            await Action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
            await Action.setBadgeTextColor?.({ tabId, color: BADGE_TEXT_COLOR });
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
