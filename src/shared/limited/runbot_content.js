import ContentFeature from '../../generic/content.js';
import { isAuthorizedLimitedFeature } from '../../utils/authorize.js';
import { sendRuntimeMessage } from '../../utils/browser.js';
import { RunbotException } from '../../utils/error.js';
import { MESSAGE_ACTION } from '../../utils/messaging.js';
import { sanitizeURL } from '../../utils/util.js';

export const openVersionKey = 'joorney-runbot';
export const searchVersionPath = 'runbot/r-d-1?search=';

export function getRunbotOpenUrl(version) {
    return `https://runbot.odoo.com?${openVersionKey}=${version}`;
}

export function isRunbotBuildHost(host) {
    return /^[\w-]+\.runbot\d{3}\.odoo\.com$/.test(host);
}

export function buildAdminDebugURL(urlArg) {
    if (!urlArg) return undefined;
    const url = new URL(urlArg);

    url.pathname = '/web/login';
    url.search = url.search ? `${url.search}&debug=1` : 'debug=1';
    url.search = `${url.search}&${openVersionKey}=login`;
    return url.toString();
}

export default class LimitedRunbotContentFeature extends ContentFeature {
    async load(urlArg, _versionInfo) {
        const url = sanitizeURL(urlArg);

        if (!(await isAuthorizedLimitedFeature(this.configuration.id, this.configuration.limitedOrigins, url))) return;

        this.loadFeature(url);
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
        return buildAdminDebugURL(urlArg);
    }

    async openRunbot(hrefArg, newTab) {
        let finalURL = 'https://runbot.odoo.com/';
        const href = new URL(hrefArg, finalURL).href;
        if (href.includes(searchVersionPath)) {
            finalURL = href;
        } else if (href !== finalURL) {
            // Build links (/runbot/run/<id>) are behind a browser check (Cloudflare Turnstile) and redirect to the
            // build host: the background opens the link in a real tab and rewrites the URL once on the build host
            const response = await sendRuntimeMessage(MESSAGE_ACTION.TO_BACKGROUND.OPEN_RUNBOT_ADMIN_DEBUG, {
                href: href,
                newTab: newTab,
            });
            if (!response || response.error) {
                throw RunbotException(response?.error ?? 'No response from background');
            }
            return;
        }

        const finalLink = document.createElement('a');
        finalLink.href = finalURL;
        finalLink.target = newTab ? '_blank' : '';
        // Manage event to open tab without switching to it
        const event = new MouseEvent('click', { ctrlKey: newTab });
        finalLink.dispatchEvent(event);
    }
}
