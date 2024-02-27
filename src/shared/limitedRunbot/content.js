import { Runtime } from '../../utils/browser.js';
import ContentFeature from '../../generic/content.js';
import { isAuthorizedLimitedFeature } from '../../utils/authorize.js';
import { sanitizeURL } from '../../utils/url_manager.js';
import { MESSAGE_ACTION } from '../../utils/messaging.js';

export const openVersionKey = 'qol-runbot';

export default class LimitedRunbotContentFeature extends ContentFeature {
    async load(urlArg) {
        const url = sanitizeURL(urlArg);

        if (!(await isAuthorizedLimitedFeature(this.configuration.id, url))) return;

        this.loadFeature(url);
    }

    async loadFeature(url) {
        throw new Error('Not yet implemented');
    }

    getOpenData(url) {
        if (!url.searchParams.has(openVersionKey)) return false;
        const value = url.searchParams.get(openVersionKey);
        return value ? value : false;
    }

    isRunbotPage(urlArg) {
        if (!urlArg) return false;
        const url = typeof urlArg === 'object' ? urlArg : new URL(urlArg);
        return url.host === 'runbot.odoo.com';
    }

    isRunbotPageWithAutoOpenHash(urlArg) {
        if (!urlArg) return false;
        const url = typeof urlArg === 'object' ? urlArg : new URL(urlArg);
        const openVersion = this.getOpenData(url);
        if (!openVersion) return false;
        return this.isRunbotPage(url);
    }

    isRunbotSelectorPageWithLogin(urlArg) {
        if (!urlArg) return false;
        const url = typeof urlArg === 'object' ? urlArg : new URL(urlArg);
        if (!this.getOpenData(url)) return false;
        return url.pathname === '/web/database/selector';
    }

    getAdminDebugURL(urlArg) {
        if (!urlArg) return undefined;
        const url = typeof urlArg === 'object' ? urlArg : new URL(urlArg);

        url.pathname = '/web/login';
        url.search = url.search ? `${url.search}&debug=1` : 'debug=1';
        url.search = `${url.search}&qol-runbot=login`;
        return url.toString();
    }

    async openRunbot(href, newTab) {
        let finalURL = 'https://runbot.odoo.com/';
        if (href !== finalURL) {
            // Messaging flow require due to CORS on runbot
            const response = await Runtime.sendMessage({
                action: MESSAGE_ACTION.GET_FINAL_RUNBOT_URL,
                href: href,
            });
            finalURL = this.getAdminDebugURL(response.url) ?? finalURL;
        }

        const finalLink = document.createElement('a');
        finalLink.href = finalURL;
        finalLink.target = newTab ? '_blank' : '';
        // Manage event to open tab without switching to it
        const event = new MouseEvent('click', { ctrlKey: newTab });
        finalLink.dispatchEvent(event);
    }
}

export async function appendSmartLogin(urlStr) {
    const { adminDebugLoginRunbotEnabled, impersonateLoginRunbotEnabled, autoOpenRunbotEnabled } =
        await chrome.storage.sync.get({
            adminDebugLoginRunbotEnabled: false,
            impersonateLoginRunbotEnabled: false,
            autoOpenRunbotEnabled: false,
        });

    if (adminDebugLoginRunbotEnabled && isRunbotPage(urlStr)) {
        await appendRunbotAdminDebugLogin(urlStr);
    }

    if (autoOpenRunbotEnabled && isRunbotPageWithAutoOpenHash(urlStr)) {
        await autoOpenRunbot(urlStr);
    }

    let autologin = false;
    if (adminDebugLoginRunbotEnabled || autoOpenRunbotEnabled) {
        autologin = await checkAdminDebug(urlStr);
    }

    if (!autologin && impersonateLoginRunbotEnabled) {
        await appendRunbotLogin(urlStr);
    }
}
