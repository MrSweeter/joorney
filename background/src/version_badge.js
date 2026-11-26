import { getWebsiteOff } from '../../src/api/local.js';
import { isSupportedOdoo } from '../../src/utils/authorize.js';
import { Action, Console, I18n } from '../../src/utils/browser.js';
import { resolveLanguage, translate } from '../../src/utils/i18n.js';

const BADGE_TEXT = '!';
// Joorney orange, navy text: the red badges are the update and "OFF" ones
const BADGE_COLOR = '#fca311';
const BADGE_TEXT_COLOR = '#13213c';

/**
 * The page's Odoo version is turned off on the options Versions page: no host feature runs there (the Runbot ones
 * still do). The popup says so; the toolbar icon hints it with a per-tab badge, set or cleared on every page load
 * (TAB_LOADED), so it is right whatever the browser keeps of a tab's badge across navigations.
 */
export async function updateVersionBadge(tab, versionInfo) {
    try {
        if (!tab?.id || !tab.url?.startsWith('http')) return;
        const origin = new URL(tab.url).origin;
        // Alt+Shift+F keeps its "OFF" badge (background/src/keyboard_shortcut.js)
        if ((await getWebsiteOff()).has(origin)) return;

        const { isOdoo, version } = versionInfo ?? {};
        const versionOff = Boolean(isOdoo && version) && !(await isSupportedOdoo(version));
        if (!versionOff) {
            // null: back to the global badge (the update one on development installs)
            await Action.setBadgeText({ tabId: tab.id, text: null });
            await Action.setTitle({ tabId: tab.id, title: I18n.getMessage('ext_name') });
            return;
        }

        const lang = await resolveLanguage({ origin });
        await Action.setBadgeText({ tabId: tab.id, text: BADGE_TEXT });
        await Action.setBadgeBackgroundColor({ tabId: tab.id, color: BADGE_COLOR });
        await Action.setBadgeTextColor?.({ tabId: tab.id, color: BADGE_TEXT_COLOR });
        await Action.setTitle({ tabId: tab.id, title: translate(lang, 'badge_versionOffTitle', version) });
    } catch (error) {
        // The tab may be gone meanwhile: the badge goes with it
        Console.warn(error);
    }
}
