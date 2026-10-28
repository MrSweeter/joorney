import { buildAdminDebugURL, isRunbotBuildHost, openVersionKey } from '../../src/shared/limited/runbot_content.js';
import { Console, StorageSession, Tabs } from '../../src/utils/browser.js';

const PENDING_KEY = 'runbotAdminDebugTabs';
// Leave time to pass the runbot browser check
const PENDING_DURATION_MILLIS = 2 * 60 * 1000;

async function getPendingTabs() {
    const { [PENDING_KEY]: pending } = await StorageSession.get({ [PENDING_KEY]: {} });
    return pending;
}

async function setPendingTab(tabId, expiresAt) {
    const pending = await getPendingTabs();
    if (expiresAt) pending[tabId] = expiresAt;
    else delete pending[tabId];
    await StorageSession.set({ [PENDING_KEY]: pending });
}

// Open a runbot build link in a real tab: the link is behind a browser check (Cloudflare Turnstile) that a background
// request cannot pass. Once the tab reaches the build host, onRunbotNavigationCommitted rewrites it to the admin/debug login.
export async function openRunbotAdminDebug(request, sender) {
    try {
        const url = new URL(request.href);
        if (url.host !== 'runbot.odoo.com') return { error: `Not a runbot link: ${request.href}` };
        if (!sender.tab) return { error: 'No tab to open runbot from' };

        // Mark the tab as pending before navigating, the redirection may commit before an awaited write
        const tabId = request.newTab
            ? (
                  await Tabs.create({
                      url: 'about:blank',
                      active: false,
                      index: sender.tab.index + 1,
                      openerTabId: sender.tab.id,
                  })
              ).id
            : sender.tab.id;

        await setPendingTab(tabId, Date.now() + PENDING_DURATION_MILLIS);
        await Tabs.update(tabId, { url: url.href });
        return {};
    } catch (ex) {
        Console.warn(ex);
        return { error: ex.toString() };
    }
}

export async function onRunbotNavigationCommitted(details) {
    if (details.frameId !== 0 || !details.url.startsWith('http')) return;

    const pending = await getPendingTabs();
    const expiresAt = pending[details.tabId];
    if (!expiresAt) return;

    const url = new URL(details.url);
    // Browser check or redirection still in progress
    if (url.host === 'runbot.odoo.com' && Date.now() < expiresAt) return;

    await setPendingTab(details.tabId, undefined);
    if (Date.now() >= expiresAt || !isRunbotBuildHost(url.host)) return;
    if (url.searchParams.has(openVersionKey)) return;

    await Tabs.update(details.tabId, { url: buildAdminDebugURL(url.href) });
}
